import express, { Request, Response } from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { NivelSigilo, DocumentoSensivel, AuditoriaOperacao, PartitionInfo } from './src/types.js';

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const DEFAULT_DOCUMENTS: DocumentoSensivel[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    titulo: 'PLANO EXECUTIVO DE CONTINGÊNCIA',
    conteudo: 'Diretrizes táticas para resiliência de infraestrutura crítica governamental sob ataques direcionados.',
    classificacao: 'SECRETO',
    departamento_dono: 'DEFESA',
    versao: 1,
    excluido: false,
    criado_em: new Date(Date.now() - 3600000 * 4).toISOString(),
    atualizado_em: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    titulo: 'ALOCAÇÃO DE RECURSOS ORÇAMENTÁRIOS',
    conteudo: 'Análise confidencial de despesas extraordinárias para fomento da segurança da informação das agências centrais.',
    classificacao: 'CONFIDENCIAL',
    departamento_dono: 'PLANEJAMENTO',
    versao: 1,
    excluido: false,
    criado_em: new Date(Date.now() - 3600000 * 3).toISOString(),
    atualizado_em: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    titulo: 'RELATÓRIO DE INTELIGÊNCIA CIBERNÉTICA',
    conteudo: 'Mecanismos de mitigação ativa baseados na doutrina ISDS V3 face a exploits de dia-zero descobertos na WAN.',
    classificacao: 'ULTRA_SECRETO',
    departamento_dono: 'INTELIGENCIA',
    versao: 1,
    excluido: false,
    criado_em: new Date(Date.now() - 3600000 * 2).toISOString(),
    atualizado_em: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    titulo: 'MANUAL DE COMUNICAÇÃO SECTORIAL',
    conteudo: 'Regras de divulgação pública de incidentes cibernéticos organizacionais no padrão transparente.',
    classificacao: 'PUBLICO',
    departamento_dono: 'OPERACAO_PADRAO',
    versao: 1,
    excluido: false,
    criado_em: new Date(Date.now() - 3600000 * 1).toISOString(),
    atualizado_em: new Date(Date.now() - 3600000 * 1).toISOString()
  }
];

class DatabaseSimulator {
  public documentos: DocumentoSensivel[] = [];
  public auditoria: AuditoriaOperacao[] = [];
  public particoes: PartitionInfo[] = [];
  public advisoryLockEnabled: boolean = true;
  public eventTriggersEnabled: boolean = true;
  public triggersEnabled: boolean = true;

  // For coordinating simulated locks
  private promiseQueue: Promise<any> = Promise.resolve();

  constructor() {
    this.reset();
  }

  public reset() {
    this.documentos = JSON.parse(JSON.stringify(DEFAULT_DOCUMENTS));
    this.auditoria = [];
    this.particoes = [
      { nome: 'auditoria_operacoes_y2026_04', inicio: '2026-04-01', fim: '2026-05-01', status: 'COLD_STORAGE_WORM' },
      { nome: 'auditoria_operacoes_y2026_05', inicio: '2026-05-01', fim: '2026-06-01', status: 'ACTIVE_READ_WRITE' },
      { nome: 'auditoria_operacoes_y2026_06', inicio: '2026-06-01', fim: '2026-07-01', status: 'ACTIVE_READ_WRITE' },
      { nome: 'auditoria_operacoes_y2026_07', inicio: '2026-07-01', fim: '2026-08-01', status: 'ACTIVE_READ_WRITE' },
    ];

    // Build initial ledger blockchain from the default documents
    let lastHash = '0000000000000000000000000000000000000000000000000000000000000000';
    this.documentos.forEach((doc) => {
      const hashAnterior = lastHash;
      const id = crypto.randomUUID();
      const v_dados_post = doc;
      
      const payload = `documentos_sensiveis|${doc.id}|INSERT||${JSON.stringify(v_dados_post)}|${hashAnterior}`;
      const hashIntegridade = crypto.createHash('sha256').update(payload).digest('hex');

      this.auditoria.push({
        id,
        tabela_nome: 'documentos_sensiveis',
        registro_id: doc.id,
        operacao: 'INSERT',
        usuario_db: 'auditor_admin',
        aplicacao_nome: 'Simulador_Forense_Setup',
        dados_anteriores: null,
        dados_posteriores: v_dados_post,
        criado_em: doc.criado_em,
        hash_integridade: hashIntegridade,
        hash_anterior: hashAnterior
      });
      lastHash = hashIntegridade;
    });
  }

