import React, { useState } from 'react';
import { ToggleLeft, ToggleRight, Zap, RefreshCw, Layers, ShieldCheck, ShieldAlert, Cpu } from 'lucide-react';

interface ConcurrencySimulatorProps {
  advisoryLockEnabled: boolean;
  onToggleAdvisoryLock: (val: boolean) => void;
  onTriggerStressTest: (times: number) => Promise<any>;
  fetchEstado: () => void;
  integridade: { isValid: boolean; brokenAtIdx: number | null; details: string };
}

export default function ConcurrencySimulator({
  advisoryLockEnabled,
  onToggleAdvisoryLock,
  onTriggerStressTest,
  fetchEstado,
  integridade,
}: ConcurrencySimulatorProps) {
  const [loading, setLoading] = useState(false);
  const [concurrencyCount, setConcurrencyCount] = useState(15);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    auditLength: number;
    message: string;
    integridade: any;
  } | null>(null);

  const handleRunStress = async () => {
    setLoading(true);
    setTestResult(null);
    try {
      const data = await onTriggerStressTest(concurrencyCount);
      setTestResult(data);
      await fetchEstado();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Explanatory intro */}
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-5 shadow-2xl space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
            <Cpu className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-md font-display font-bold text-gray-100">
              Simulador de Concorrência e Travas Transacionais
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Sob alta carga concorrente, ler o último hash de uma tabela de logs usando snapshots do MVCC clássico gera "forks" na cadeia SHA-256 de integridade. Advisory Locks resolvem essa condição de corrida através de um semáforo de sincronismo exclusivo.
            </p>
          </div>
        </div>

        {/* Dynamic visual diagram explaining both branches */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Without lock branch */}
          <div className="bg-[#0f172a] border border-red-500/10 rounded-lg p-4 space-y-3 relative">
            <div className="text-[10px] uppercase font-mono font-bold text-red-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-400"></span>
              Isolamento Comum (Sem Advisory Lock)
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed font-sans">
              Transações simultâneas lêem o <span className="font-semibold text-gray-300">mesmo</span> último hash disponível ao mesmo tempo. Ao efetuar o cálculo, produzem logs concorrentes que herdam as mesmas dependências:
            </p>
            <div className="font-mono text-[10px] space-y-1.5 bg-red-950/10 p-2.5 rounded border border-red-900/15">
              <div className="text-gray-500">// Leitura simultânea sob snapshot isolado</div>
              <div className="flex justify-between text-yellow-300">
                <span>Thread #1:</span>
                <span>Lê anterior: [HASH_N]</span>
              </div>
              <div className="flex justify-between text-yellow-300">
                <span>Thread #2:</span>
                <span>Lê anterior: [HASH_N]</span>
              </div>
              <div className="text-red-400">// Colisão! Ambos gravam com hash_anterior idêntico!</div>
              <div className="flex justify-between text-red-300 font-bold">
                <span>Cadeia de Saída:</span>
                <span>RAMIFICAÇÃO "FORK" DETECTADA 🔴</span>
              </div>
            </div>
          </div>

          {/* With lock branch */}
          <div className="bg-[#0f172a] border border-emerald-500/10 rounded-lg p-4 space-y-3 relative">
            <div className="text-[10px] uppercase font-mono font-bold text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              pg_advisory_xact_lock Habilitado (Diretriz ISDS)
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed font-sans">
              O semáforo exclusivo entra em ação antes de recuperar o hash do ledger. Sincroniza e enfileira todas as requisições de modificações de forma linear na memória RAM do banco:
            </p>
            <div className="font-mono text-[10px] space-y-1.5 bg-emerald-500/5 p-2.5 rounded border border-emerald-500/15">
              <div className="text-gray-500">// Fila exclusiva de transações ordenada</div>
              <div className="flex justify-between text-emerald-400">
                <span>Thread #1:</span>
                <span>Locks mutex → escreve Bloco N+1 → Commit (Unlock)</span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>Thread #2:</span>
                <span>Bloqueia aguardando Thread #1 → escreve Bloco N+2</span>
              </div>
              <div className="text-[#a855f7]">// Ordem coerente preservada perfeitamente!</div>
              <div className="flex justify-between text-emerald-300 font-bold">
                <span>Cadeia de Saída:</span>
                <span>LIDGER TOTALMENTE LINEAR 🟢</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive toggle sandbox and triggering mechanism */}
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-5 shadow-sm space-y-5">
        <h3 className="text-xs font-mono text-gray-300 uppercase tracking-wider font-bold">Painel de Teste de Estresse Transacional</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Active setting toggle */}
          <div className="bg-[#0f172a] border border-[#1f2937] rounded-lg p-4 flex gap-4 items-center justify-between col-span-1">
            <div>
              <div className="text-xs font-bold text-gray-200">Advisory Lock</div>
              <p className="text-[10px] text-gray-400 mt-0.5">Sincronizador PL/pgSQL</p>
            </div>
            <button
              onClick={() => onToggleAdvisoryLock(!advisoryLockEnabled)}
              className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title={advisoryLockEnabled ? "Desativar Advisory Lock" : "Ativar Advisory Lock"}
            >
              {advisoryLockEnabled ? (
                <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-xs font-bold">
                  <span>ON</span>
                  <ToggleRight className="h-8 w-8 text-emerald-500" />
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-zinc-500 font-mono text-xs font-bold">
                  <span>OFF</span>
                  <ToggleLeft className="h-8 w-8 text-zinc-600" />
                </div>
              )}
            </button>
          </div>

          {/* Parallel volume select */}
          <div className="space-y-1.5 bg-[#0f172a] border border-[#1f2937] rounded-lg p-4">
            <div className="flex justify-between text-xs text-gray-300">
              <span>Volume de Requisições Paralelas:</span>
              <span className="font-mono font-bold text-indigo-400">{concurrencyCount}</span>
            </div>
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={concurrencyCount}
              onChange={(e) => setConcurrencyCount(Number(e.target.value))}
              className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <p className="text-[9px] text-gray-500 text-right">Mín: 5 | Max: 50 concorrentes simultâneos</p>
          </div>

          {/* Action trigger button */}
          <button
            onClick={handleRunStress}
            disabled={loading}
            className={`w-full py-3.5 px-4 rounded-xl font-medium text-xs flex items-center justify-center gap-2 border cursor-pointer select-none transition-all ${
              loading 
                ? 'bg-zinc-800 border-zinc-700 text-zinc-500' 
                : advisoryLockEnabled 
                  ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500/30 text-white shadow-emerald-950/20 shadow-md' 
                  : 'bg-red-700 hover:bg-red-600 border-red-500/20 text-white shadow-red-950/20 shadow-md'
            }`}
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Sincronizando Threads Concorrentes...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Fazer Ataque Concorrente ({concurrencyCount} Updates)
              </>
            )}
          </button>
        </div>

        {/* Loading progress visualization when run */}
        {loading && (
          <div className="space-y-2 p-4 bg-[#0f172a] rounded-lg border border-indigo-500/10 animate-pulse">
            <div className="flex justify-between text-[11px] font-mono text-indigo-300">
              <span className="flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 animate-spin" />
                PostgreSQL Engine Executing Batch transações...
              </span>
              <span>Processando...</span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-1.5">
              <div className="bg-indigo-500 h-1.5 rounded-full w-2/3 animate-ping"></div>
            </div>
          </div>
        )}

        {/* Completed results diagnostics block */}
        {testResult && (
          <div className={`p-5 rounded-xl border space-y-3 ${
            testResult.integridade.isValid 
              ? 'bg-[#10b981]/5 border-emerald-500/30 text-emerald-300' 
              : 'bg-red-950/30 border-red-500/30 text-red-200'
          }`}>
            <div className="flex items-center gap-2 font-mono font-bold text-sm">
              {testResult.integridade.isValid ? (
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
              ) : (
                <ShieldAlert className="h-5 w-5 text-red-400" />
              )}
              <span>Resultado do Teste de Integridade Criptográfica</span>
            </div>

            <p className="text-xs leading-relaxed font-sans">{testResult.message}</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-zinc-800 font-mono text-[11px] text-gray-400">
              <div>
                <span>Advisory Locks:</span>
                <span className={`font-bold ml-1.5 uppercase ${testResult.advisoryLockEnabled ? 'text-emerald-400' : 'text-zinc-400'}`}>
                  {testResult.advisoryLockEnabled ? 'Habilitado' : 'Bypass'}
                </span>
              </div>
              <div>
                <span>Tamanho Final do Ledger:</span>
                <span className="text-gray-200 ml-1.5">{testResult.auditLength} entradas</span>
              </div>
              <div>
                <span>Integridade do Ledger:</span>
                <span className={`font-bold ml-1.5 uppercase ${testResult.integridade.isValid ? 'text-emerald-400' : 'text-red-400'}`}>
                  {testResult.integridade.isValid ? 'Prefeito / Linear' : 'Quebrado (Forks)'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
