import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Terminal, 
  Layers, 
  Database, 
  Cpu, 
  HelpCircle, 
  RefreshCw, 
  CheckCircle2, 
  Lock, 
  User, 
  Archive,
  Menu,
  X,
  FileSpreadsheet
} from 'lucide-react';

// Import Types
import { NivelSigilo, DocumentoSensivel, AuditoriaOperacao, PartitionInfo } from './types';

// Import Components
import DocumentManager from './components/DocumentManager';
import LedgerTimeline from './components/LedgerTimeline';
import ConcurrencySimulator from './components/ConcurrencySimulator';
import ConsoleDdl from './components/ConsoleDdl';
import PartitionManager from './components/PartitionManager';
import AIAuditor from './components/AIAuditor';

export default function App() {
  const [activeTab, setActiveTab] = useState<'documentos' | 'ledger' | 'concorrencia' | 'ddl' | 'particoes' | 'ai'>('documentos');
  
  // App states synchronized with simulated backend
  const [documentos, setDocumentos] = useState<DocumentoSensivel[]>([]);
  const [auditoria, setAuditoria] = useState<AuditoriaOperacao[]>([]);
  const [particoes, setParticoes] = useState<PartitionInfo[]>([]);
  const [advisoryLockEnabled, setAdvisoryLockEnabled] = useState(true);
  const [eventTriggersEnabled, setEventTriggersEnabled] = useState(true);
  const [triggersEnabled, setTriggersEnabled] = useState(true);
  const [integridade, setIntegridade] = useState<{ isValid: boolean; brokenAtIdx: number | null; details: string }>({
    isValid: true,
    brokenAtIdx: null,
    details: 'Verificando logs...'
  });

  // Client-set attributes (JWT Token Claims Simulation)
  const [currentClearance, setCurrentClearance] = useState<NivelSigilo>('SECRETO');
  const [currentDepartment, setCurrentDepartment] = useState('DEFESA');

  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch full state from backend
  const fetchEstado = async () => {
    try {
      const response = await fetch('/api/estado');
      if (!response.ok) throw new Error('Não foi possível obter o estado do banco.');
      const data = await response.json();
      
      setAdvisoryLockEnabled(data.advisoryLockEnabled);
      setEventTriggersEnabled(data.eventTriggersEnabled);
      setTriggersEnabled(data.triggersEnabled);
      setDocumentos(data.documentos);
      setAuditoria(data.auditoria);
      setParticoes(data.particoes);
      setIntegridade(data.integridade);
    } catch (err: any) {
      console.error('Falha de sincronização com o simulador:', err);
      showNotification(err.message || 'Erro de comunicação.', 'error');
    }
  };

  useEffect(() => {
    fetchEstado();
  }, [currentClearance, currentDepartment]); // Refetch/filter when active permissions change

  // Show customized banner alert
  const showNotification = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // 1. Reset Database
  const resetDatabase = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showNotification(data.message, 'success');
        await fetchEstado();
      }
    } catch (err) {
      showNotification('Erro ao resetar banco.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 2. Change dynamic trigger settings
  const updateConfig = async (config: { advisoryLockEnabled?: boolean; eventTriggersEnabled?: boolean; triggersEnabled?: boolean }) => {
    try {
      const res = await fetch('/api/config/alterar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      if (data.success) {
        setAdvisoryLockEnabled(data.advisoryLockEnabled);
        setEventTriggersEnabled(data.eventTriggersEnabled);
        setTriggersEnabled(data.triggersEnabled);
        showNotification('Configuração física do PostgreSQL atualizada.', 'success');
        await fetchEstado();
      }
    } catch (err) {
      showNotification('Erro ao atualizar configurações.', 'error');
    }
  };

  // 3. Add sensitive document (with ABAC triggers)
  const addDocument = async (doc: { titulo: string; conteudo: string; classificacao: NivelSigilo; departamento_dono: string }) => {
    try {
      const res = await fetch('/api/documentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doc)
      });
      const data = await res.json();
      if (res.ok) {
        showNotification('INSERT efetuado e auditado automaticamente.', 'success');
        await fetchEstado();
      } else {
        showNotification(data.error || 'Erro ao inserir.', 'error');
      }
    } catch (err) {
      showNotification('Falha de comunicação.', 'error');
    }
  };

  // 4. Update sensitive document
  const updateDocument = async (id: string, doc: Partial<DocumentoSensivel>) => {
    try {
      const res = await fetch(`/api/documentos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doc)
      });
      const data = await res.json();
      if (res.ok) {
        showNotification('UPDATE concluído e integrado ao Ledger.', 'success');
        await fetchEstado();
      } else {
        showNotification(data.error || 'Erro ao atualizar.', 'error');
      }
    } catch (err) {
      showNotification('Erro ao se conectar.', 'error');
    }
  };

  // 5. Delete sensitive document (soft-delete redirected trigger)
  const deleteDocument = async (id: string) => {
    try {
      const res = await fetch(`/api/documentos/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok) {
        if (data.redirected) {
          showNotification(data.message, 'info');
        } else {
          showNotification('Documento excluído.', 'success');
        }
        await fetchEstado();
      } else {
        showNotification(data.error || 'Erro de deleção.', 'error');
      }
    } catch (err) {
      showNotification('Erro ao processar DELETE.', 'error');
    }
  };

  // 6. Direct Backdoor Adulteration (Malicious DBA direct byte insert bypass block trigger)
  const adulterarLog = async (index: number, campo: string, valor: string): Promise<any> => {
    const res = await fetch('/api/auditoria/adulterar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ index, campo, valor })
    });
    
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Operação bloqueada pelo banco de dados.');
    }
    
    showNotification(data.message, 'success');
    await fetchEstado();
    return data;
  };

  // 7. Execute DDL raw commands
  const executarDdl = async (sql: string): Promise<any> => {
    const res = await fetch('/api/executar-ddl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql })
    });
    
    const data = await res.json();
    if (!res.ok) {
      throw data; // Pass exact custom Exception error back to term CLI
    }
    
    showNotification('DDL Executado com sucesso no catálogo.', 'success');
    await fetchEstado();
    return data;
  };

  // 8. Detach Partition WORM Object
  const detachPartition = async (nome: string) => {
    const res = await fetch('/api/particoes/detach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome })
    });
    
    const data = await res.json();
    if (!res.ok) {
      throw data;
    }
    
    showNotification(data.message, 'success');
    await fetchEstado();
    return data;
  };

  // 9. Drop partitioned WORM cold storage
  const dropPartition = async (nome: string) => {
    const res = await fetch('/api/particoes/drop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome })
    });
    
    const data = await res.json();
    if (!res.ok) {
      throw data;
    }
    
    showNotification(data.message, 'success');
    await fetchEstado();
    return data;
  };

  // 10. Concurrency stress test trigger proxy
  const triggerStressTest = async (times: number): Promise<any> => {
    const res = await fetch('/api/stress-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ times })
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  };

  // 11. AI Gemini integration call proxy
  const callGeminiAudit = async (prompt: string): Promise<string> => {
    try {
      const res = await fetch('/api/audit-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro desconhecido na AI.');
      return data.text;
    } catch (err: any) {
      throw new Error(err.message || 'Falha na resposta do Gemini.');
    }
  };

  // Fetch documents specifically reflecting RLS constraints parameter filters
  const getVisibleDocumentsCount = () => {
    const levels = ['PUBLICO', 'RESTRITO', 'CONFIDENCIAL', 'SECRETO', 'ULTRA_SECRETO'];
    const userIndex = levels.indexOf(currentClearance);
    
    return documentos.filter((doc) => {
      if (doc.excluido) return false;
      const lvlVal = levels.indexOf(doc.classificacao);
      return userIndex >= lvlVal && doc.departamento_dono === currentDepartment;
    }).length;
  };

  const navItems = [
    { id: 'documentos', label: 'Documentos & ABAC (RLS)', icon: Database, desc: 'Visualização sob Row-Level Security' },
    { id: 'ledger', label: 'Cadeia de Custódia Log', icon: ShieldCheck, desc: 'Histórico linear SHA-256 incorruptível' },
    { id: 'concorrencia', label: 'Estresse Concorrente', icon: Cpu, desc: 'Locks contra quebras de sequência' },
    { id: 'ddl', label: 'Terminal DDL (Catálogo)', icon: Terminal, desc: 'Event Triggers mitigando DBAs' },
    { id: 'particoes', label: 'Arquivamento WORM', icon: Archive, desc: 'Particionamento temporal e ciclo legal' },
    { id: 'ai', label: 'Auditor AI Gemini', icon: HelpCircle, desc: 'Assessoria de conformidade ISDS V3' },
  ];

  return (
    <div className="min-h-screen bg-[#070a0e] text-[#cbd5e1] font-sans antialiased flex flex-col selection:bg-indigo-500/30 selection:text-white">
      
      {/* 1. Header component panel */}
      <header className="bg-[#111827] border-b border-[#1f2937] px-4 md:px-6 py-4 sticky top-[#1px] z-40 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <ShieldCheck className="h-5.5 w-5.5" />
              </div>
              <div>
                <h1 className="text-md font-display font-bold text-white tracking-tight flex items-center gap-1.5 leading-none">
                  Core Forense Secure Ledger
                  <span className="text-[10px] bg-indigo-500/10 text-indigo-300 font-mono border border-indigo-500/20 rounded px-1.5 py-0.5">
                    ISDS V3 Compliant
                  </span>
                </h1>
                <p className="text-[11px] text-gray-400 font-mono mt-1">
                  Blueprint Relacional & Sincronismo de Defesa
                </p>
              </div>
            </div>

            {/* Mobile menu button */}
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 bg-[#1f2937] text-gray-300 rounded border border-[#374151] md:hidden cursor-pointer"
            >
              {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>

          {/* Core system state badges */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Session attributes readout */}
            <div className="bg-[#0f172a] border border-[#1f2937] rounded-lg px-3 py-1.5 flex items-center gap-2 text-xs text-gray-300 font-mono">
              <User className="h-3.5 w-3.5 text-amber-400" />
              <span>Token:</span>
              <span className="text-[#a855f7] font-bold truncate max-w-[130px] sm:max-w-none">
                {currentClearance || 'SEM_JWT'} @ {currentDepartment || 'NULO'}
              </span>
            </div>

            {/* Ledger health seal */}
            <div className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold flex items-center gap-1.5 ${
              integridade.isValid 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse'
            }`}>
              {integridade.isValid ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
              <span>Ledger: {integridade.isValid ? 'SECURED 🛡️' : 'CORRUPTED ⚠️'}</span>
            </div>
          </div>

        </div>
      </header>

      {/* Grid container layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 md:grid-cols-4 gap-6 relative">
        
        {/* Floating pop notification */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 p-4 rounded-xl shadow-2xl border flex items-start gap-2.5 max-w-md w-11/12 font-sans ${
                notification.type === 'success' 
                  ? 'bg-emerald-950 border-emerald-500/30 text-emerald-200' 
                  : notification.type === 'error' 
                    ? 'bg-red-950 border-red-500/30 text-red-200' 
                    : 'bg-[#111827] border-[#1f2937] text-gray-100'
              }`}
            >
              {notification.type === 'success' ? (
                <ShieldCheck className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              ) : notification.type === 'error' ? (
                <ShieldAlert className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              ) : (
                <Terminal className="h-5 w-5 text-[#38bdf8] flex-shrink-0 mt-0.5" />
              )}
              <div className="text-xs font-medium leading-relaxed">{notification.message}</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 2. Left Menu Bar Navigation */}
        <aside className={`md:col-span-1 rounded-xl bg-[#111827] border border-[#1f2937] p-4 space-y-4 shadow-sm self-start md:block transition-all ${
          sidebarOpen ? 'block fixed inset-x-4 top-40 z-30' : 'hidden'
        }`}>
          <div className="pb-3 border-b border-[#1f2937]">
            <h3 className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-widest px-2">Navegação Operacional</h3>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              // Custom count bubbles depending on tabs
              let bubble = null;
              if (item.id === 'documentos') {
                bubble = (
                  <span className="text-[10px] px-1.5 py-0.2 bg-zinc-800 text-zinc-400 rounded-full border border-zinc-700 font-mono">
                    {getVisibleDocumentsCount()} retornos
                  </span>
                );
              } else if (item.id === 'ledger') {
                bubble = (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    integridade.isValid ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse'
                  }`}>
                    {auditoria.length} blocos
                  </span>
                );
              }

              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-sans transition-all text-left border ${
                    isActive 
                      ? 'bg-indigo-600/10 border-indigo-500/35 text-indigo-300 font-semibold' 
                      : 'border-transparent text-gray-400 hover:bg-[#1f2937] hover:text-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-indigo-400' : 'text-gray-500'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {bubble}
                </button>
              );
            })}
          </nav>

          <div className="pt-4 border-t border-[#1f2937] space-y-2.5 text-[11px] font-mono select-none px-2 text-gray-500">
            <div className="flex justify-between">
              <span>Sessão DB:</span>
              <span className="text-gray-400 font-semibold">auditor_admin</span>
            </div>
            <div className="flex justify-between">
              <span>Conexão SSL:</span>
              <span className="text-emerald-400 font-semibold uppercase">REQUIRE</span>
            </div>
            <div className="flex justify-between">
              <span>Air-Gapped:</span>
              <span className="text-indigo-400 font-semibold uppercase">BRIDGE_INTERNAL</span>
            </div>
          </div>
        </aside>

        {/* Backdrop for mobile expanded navigation */}
        {sidebarOpen && (
          <div 
            onClick={() => setSidebarOpen(false)}
            className="md:hidden fixed inset-0 bg-[#070a0e]/60 z-20"
          ></div>
        )}

        {/* 3. Main Dashboard Tab Panel Viewer */}
        <main className="col-span-1 md:col-span-3 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.18 }}
              className="min-h-[500px]"
            >
              {activeTab === 'documentos' && (
                <DocumentManager
                  documentos={documentos}
                  currentClearance={currentClearance}
                  setCurrentClearance={setCurrentClearance}
                  currentDepartment={currentDepartment}
                  setCurrentDepartment={setCurrentDepartment}
                  onAddDocument={addDocument}
                  onUpdateDocument={updateDocument}
                  onDeleteDocument={deleteDocument}
                  rlsActive={true}
                  onResetDatabase={resetDatabase}
                />
              )}

              {activeTab === 'ledger' && (
                <LedgerTimeline
                  auditoria={auditoria}
                  onAdulterarLog={adulterarLog}
                  triggersEnabled={triggersEnabled}
                  onAlterarTriggers={(val) => updateConfig({ triggersEnabled: val })}
                  integridade={integridade}
                  fetchEstado={fetchEstado}
                />
              )}

              {activeTab === 'concorrencia' && (
                <ConcurrencySimulator
                  advisoryLockEnabled={advisoryLockEnabled}
                  onToggleAdvisoryLock={(val) => updateConfig({ advisoryLockEnabled: val })}
                  onTriggerStressTest={triggerStressTest}
                  fetchEstado={fetchEstado}
                  integridade={integridade}
                />
              )}

              {activeTab === 'ddl' && (
                <ConsoleDdl
                  eventTriggersEnabled={eventTriggersEnabled}
                  onToggleEventTriggers={(val) => updateConfig({ eventTriggersEnabled: val })}
                  onExecuteDdl={executarDdl}
                  fetchEstado={fetchEstado}
                  integridade={integridade}
                />
              )}

              {activeTab === 'particoes' && (
                <PartitionManager
                  particoes={particoes}
                  onDetachPartition={detachPartition}
                  onDropPartition={dropPartition}
                  eventTriggersEnabled={eventTriggersEnabled}
                  onRefresh={fetchEstado}
                />
              )}

              {activeTab === 'ai' && (
                <AIAuditor
                  onCallGemini={callGeminiAudit}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

      </div>

      {/* Footer component */}
      <footer className="bg-[#111827] border-t border-[#1f2937] py-4 h-12 mt-12 px-4 text-center text-[10px] text-gray-500 font-mono flex items-center justify-center">
        <span>© 2026 Core Forense Ledger Sandbox • Desenvolvido sob rígidas premissas da Diretriz de Defesa Sistêmica e Integridade</span>
      </footer>
    </div>
  );
}