  // Calculate hash deterministic like the PL/pgSQL function:
  // digest(concat_ws('|', 'documentos_sensiveis', OLD.id::text, v_operacao, v_dados_anteriores, v_dados_posteriores, v_hash_anterior), 'sha256')
  public computeHash(
    registro_id: string,
    operacao: string,
    dados_anteriores: any,
    dados_posteriores: any,
    hash_anterior: string
  ): string {
    const prevStr = dados_anteriores ? JSON.stringify(dados_anteriores) : '';
    const postStr = dados_posteriores ? JSON.stringify(dados_posteriores) : '';
    const payload = `documentos_sensiveis|${registro_id}|${operacao}|${prevStr}|${postStr}|${hash_anterior}`;
    return crypto.createHash('sha256').update(payload).digest('hex');
  }

  // Retrieve previous hash from auditoria_operacoes
  public getLatestHash(): string {
    if (this.auditoria.length === 0) {
      return '0000000000000000000000000000000000000000000000000000000000000000';
    }
    // Retrieve the absolute last item by date/index
    return this.auditoria[this.auditoria.length - 1].hash_integridade;
  }

  // Simulated PL/pgSQL processar_auditoria_documentos
  // Returns true if processed successfully, false or throws if denied by constraints/triggers
  public async mutateDocument(
    id: string,
    operationType: 'UPDATE' | 'DELETE_PHYSICAL',
    newData: Partial<DocumentoSensivel> | null,
    appContext: string,
    bypassLocks: boolean = false
  ): Promise<boolean> {
    
    const executeAction = async () => {
      const oldDocIndex = this.documentos.findIndex((d) => d.id === id);
      if (oldDocIndex === -1) {
        throw new Error('Registro não encontrado na tabela de documentos.');
      }
      
      const oldDoc = this.documentos[oldDocIndex];
      let lastHash = this.getLatestHash();

      if (operationType === 'DELETE_PHYSICAL') {
        // Redireciona a deleção física para uma atualização lógica interna segura
        if (oldDoc.excluido) {
          return true; // Se já excluído logicamente, cancela
        }

        const oldDocCopy = { ...oldDoc };
        const updatedDoc: DocumentoSensivel = {
          ...oldDoc,
          excluido: true,
          versao: oldDoc.versao + 1,
          atualizado_em: new Date().toISOString()
        };

        this.documentos[oldDocIndex] = updatedDoc;

        // Process audit log
        const hashNovo = this.computeHash(id, 'DELETE_LOGICO', oldDocCopy, updatedDoc, lastHash);
        this.auditoria.push({
          id: crypto.randomUUID(),
          tabela_nome: 'documentos_sensiveis',
          registro_id: id,
          operacao: 'DELETE_LOGICO',
          usuario_db: 'postgres',
          aplicacao_nome: appContext,
          dados_anteriores: oldDocCopy,
          dados_posteriores: updatedDoc,
          criado_em: new Date().toISOString(),
          hash_integridade: hashNovo,
          hash_anterior: lastHash
        });

        return true;
      } else {
        // Update document
        const oldDocCopy = { ...oldDoc };
        const updatedDoc: DocumentoSensivel = {
          ...oldDoc,
          ...newData,
          versao: oldDoc.versao + 1,
          atualizado_em: new Date().toISOString()
        };

        this.documentos[oldDocIndex] = updatedDoc;

        let operacao: 'UPDATE' | 'DELETE_LOGICO' = 'UPDATE';
        if (!oldDocCopy.excluido && updatedDoc.excluido) {
          operacao = 'DELETE_LOGICO';
        }

        // Process audit log
        const hashNovo = this.computeHash(id, operacao, oldDocCopy, updatedDoc, lastHash);
        this.auditoria.push({
          id: crypto.randomUUID(),
          tabela_nome: 'documentos_sensiveis',
          registro_id: id,
          operacao,
          usuario_db: 'postgres',
          aplicacao_nome: appContext,
          dados_anteriores: oldDocCopy,
          dados_posteriores: updatedDoc,
          criado_em: new Date().toISOString(),
          hash_integridade: hashNovo,
          hash_anterior: lastHash
        });

        return true;
      }
    };

    if (this.advisoryLockEnabled && !bypassLocks) {
      // Linearize transaction processing with a promise queue (Exclusive mutex simulation)
      this.promiseQueue = this.promiseQueue.then(executeAction).catch((err) => {
        console.error('Lock transacional falhou no simulador:', err);
        throw err;
      });
      return this.promiseQueue;
    } else {
      // Execute concurrently directly (triggers race conditions in stress test simulation)
      return executeAction();
    }
  }

