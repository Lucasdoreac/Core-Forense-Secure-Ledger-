import React, { useState } from 'react';
import { Terminal, Copy, Send, RefreshCw, Layers, ShieldCheck, ShieldAlert, Cpu } from 'lucide-react';

interface ConsoleDdlProps {
  eventTriggersEnabled: boolean;
  onToggleEventTriggers: (val: boolean) => void;
  onExecuteDdl: (sql: string) => Promise<any>;
  fetchEstado: () => void;
  integridade: { isValid: boolean; brokenAtIdx: number | null; details: string };
}

export default function ConsoleDdl({
  eventTriggersEnabled,
  onToggleEventTriggers,
  onExecuteDdl,
  fetchEstado,
  integridade,
}: ConsoleDdlProps) {
  const [loading, setLoading] = useState(false);
  const [commandInput, setCommandInput] = useState('');
  
  // Terminal log matching real database CLI
  const [terminalLogs, setTerminalLogs] = useState<Array<{
    type: 'input' | 'output' | 'error' | 'meta';
    text: string;
    timestamp: string;
  }>>([
    { type: 'meta', text: 'PSQL client (16.2-Alpine, server 16.2) connected to "core_forense".', timestamp: new Date().toISOString() },
    { type: 'meta', text: 'Sovereignty Systemic Defense Index (ISDS V3) Active.', timestamp: new Date().toISOString() },
    { type: 'meta', text: 'Digite um dos comandos sugeridos abaixo ou digite seu SQL personalizado.', timestamp: new Date().toISOString() }
  ]);

  const quickCommands = [
    {
      label: 'Caso 1: Apagar Vestígios (Ataque DML)',
      sql: 'DELETE FROM auditoria_operacoes;'
    },
    {
      label: 'Caso 2: Deletar Tabela de Log (DDL Sabotagem)',
      sql: 'DROP TABLE auditoria_operacoes CASCADE;'
    },
    {
      label: 'Caso 3: Desabilitar Sensores (DDL Hijack)',
      sql: 'ALTER TABLE documentos_sensiveis DISABLE TRIGGER ALL;'
    },
    {
      label: 'Caso 4: Leitura Pública sem Credencial',
      sql: 'SELECT * FROM documentos_sensiveis;'
    }
  ];

  const handleExecute = async (sql: string) => {
    if (!sql.trim()) return;
    setLoading(true);

    const timeStr = new Date().toLocaleTimeString();

    // Add input command to logs
    setTerminalLogs(prev => [...prev, {
      type: 'input',
      text: `core_forense=# ${sql}`,
      timestamp: new Date().toISOString()
    }]);

    try {
      const res = await onExecuteDdl(sql);
      
      setTerminalLogs(prev => [...prev, {
        type: 'output',
        text: res.message,
        timestamp: new Date().toISOString()
      }]);

      await fetchEstado();
    } catch (err: any) {
      const errMsg = err.error || err.message || 'Erro indefinido de conexão.';
      setTerminalLogs(prev => [...prev, {
        type: 'error',
        text: errMsg,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;
    handleExecute(commandInput);
    setCommandInput('');
  };

  const handleCopyPreset = (sql: string) => {
    setCommandInput(sql);
  };

  const handleClearTerminal = () => {
    setTerminalLogs([
      { type: 'meta', text: 'Terminal reiniciado.', timestamp: new Date().toISOString() }
    ]);
  };

  return (
    <div className="space-y-6">
      {/* 1. Explanatory Banner representing Event Triggers */}
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-5 shadow-2xl relative overflow-hidden">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-lg border border-rose-500/20">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-md font-display font-bold text-gray-100 flex items-center gap-2">
              Proteção Estrutural de Catálogo (Event Triggers)
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Enquanto as triggers comuns de tabelas (Triggers DML) controlam linhas, administradores maliciosos ou privilégios escalados podem realizar ações destrutivas globais como <span className="font-mono text-xs text-[#93c5fd]">DROP TABLE</span> ou <span className="font-mono text-xs text-[#93c5fd]">DISABLE TRIGGER</span>. Gatilhos de Eventos interceptam comandos DDL no compilador postgres, antes da execução física.
            </p>
          </div>
        </div>

        {/* Dynamic event trigger configuration status */}
        <div className="flex flex-col sm:flex-row gap-5 pt-4 mt-4 border-t border-[#1f2937] items-start sm:items-center justify-between">
          <div className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={eventTriggersEnabled}
              onChange={(e) => onToggleEventTriggers(e.target.checked)}
              className="sr-only peer"
              id="event-triggers-toggle"
            />
            <div className="w-9 h-5 bg-[#374151] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
            <span className="ml-3 text-xs font-semibold text-gray-300 flex items-center gap-1.5">
              Defesas de Catálogo (Event Triggers DDL)
            </span>
          </div>

          <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-black border ${
            eventTriggersEnabled 
              ? 'bg-purple-500/10 text-purple-300 border-purple-500/30' 
              : 'bg-red-500/10 text-red-400 border-red-500/30 animate-pulse'
          }`}>
            EVENT TRIGGERS: {eventTriggersEnabled ? 'BLOQUEIO SEGURO ATIVO' : 'DEFESAS ESTRUTURAIS DESLIGADAS (Vulnerável ao Administrador DBA)'}
          </span>
        </div>
      </div>

      {/* 2. CLI Terminal Window */}
      <div className="bg-[#090d16] border border-zinc-800 rounded-xl overflow-hidden shadow-2xl flex flex-col font-mono">
        {/* Terminal Title Bar */}
        <div className="bg-[#111827] border-b border-zinc-800 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-xs text-gray-400 ml-1.5 flex items-center gap-1.5">
              <Terminal className="h-3.5 w-3.5 text-[#38bdf8]" />
              terminal_core_forense@postgres
            </span>
          </div>

          <button
            onClick={handleClearTerminal}
            className="text-[10px] text-gray-500 hover:text-white px-2 py-0.5 rounded hover:bg-zinc-800/50"
          >
            Limpar Terminal
          </button>
        </div>

        {/* Console Text Logger */}
        <div className="p-4 h-72 overflow-y-auto text-xs space-y-2 font-mono scrollbar select-text">
          {terminalLogs.map((log, i) => (
            <div
              key={i}
              className={`p-1 rounded-sm leading-relaxed ${
                log.type === 'input' ? 'text-[#38bdf8] font-bold' :
                log.type === 'error' ? 'bg-red-500/5 text-red-400 border-l-2 border-red-500 pl-2' :
                log.type === 'output' ? 'text-gray-300' : 'text-gray-500 text-[11px]'
              }`}
            >
              {log.text}
            </div>
          ))}
          {loading && (
            <div className="text-gray-500 animate-pulse flex items-center gap-2">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              Executando instrução no kernel PostgreSQL...
            </div>
          )}
        </div>

        {/* Input area */}
        <form onSubmit={handleFormSubmit} className="bg-[#0c1221] border-t border-zinc-805/40 p-2 flex gap-2">
          <span className="text-[#38bdf8] py-1.5 pl-2 select-none">core_forense=#</span>
          <input
            type="text"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            disabled={loading}
            placeholder="Digite seu comando SQL aqui... (Ex: DROP TABLE documentos_sensiveis;)"
            className="flex-1 bg-transparent border-none outline-none text-xs text-white placeholder-gray-600 font-mono disabled:text-gray-600"
          />
          <button
            type="submit"
            disabled={loading || !commandInput.trim()}
            className="p-1.5 px-3 bg-[#1e293b] hover:bg-[#334155] text-[#38bdf8] hover:text-white rounded text-xs transition-all cursor-pointer flex items-center gap-1 font-bold"
          >
            <Send className="h-3 w-3" />
            Executares
          </button>
        </form>
      </div>

      {/* 3. Quick injection cases */}
      <div className="space-y-3">
        <h4 className="text-xs font-mono text-gray-400 tracking-wider">PRESETS DE CASOS DE TESTE (CONFORMIDADE ISDS)</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {quickCommands.map((preset, i) => (
            <div
              key={i}
              className="bg-[#111827] border border-[#1f2937] p-4 rounded-xl flex flex-col justify-between space-y-2.5 hover:border-zinc-700 transition-all"
            >
              <div>
                <span className="text-[10px] font-mono text-indigo-400 font-bold block uppercase">{preset.label}</span>
                <code className="text-xs text-gray-300 bg-[#0c1221] px-2 py-1 rounded block border border-zinc-800/50 mt-1.5 break-all leading-relaxed font-mono">
                  {preset.sql}
                </code>
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  id={`preset-cmd-copy-${i}`}
                  onClick={() => handleCopyPreset(preset.sql)}
                  className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-gray-400 hover:text-white font-mono text-[10px] rounded flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Copy className="h-3 w-3" />
                  Copiar
                </button>
                <button
                  type="button"
                  id={`preset-cmd-exec-${i}`}
                  onClick={() => handleExecute(preset.sql)}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-[10px] rounded flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Send className="h-3 w-3" />
                  Injetar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
