export type NivelSigilo = 'PUBLICO' | 'RESTRITO' | 'CONFIDENCIAL' | 'SECRETO' | 'ULTRA_SECRETO';

export interface DocumentoSensivel {
  id: string;
  titulo: string;
  conteudo: string;
  classificacao: NivelSigilo;
  departamento_dono: string;
  versao: number;
  excluido: boolean;
  criado_em: string;
  atualizado_em: string;
}

export interface AuditoriaOperacao {
  id: string;
  tabela_nome: string;
  registro_id: string;
  operacao: 'INSERT' | 'UPDATE' | 'DELETE_LOGICO';
  usuario_db: string;
  aplicacao_nome: string;
  dados_anteriores: Partial<DocumentoSensivel> | null;
  dados_posteriores: Partial<DocumentoSensivel> | null;
  criado_em: string;
  hash_integridade: string;
  hash_anterior: string;
}

export interface PartitionInfo {
  nome: string;
  inicio: string;
  fim: string;
  status: 'ACTIVE_READ_WRITE' | 'COLD_STORAGE_WORM' | 'DETACHED';
}

export interface DatabaseState {
  documentos: DocumentoSensivel[];
  auditoria: AuditoriaOperacao[];
  particoes: PartitionInfo[];
  advisoryLockEnabled: boolean;
  eventTriggersEnabled: boolean;
  triggersEnabled: boolean;
}