  // Verify full blockchain integrity
  public verifyLedgerIntegrity(): { isValid: boolean; brokenAtIdx: number | null; details: string } {
    if (this.auditoria.length === 0) {
      return { isValid: true, brokenAtIdx: null, details: 'Nenhum log gravado no ledger.' };
    }

    let expectedPrevHash = '0000000000000000000000000000000000000000000000000000000000000000';

    for (let i = 0; i < this.auditoria.length; i++) {
      const log = this.auditoria[i];

      // 1. Check if hash_anterior matches the actual expected previous hash
      if (log.hash_anterior !== expectedPrevHash) {
        return {
          isValid: false,
          brokenAtIdx: i,
          details: `Quebra de cadeia de custódia no Bloco #${i + 1} (UUID: ${log.id}). ` +
                   `O campo hash_anterior declarado é ${log.hash_anterior.substring(0, 8)}..., ` +
                   `mas o hash calculado do bloco anterior é ${expectedPrevHash.substring(0, 8)}...`
        };
      }

      // 2. Compute local block signature to verify data wasn't modified back-door
      const calculatedHash = this.computeHash(
        log.registro_id,
        log.operacao,
        log.dados_anteriores,
        log.dados_posteriores,
        log.hash_anterior
      );

      if (log.hash_integridade !== calculatedHash) {
        return {
          isValid: false,
          brokenAtIdx: i,
          details: `Integridade de dados violada no Bloco #${i + 1} (UUID: ${log.id}). ` +
                   `O hash do bloco mudou! Armazenado: ${log.hash_integridade.substring(0, 8)}..., ` +
                   `Re-computado do conteúdo: ${calculatedHash.substring(0, 8)}... ` +
                   `Isso indica que as colunas de dados foram alteradas diretamente no banco após a assinatura do trigger!`
        };
      }

      expectedPrevHash = log.hash_integridade;
    }

    return { isValid: true, brokenAtIdx: null, details: 'Ledger 100% íntegro. Todos os blocos estão encadeados criptograficamente de forma linear!' };
  }
}

const db = new DatabaseSimulator();

const app = express();
app.use(express.json());

// API Routes
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.get('/api/estado', (req: Request, res: Response) => {
  const integrity = db.verifyLedgerIntegrity();
  res.json({
    advisoryLockEnabled: db.advisoryLockEnabled,
    eventTriggersEnabled: db.eventTriggersEnabled,
    triggersEnabled: db.triggersEnabled,
    documentos: db.documentos,
    auditoria: db.auditoria,
    particoes: db.particoes,
    integridade: integrity
  });
});

app.post('/api/reset', (req: Request, res: Response) => {
  db.reset();
  res.json({ success: true, message: 'Banco de dados restaurado ao estado íntegro original.' });
});

app.post('/api/config/alterar', (req: Request, res: Response) => {
  const { advisoryLockEnabled, eventTriggersEnabled, triggersEnabled } = req.body;
  
  if (advisoryLockEnabled !== undefined) db.advisoryLockEnabled = !!advisoryLockEnabled;
  if (eventTriggersEnabled !== undefined) db.eventTriggersEnabled = !!eventTriggersEnabled;
  if (triggersEnabled !== undefined) db.triggersEnabled = !!triggersEnabled;

  res.json({
    success: true,
    advisoryLockEnabled: db.advisoryLockEnabled,
    eventTriggersEnabled: db.eventTriggersEnabled,
    triggersEnabled: db.triggersEnabled
  });
});

