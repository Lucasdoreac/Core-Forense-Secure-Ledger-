import React, { useState } from 'react';
import { AuditoriaOperacao } from '../types';
import { ShieldCheck, ShieldAlert, FileText, User, Terminal, ArrowDown, HelpCircle, HardDrive, Edit2, CheckCircle2, RotateCcw } from 'lucide-react';

interface LedgerTimelineProps {
  auditoria: AuditoriaOperacao[];
  onAdulterarLog: (index: number, campo: string, valor: string) => Promise<any>;
  triggersEnabled: boolean;
  onAlterarTriggers: (val: boolean) => void;
  integridade: { isValid: boolean; brokenAtIdx: number | null; details: string };
  fetchEstado: () => void;
}

export default function LedgerTimeline({
  auditoria,
  onAdulterarLog,
  triggersEnabled,
  onAlterarTriggers,
  integridade,
  fetchEstado,
}: LedgerTimelineProps) {
  const [selectedBlockIdx, setSelectedBlockIdx] = useState<number | null>(null);
  
  // Backdoor bypass state in frontend which simulates turning off database triggers first
  const [dbaBypassMode, setDbaBypassMode] = useState(false);
  
  // Locally edited block changes
  const [editingBlockIdx, setEditingBlockIdx] = useState<number | null>(null);
  const [fieldValue, setFieldValue] = useState('');
  const [customField, setCustomField] = useState('conteudo');
  const [corruptingError, setCorruptingError] = useState<string | null>(null);

  const handleBypassToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setDbaBypassMode(checked);
    onAlterarTriggers(!checked); // Deactivating database triggers if bypass mode is enabled
  };

  const handleCorruptAction = async (idx: number) => {
    setCorruptingError(null);
    try {
      await onAdulterarLog(idx, customField, fieldValue);
      setEditingBlockIdx(null);
      setFieldValue('');
    } catch (err: any) {
      setCorruptingError(err.message || 'Mecanismo impediu a edição.');
    }
  };

  const startCorruptEdit = (idx: number, log: AuditoriaOperacao) => {
    setEditingBlockIdx(idx);
    const existingVal = customField === 'conteudo'
      ? (log.dados_posteriores?.conteudo || '')
      : log.aplicacao_nome;
    setFieldValue(existingVal);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header integrity stats */}
      <div className={`border p-5 rounded-xl shadow-2xl relative overflow-hidden ${
        integridade.isValid 
          ? 'bg-gradient-to-r from-emerald-950/20 to-zinc-900 border-emerald-500/20' 
          : 'bg-gradient-to-r from-red-950/20 to-zinc-900 border-red-500/20'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl border ${
              integridade.isValid 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'bg-red-500/10 text-red-400 border-red-500/20'
            }`}>
              {integridade.isValid ? (
                <ShieldCheck className="h-7 w-7" />
              ) : (
                <ShieldAlert className="h-7 w-7 animate-bounce" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-display font-bold text-gray-100 flex items-center gap-2">
                Cadeia de Custódia Digital (Ledger de Auditoria)
              </h2>
              <p className="text-xs text-gray-300 mt-0.5 font-sans">
                Algoritmo de encadeamento hash SHA-256 blockchain-like garantindo auditabilidade à prova de fraudadores.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end gap-1.5 flex-shrink-0">
            <div className={`px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 border uppercase ${
              integridade.isValid 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                : 'bg-red-500/10 text-red-500 border-red-500/30'
            }`}>
              Status: {integridade.isValid ? 'Ledger Íntegro' : 'CADEIA CORROMPIDA'}
            </div>
            <p className="text-[10px] text-gray-400 font-mono">
              Total de Blocos Registrados: {auditoria.length}
            </p>
          </div>
        </div>

        {/* Diagnostic log */}
        <div className={`p-4 rounded-lg text-xs font-mono mt-4 border ${
          integridade.isValid 
            ? 'bg-emerald-950/40 border-emerald-900/30 text-emerald-300' 
            : 'bg-red-950/40 border-red-950/40 text-red-300'
        }`}>
          <div className="font-bold flex items-center gap-1">
            <span>[DIAGNÓSTICO DO LEDGER]</span>
          </div>
          <p className="mt-1 font-sans">{integridade.details}</p>
        </div>
      </div>

      {/* 2. Admin Backdoor and Bypass controls */}
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-start gap-3">
          <Terminal className="h-5 w-5 text-amber-500 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-gray-100">
              Console Administrativo de Auditoria (Configurações do Banco)
            </h3>
            <p className="text-xs text-gray-400">
              Triggers são procedimentos guardiões executados em nível de transatômica no SGDB postgres. Desativá-los permite emular adulterações furtivas de dados nos bytes físicos do disco.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-5 pt-3 border-t border-[#1f2937] items-start sm:items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={dbaBypassMode}
                onChange={handleBypassToggle}
                className="sr-only peer"
                id="dba-bypass-toggle"
              />
              <div className="w-9 h-5 bg-[#374151] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
              <span className="ml-3 text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                Modo Sabotador / DBA Malicioso (Desativador de Triggers)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-black border ${
              triggersEnabled 
                ? 'bg-green-500/10 text-green-400 border-green-500/30' 
                : 'bg-red-500/10 text-red-400 border-red-500/30 animate-pulse'
            }`}>
              TRIGGER trg_bloqueio_mutacao_auditoria: {triggersEnabled ? 'ATIVA (Imutável)' : 'DESATIVADA (Vulnerável)'}
            </span>
          </div>
        </div>

        {dbaBypassMode && (
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs px-4 py-3 rounded-lg flex gap-2">
            <span className="font-bold font-mono text-amber-400 uppercase">ATENÇÃO:</span>
            <span>Com o Modo Sabotador ativo, o banco de dados desabilitou o impedimento do trigger. Você agora possui privilégios de superuser para adulterar dados das tuplas de log e testar as verificações criptográficas do blockchain ledger.</span>
          </div>
        )}
      </div>

      {/* 3. Visual Block Sequence */}
      <div className="space-y-4">
        <h3 className="text-xs font-mono text-gray-400 tracking-wider font-bold">CADEIA CRIPTOGRÁFICA DE TRANSAÇÕES</h3>
        
        <div className="flex flex-col items-center space-y-4 pr-1 pl-1">
          {auditoria.map((log, idx) => {
            const isBrokenHere = !integridade.isValid && integridade.brokenAtIdx !== null && idx >= integridade.brokenAtIdx;
            const isRootBroken = !integridade.isValid && idx === integridade.brokenAtIdx;
            const isSelected = selectedBlockIdx === idx;

            return (
              <React.Fragment key={log.id}>
                {/* Arrow down connector */}
                {idx > 0 && (
                  <div className="flex flex-col items-center py-1">
                    <ArrowDown className={`h-4 w-4 ${isBrokenHere ? 'text-red-500' : 'text-emerald-500'}`} />
                    <span className={`text-[9px] font-mono select-none ${isBrokenHere ? 'text-red-500/50' : 'text-emerald-500/50'}`}>
                      HASH-LINK
                    </span>
                  </div>
                )}

                {/* Ledger Block Node Box */}
                <div
                  id={`audit-block-${idx}`}
                  className={`border rounded-xl w-full p-5 shadow-lg transition-all relative overflow-hidden flex flex-col ${
                    isBrokenHere 
                      ? 'border-red-900 bg-red-950/10 hover:border-red-600/50' 
                      : 'border-[#1f2937] bg-[#111827] hover:border-emerald-500/30'
                  }`}
                >
                  {/* Subtle corner badge for genesis and latest block */}
                  {idx === 0 && (
                    <div className="absolute top-0 right-0 bg-indigo-600/20 text-indigo-400 text-[9px] font-mono uppercase px-2.5 py-1 rounded-bl">
                      Genesis Block
                    </div>
                  )}

                  {idx === auditoria.length - 1 && (
                    <div className="absolute top-0 right-0 bg-emerald-600/20 text-emerald-400 text-[9px] font-mono uppercase px-2.5 py-1 rounded-bl">
                      Último Registrado (Ledger Head)
                    </div>
                  )}

                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-bold text-gray-300">
                          BLOCO INDEPENDENTE #{idx + 1}
                        </span>
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-black border uppercase ${
                          log.operacao === 'INSERT' ? 'bg-indigo-600/25 text-indigo-400 border-indigo-500/30' :
                          log.operacao === 'DELETE_LOGICO' ? 'bg-amber-600/25 text-amber-400 border-amber-500/30' :
                          'bg-cyan-600/25 text-cyan-400 border-cyan-500/30'
                        }`}>
                          {log.operacao}
                        </span>

                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-sm flex items-center gap-1 border ${
                          isBrokenHere 
                            ? 'bg-red-500/10 text-red-400 border-red-500/30' 
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        }`}>
                          {isBrokenHere ? 'LINK QUEBRADO ⚠️' : 'ASSINATURA VÁLIDA 🛡️'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-1.5 text-xs font-mono text-gray-400 pt-1">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-gray-500" />
                          <span className="truncate">Usuário: {log.usuario_db}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Terminal className="h-3 w-3 text-gray-500" />
                          <span className="truncate">App Src: {log.aplicacao_nome}</span>
                        </div>
                        <div className="flex items-center gap-1 col-span-2">
                          <FileText className="h-3 w-3 text-gray-500" />
                          <span className="truncate">Registro UUID: {log.registro_id}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 items-center flex-shrink-0 pt-2 lg:pt-0">
                      {/* Corrupt past logs trigger button in sandbox mode */}
                      {dbaBypassMode && editingBlockIdx !== idx && (
                        <button
                          onClick={() => startCorruptEdit(idx, log)}
                          className="px-2.5 py-1 text-[10px] font-mono text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="h-3 w-3" />
                          Adulterar Dados
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedBlockIdx(isSelected ? null : idx)}
                        className="px-3 py-1 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-xs font-medium rounded transition-colors cursor-pointer"
                      >
                        {isSelected ? 'Ocultar Criptografia' : 'Inspecionar Criptografia'}
                      </button>
                    </div>
                  </div>

                  {/* Editing form when corrupt state is selected */}
                  {editingBlockIdx === idx && (
                    <div className="mt-4 p-4 border border-amber-500/25 bg-amber-500/5 rounded-lg space-y-3">
                      <div className="text-xs font-mono text-amber-300 font-bold uppercase">Backdoor Direct Update Bypass</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-mono text-gray-400 block">Coluna Alvo</label>
                          <select
                            value={customField}
                            onChange={(e) => {
                              setCustomField(e.target.value);
                              const existingVal = e.target.value === 'conteudo'
                                ? (log.dados_posteriores?.conteudo || '')
                                : log.aplicacao_nome;
                              setFieldValue(existingVal);
                            }}
                            className="bg-zinc-800 border border-zinc-700 rounded text-xs px-2 py-1 text-white w-full"
                          >
                            <option value="conteudo">dados_posteriores.conteudo (Dados do Ativo)</option>
                            <option value="aplicacao_nome">aplicacao_nome (Metadados)</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-mono text-gray-400 block">Novo Valor da Tupla</label>
                          <input
                            type="text"
                            value={fieldValue}
                            onChange={(e) => setFieldValue(e.target.value)}
                            className="bg-zinc-800 border border-zinc-700 rounded text-xs px-2.5 py-1 text-white w-full"
                          />
                        </div>
                      </div>

                      {corruptingError && (
                        <div className="text-red-400 font-mono text-[11px] p-2 bg-red-950/20 border border-red-500/20 rounded">
                          {corruptingError}
                        </div>
                      )}

                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleCorruptAction(idx)}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-[11px] font-mono cursor-pointer"
                        >
                          Executar UPDATE Furtivo
                        </button>
                        <button
                          onClick={() => {
                            setEditingBlockIdx(null);
                            setFieldValue('');
                          }}
                          className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[11px] font-mono cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Expanded block cryptographic hashes visualization */}
                  {isSelected && (
                    <div className="mt-4 pt-4 border-t border-[#1f2937] grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                      <div className="space-y-2">
                        <div className="text-gray-400 text-[10px] uppercase tracking-wider block font-bold">Encadeamento Linear de Entrada</div>
                        <div className="bg-[#0f172a] rounded p-2.5 border border-[#1f2937] break-all">
                          <span className="text-indigo-400">HASH_ANTERIOR:</span>
                          <div className="text-[11px] text-gray-300 pt-0.5">{log.hash_anterior}</div>
                        </div>

                        <div className="bg-[#0f172a] rounded p-2.5 border border-[#1f2937] space-y-1">
                          <span className="text-[#a855f7] block">METADADOS CONCATENADOS (SHA-256 INPUT):</span>
                          <div className="text-[10px] text-zinc-400 leading-snug select-all break-all">
                            documentos_sensiveis|{log.registro_id}|{log.operacao}|
                            {log.dados_anteriores ? JSON.stringify(log.dados_anteriores) : ''}|
                            {log.dados_posteriores ? JSON.stringify(log.dados_posteriores) : ''}|
                            {log.hash_anterior}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-gray-400 text-[10px] uppercase tracking-wider block font-bold">Assinatura Digital de Saída</div>
                        <div className={`rounded p-2.5 border break-all ${
                          isBrokenHere 
                            ? 'bg-red-500/5 border-red-500/20 text-red-300' 
                            : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300'
                        }`}>
                          <div className="flex justify-between items-center pb-1">
                            <span className="font-bold">HASH_INTEGRIDADE:</span>
                            <span className="text-[10px] px-1 bg-emerald-500/10 border border-emerald-500/20 rounded font-bold uppercase select-none text-emerald-400">
                              Calculado
                            </span>
                          </div>
                          <div className="text-[11px] font-bold">{log.hash_integridade}</div>
                        </div>

                        {/* If block is in collision state or broken */}
                        {isRootBroken && (
                          <div className="bg-red-500/10 border border-red-500/30 text-red-200 p-2.5 rounded text-[11px] font-sans flex items-start gap-1.5 leading-relaxed">
                            <ShieldAlert className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="font-bold uppercase block text-red-400">Ponto de Quebra!</span>
                              As informações correspondentes a este bloco foram adulteradas de forma direta. O hash resultante gravado no ledger não bate mais com a assinatura matemática dos dados!
                            </div>
                          </div>
                        )}
                        
                        {!isRootBroken && isBrokenHere && (
                          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-200 p-2.5 rounded text-[11px] font-sans flex items-start gap-1.5 leading-relaxed">
                            <HelpCircle className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="font-bold uppercase block text-amber-400">Quebra Sequencial</span>
                              Embora este bloco individual não tenha sido modificado diretamente, a cadeia criptográfica foi invalidada porque o <span className="font-mono text-xs underline">hash_anterior</span> dele aponta para um elo pai cuja integridade faliu.
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
