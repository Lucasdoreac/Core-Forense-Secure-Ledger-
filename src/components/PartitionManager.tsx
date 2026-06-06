import React from 'react';
import { PartitionInfo } from '../types';
import { Calendar, Archive, Download, Trash, AlertCircle, Info, Lock } from 'lucide-react';

interface PartitionManagerProps {
  particoes: PartitionInfo[];
  onDetachPartition: (nome: string) => Promise<any>;
  onDropPartition: (nome: string) => Promise<any>;
  eventTriggersEnabled: boolean;
  onRefresh: () => void;
}

export default function PartitionManager({
  particoes,
  onDetachPartition,
  onDropPartition,
  eventTriggersEnabled,
  onRefresh,
}: PartitionManagerProps) {

  return (
    <div className="space-y-6">
      {/* 1. Explanatory intro */}
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-5 shadow-2xl space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20">
            <Archive className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-md font-display font-bold text-gray-100 flex items-center gap-2">
              Particionamento Temporal Declarativo e Governança WORM
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Ledgers históricos em produção crescem expressivamente. O particionamento temporal mensal (<span className="font-mono text-xs text-[#a855f7]">PARTITION BY RANGE</span>) divide o histórico em tabelas filhas independentes físicas. Isso possibilita arquivamento "frio" e remoções em mídias de gravação única (WORM) sem violar a trigger relacional contra exclusões diretas.
            </p>
          </div>
        </div>
      </div>

      {/* Warning info container */}
      <div className="bg-[#0f172a] border border-zinc-800 rounded-xl p-4 flex gap-3 text-xs leading-relaxed text-gray-300">
        <Info className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-indigo-300 block uppercase mb-0.5">Ciclo de Custódia Legal (WORM e Expurgo)</span>
          No PostgreSQL de segurança do Core Forense, a remoção direta via <code className="text-amber-400">DELETE</code> é sumariamente bloqueada para manter o Ledger imutável. Para limpar dados antigos sem quebrar as regras:
          <ol className="list-decimal list-inside space-y-1 mt-1 text-gray-400">
            <li>Você desvincula a partição de logs antigos do ledger usando <code className="text-[#a855f7]">ALTER TABLE ... DETACH PARTITION</code>.</li>
            <li>Após desvinculada (detatched), a tabela torna-se independente e pode ser copiada para uma mídia física externa ou storage offline (MinIO Object Lock / Glacier).</li>
            <li>Somente então, o administrador pode descartar a partição destacada via <code className="text-red-400">DROP TABLE</code> de forma segura, sem afetar o índice central ativo ou disparar exceções de DML.</li>
          </ol>
        </div>
      </div>

      {/* Partitions list */}
      <div className="space-y-4">
        <h3 className="text-xs font-mono text-gray-400 tracking-wider">DIRETÓRIO FÍSICO DE PARTIÇÕES TEMPORAIS</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {particoes.map((part) => (
            <div
              key={part.nome}
              className={`border p-5 rounded-xl shadow-md flex flex-col justify-between space-y-4 relative overflow-hidden bg-[#111827] ${
                part.status === 'DETACHED' 
                  ? 'border-amber-500/25 bg-amber-500/5' 
                  : part.status === 'COLD_STORAGE_WORM' 
                    ? 'border-zinc-800 bg-zinc-900/30' 
                    : 'border-indigo-500/20 bg-indigo-950/5'
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {part.nome}
                  </span>
                  
                  <span className={`text-[9px] font-mono font-black px-2 py-0.5 rounded border uppercase ${
                    part.status === 'ACTIVE_READ_WRITE' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                    part.status === 'COLD_STORAGE_WORM' ? 'bg-[#10b981]/10 text-emerald-400 border-emerald-500/20 flex items-center gap-1' :
                    'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {part.status === 'COLD_STORAGE_WORM' && <Lock className="h-3 w-3" />}
                    {part.status === 'ACTIVE_READ_WRITE' ? 'Escrita/Leitura Ativa' :
                     part.status === 'COLD_STORAGE_WORM' ? 'WORM Imutável' : 'DESVINCULADA (Detached)'}
                  </span>
                </div>

                <div className="text-xs text-gray-400 font-mono space-y-0.5">
                  <div>Faixa de Início: <span className="text-gray-300">{part.inicio}</span></div>
                  <div>Faixa Limite: <span className="text-gray-300">{part.fim}</span></div>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-zinc-800/50">
                {part.status !== 'DETACHED' ? (
                  <button
                    onClick={async () => {
                      try {
                        await onDetachPartition(part.nome);
                      } catch (err: any) {
                        alert(err.error || err.message || 'Erro ao tentar desvincular partição.');
                      }
                    }}
                    className={`px-3 py-1.5 rounded text-[10px] font-mono flex items-center gap-1 cursor-pointer transition-all ${
                      eventTriggersEnabled 
                        ? 'bg-zinc-850 border border-zinc-700/50 text-zinc-500 hover:text-zinc-400' 
                        : 'bg-amber-600 hover:bg-amber-500 border border-amber-500/20 text-white shadow'
                    }`}
                    title={eventTriggersEnabled ? "Event triggers DDL estão ligados e barram este ALTER TABLE." : "Desvincular partição do pai"}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Desvincular (DETACH)
                  </button>
                ) : (
                  <button
                    onClick={async () => {
                      if (confirm(`Deseja permanentemente executar DROP TABLE na partição destacada ${part.nome}? Esta ação é irreversível!`)) {
                        try {
                          await onDropPartition(part.nome);
                        } catch (err: any) {
                          alert(err.error || err.message || 'Erro ao apagar partição.');
                        }
                      }
                    }}
                    className="px-3 py-1.5 bg-red-650 hover:bg-red-500 border border-red-500/20 rounded text-[10px] font-mono text-white flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Trash className="h-3.5 w-3.5" />
                    Destruir Física (DROP TABLE)
                  </button>
                )}
              </div>

              {/* Event Triggers Blocking Warning Overlay */}
              {part.status !== 'DETACHED' && eventTriggersEnabled && (
                <div className="absolute inset-0 bg-[#0c0f14]/85 flex flex-col items-center justify-center p-4">
                  <Lock className="h-5 w-5 text-purple-400 mb-1" />
                  <span className="text-[10px] font-mono text-purple-400 uppercase tracking-widest font-black">DDL BLOQUEADO</span>
                  <span className="text-[9px] text-gray-400 text-center scale-90 max-w-[240px] block mt-0.5">
                    Modificar a partição via ALTER TABLE requer desativar os Event Triggers na aba "Terminal DDL" primeiro.
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