// GET documentos applying ABAC Row Level Security
app.get('/api/documentos', (req: Request, res: Response) => {
  const reqClearance = (req.query.clearance_level as string) || '';
  const reqDepartment = (req.query.department as string) || '';

  // Simulation of:
  // obter_clearance_level_sessao() >= classificacao AND obter_departamento_sessao() = departamento_dono
  const orderClearance = ['PUBLICO', 'RESTRITO', 'CONFIDENCIAL', 'SECRETO', 'ULTRA_SECRETO'];
  
  const userClearanceValue = orderClearance.indexOf(reqClearance);

  // If credentials are completely empty or unauthenticated
  if (!reqClearance || !reqDepartment) {
    return res.json({
      originalCount: db.documentos.filter(d => !d.excluido).length,
      warning: 'ACESSO NÃO AUTENTICADO: RLS interceptou a consulta e retornou 0 tuplas (Fail-Closed).',
      documentos: []
    });
  }

  const filtered = db.documentos.filter((doc) => {
    if (doc.excluido) return false;
    
    const docLevelValue = orderClearance.indexOf(doc.classificacao);
    const hasClearance = userClearanceValue >= docLevelValue;
    const hasDepartment = doc.departamento_dono === reqDepartment;

    return hasClearance && hasDepartment;
  });

  res.json({
    originalCount: db.documentos.filter(d => !d.excluido).length,
    documentos: filtered,
    clearance_level: reqClearance,
    department: reqDepartment
  });
});

// CREATE a new document
app.post('/api/documentos', async (req: Request, res: Response) => {
  const { titulo, conteudo, classificacao, departamento_dono } = req.body;

  if (!titulo || !conteudo || !classificacao || !departamento_dono) {
    return res.status(400).json({ error: 'Erro de validação: chk_documentos_nao_vazios violada (campos em branco)' });
  }

  const newDoc: DocumentoSensivel = {
    id: crypto.randomUUID(),
    titulo,
    conteudo,
    classificacao,
    departamento_dono,
    versao: 1,
    excluido: false,
    criado_em: new Date().toISOString(),
    atualizado_em: new Date().toISOString()
  };

  db.documentos.push(newDoc);

  // Append insertion to auditoria operations chain
  const lastHash = db.getLatestHash();
  const hashNovo = db.computeHash(newDoc.id, 'INSERT', null, newDoc, lastHash);
  
  db.auditoria.push({
    id: crypto.randomUUID(),
    tabela_nome: 'documentos_sensiveis',
    registro_id: newDoc.id,
    operacao: 'INSERT',
    usuario_db: 'postgres',
    aplicacao_nome: 'API_Gateway_Post_Service',
    dados_anteriores: null,
    dados_posteriores: newDoc,
    criado_em: new Date().toISOString(),
    hash_integridade: hashNovo,
    hash_anterior: lastHash
  });

  res.json({ success: true, documento: newDoc });
});

// UPDATE document (Trigger simulation with dynamic auditing)
app.put('/api/documentos/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { titulo, conteudo, classificacao, departamento_dono } = req.body;

  try {
    const success = await db.mutateDocument(
      id,
      'UPDATE',
      { titulo, conteudo, classificacao, departamento_dono },
      'API-Gateway_Servico-Inteligencia-Nacional'
    );
    res.json({ success, message: 'Documento atualizado com auditoria registrada.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE document (Redirects physical deletes to Logical delete in PL/pgSQL trigger)
app.delete('/api/documentos/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const success = await db.mutateDocument(
      id,
      'DELETE_PHYSICAL',
      null,
      'Console_Auditoria_Forense'
    );
    res.json({
      success,
      redirected: true,
      message: 'Trigger de Segurança trg_seguranca_documentos disparada. O comando DELETE físico foi abortado e convertido em um UPDATE lógico (excluido = true, versao = versao + 1).'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// FORCE Edit an audit log to simulate direct DBMS back-door manipulation (Tática A Malicious DBA simulation)
app.post('/api/auditoria/adulterar', (req: Request, res: Response) => {
  if (db.triggersEnabled) {
    return res.status(403).json({
      code: 'restrict_violation',
      error: 'VIOLAÇÃO DE POLÍTICA DE SEGURANÇA: Alterações ou exclusões na tabela de auditoria de operações não são permitidas por este mecanismo (Trigger trg_bloqueio_mutacao_auditoria ATIVA).'
    });
  }

  const { index, campo, valor } = req.body;
  if (index < 0 || index >= db.auditoria.length) {
    return res.status(400).json({ error: 'Índice de auditoria inválido.' });
  }

  const log = db.auditoria[index];
  
  if (campo === 'conteudo') {
    if (log.dados_posteriores) {
      log.dados_posteriores.conteudo = valor;
    }
  } else if (campo === 'aplicacao_nome') {
    log.aplicacao_nome = valor;
  } else if (campo === 'operacao') {
    log.operacao = valor;
  }

  res.json({
    success: true,
    message: 'Adulteração simulada bem-sucedida! Como a trigger de integridade foi desativada no seu console, os dados foram corrompidos diretamente no armazenamento físico.',
    auditoria: db.auditoria
  });
});

// Executar DDL simulating admin sabotages protected by Event Triggers
app.post('/api/executar-ddl', (req: Request, res: Response) => {
  const { sql } = req.body;
  const sqlClean = sql.trim().toUpperCase();

  if (db.eventTriggersEnabled) {
    if (sqlClean.includes('DROP TABLE AUDITORIA_OPERACOES') || sqlClean.includes('DROP TABLE DE_AUDITORIA')) {
      return res.status(403).json({
        code: 'insufficient_privilege',
        error: `VIOLAÇÃO CRÍTICA DE DIRETRIZ ISDS: A remoção física (public.auditoria_operacoes) de infraestruturas forenses e de controle de acesso é sumariamente proibida. (Event Trigger evt_bloquear_drop_critico ACIONADO)`
      });
    }

    if (sqlClean.includes('DROP TABLE DOCUMENTOS_SENSIVEIS')) {
      return res.status(403).json({
        code: 'insufficient_privilege',
        error: `VIOLAÇÃO CRÍTICA DE DIRETRIZ ISDS: A remoção física (public.documentos_sensiveis) de infraestruturas forenses e de controle de acesso é sumariamente proibida. (Event Trigger evt_bloquear_drop_critico ACIONADO)`
      });
    }

    if (sqlClean.includes('DISABLE TRIGGER') || sqlClean.includes('DISABLE TRIGGER ALL') || sqlClean.includes('DISABLE TRIGGER trg_seguranca_documentos')) {
      return res.status(403).json({
        code: 'insufficient_privilege',
        error: `VIOLAÇÃO CRÍTICA DE DIRETRIZ ISDS: Modificações estruturais ou desativação de triggers nas tabelas de segurança (public.documentos_sensiveis) são bloqueadas por mecanismo interno de defesa. (Event Trigger evt_bloquear_ddl_critico ACIONADO)`
      });
    }
  }

  // If event triggers are off, process simulation
  if (sqlClean.includes('DROP TABLE AUDITORIA_OPERACOES')) {
    db.auditoria = [];
    return res.json({ success: true, message: 'Executado com sucesso: Tabela auditoria_operacoes foi DESTRUÍDA. Todos os dados forenses históricos sumiram!' });
  }

  if (sqlClean.includes('DROP TABLE DOCUMENTOS_SENSIVEIS')) {
    db.documentos = [];
    return res.json({ success: true, message: 'Executado com sucesso: Tabela documentos_sensiveis excluída física e irrevogavelmente.' });
  }

  if (sqlClean.includes('DISABLE TRIGGER ALL') || sqlClean.includes('DISABLE TRIGGER')) {
    db.triggersEnabled = false;
    return res.json({ success: true, message: 'Executado com sucesso: Triggers de segurança desativadas na tabela de documentos e auditoria.' });
  }

  if (sqlClean.includes('SELECT')) {
    return res.json({ success: true, message: 'Comando executado: Registros selecionados com sucesso aplicando filtros ativos.' });
  }

  res.json({ success: true, message: `Comando executado: ${sql.substring(0, 40)}... executado com sucesso.` });
});

// WORM Partition Management API
app.post('/api/particoes/detach', (req: Request, res: Response) => {
  const { nome } = req.body;
  const index = db.particoes.findIndex(p => p.nome === nome);
  if (index === -1) {
    return res.status(404).json({ error: 'Partição não encontrada.' });
  }

  if (db.eventTriggersEnabled) {
    return res.status(403).json({
      code: 'insufficient_privilege',
      error: `VIOLAÇÃO CRÍTICA DE DIRETRIZ ISDS: A alteração estrutural (${nome}) para extração (DETACH) é bloqueada sem assinatura conjunta do canal SIEM. (Event Trigger evt_bloquear_ddl_critico ACIONADO)`
    });
  }

  db.particoes[index].status = 'DETACHED';
  res.json({
    success: true,
    message: `Partição ${nome} separada com sucesso via ALTER TABLE DETACH PARTITION. Ela se tornou um objeto WORM frio independente e pronto para exportação offline.`
  });
});

app.post('/api/particoes/drop', (req: Request, res: Response) => {
  const { nome } = req.body;
  const index = db.particoes.findIndex(p => p.nome === nome);
  if (index === -1) {
    return res.status(404).json({ error: 'Partição não encontrada.' });
  }

  if (db.particoes[index].status !== 'DETACHED') {
    return res.status(400).json({ error: 'Falha: Somente partições desvinculadas (DETACHED) podem ser removidas de forma imutável para não quebrar a integridade cronológica de logs ativos.' });
  }

  db.particoes.splice(index, 1);
  res.json({ success: true, message: `Partição de cold storage ${nome} foi permanentemente removida (DROP TABLE) para expurgo regular de dados de acordo com a política de retenção legal.` });
});

// CONCURRENCY STRESS-TEST (Replicating Etapa 1 Race Conditions & Advisory Locks)
app.post('/api/stress-test', async (req: Request, res: Response) => {
  const { times = 12 } = req.body;
  const docId = '11111111-1111-1111-1111-111111111111';

  const originalDoc = db.documentos.find((d) => d.id === docId);
  if (!originalDoc) {
    return res.status(400).json({ error: 'Documento plano executivo não encontrado para teste de sobrecarga.' });
  }

  const payloadList = Array.from({ length: times }).map((_, i) => ({
    titulo: 'PLANO EXECUTIVO DE CONTINGÊNCIA',
    conteudo: `Instruções extraordinárias - Carga Concorrente #${i + 1}`,
  }));

  const promises = payloadList.map(async (data, i) => {
    // Artificial small random processing delay to trigger overlap on reads when advisory locks are disabled
    const delay = Math.floor(Math.random() * 350);
    await new Promise((resolve) => setTimeout(resolve, delay));

    return db.mutateDocument(
      docId,
      'UPDATE',
      data,
      `API_Stress_Thread_${i + 1}`,
      !db.advisoryLockEnabled // Pass bypassLocks = true if Advisory Lock toggle is OFF
    );
  });

  try {
    await Promise.all(promises);
    const integrity = db.verifyLedgerIntegrity();

    res.json({
      success: true,
      advisoryLockEnabled: db.advisoryLockEnabled,
      auditLength: db.auditoria.length,
      integridade: integrity,
      message: db.advisoryLockEnabled
        ? 'Estresse concluído em fila estritamente linearizada por Advisory Locks (pg_advisory_xact_lock). A cadeia criptográfica permaneceu 100% íntegra!'
        : 'Estresse concluído SEM proteção de Advisory Lock. Como as transações executaram simultaneamente no mesmo snapshot de leitura sem concorrência linearizada, ocorreram colisões e ramificações ("forks") de hashes anteriores redundantes, invalidando a integridade lineal do Ledger!'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Gemini AI auditing assistant
app.post('/api/audit-ai', async (req: Request, res: Response) => {
  const { prompt, context } = req.body;

  try {
    const userPrompt = `
Você é o Engenheiro Chefe de Confiabilidade e Auditoria de Segurança Forense de Banco de Dados de mais alta qualificação.
O usuário está utilizando o "Configurador e Simulador de Core Forense (Diretriz ISDS V3)".

--- CONTEXTO ATUAL DO SIMULADOR ---
- Advisory Lock habilitado: ${db.advisoryLockEnabled ? 'Sim' : 'Não'}
- Triggers DML ativos (tabela auditoria): ${db.triggersEnabled ? 'Sim' : 'Não'}
- Event Triggers DDL ativos: ${db.eventTriggersEnabled ? 'Sim' : 'Não'}
- Quantidade de Documentos Ativos: ${db.documentos.filter(d => !d.excluido).length}
- Quantidade de Registros na Cadeia de Auditoria: ${db.auditoria.length}
- Estado Atual da Integridade de Dados: ${JSON.stringify(db.verifyLedgerIntegrity())}
----------------------------------
O usuário está fazendo a seguinte pergunta ou enviando o seguinte código para análise:

"${prompt}"

Por favor, forneça uma análise técnica impecável baseada nas diretrizes informadas na iteração. No caso de perguntas em português, responda em português claro, profissional, didático e de alta precisão técnica. Fale sobre:
1. Vetor de risco cibernético associado.
2. Como os Advisory Locks, RLS, Event Triggers, Blockchain-like ledger ou WORM resolvem ou mitigam a ameaça descrita.
3. Sugestões de hardening ou boas práticas de banco de dados para segurança em nível de nuvem e contêineres resilientes.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: userPrompt,
    });

    res.json({ text: response.text });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Serve frontend assets
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Core Forense Server] Rodando com sucesso na porta ${PORT}`);
  });
}

startServer();
