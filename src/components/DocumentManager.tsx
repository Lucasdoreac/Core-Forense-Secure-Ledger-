import React, { useState } from 'react';
import { DocumentoSensivel, NivelSigilo } from '../types';
import { Shield, Eye, EyeOff, UserCheck, Plus, Trash2, Edit3, Key, AlertTriangle, ShieldCheck } from 'lucide-react';

interface DocumentManagerProps {
  documentos: DocumentoSensivel[];
  currentClearance: NivelSigilo;
  setCurrentClearance: (lvl: NivelSigilo) => void;
  currentDepartment: string;
  setCurrentDepartment: (dept: string) => void;
  onAddDocument: (doc: { titulo: string; conteudo: string; classificacao: NivelSigilo; departamento_dono: string }) => void;
  onUpdateDocument: (id: string, doc: Partial<DocumentoSensivel>) => void;
  onDeleteDocument: (id: string) => void;
  rlsActive: boolean;
  onResetDatabase: () => void;
}

export default function DocumentManager({
  documentos,
  currentClearance,
  setCurrentClearance,
  currentDepartment,
  setCurrentDepartment,
  onAddDocument,
  onUpdateDocument,
  onDeleteDocument,
  rlsActive,
  onResetDatabase,
}: DocumentManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newClass, setNewClass] = useState<NivelSigilo>('CONFIDENCIAL');
  const [newDept, setNewDept] = useState('DEFESA');
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editClass, setEditClass] = useState<NivelSigilo>('CONFIDENCIAL');
  const [editDept, setEditDept] = useState('DEFESA');

  const [activeSessionMock, setActiveSessionMock] = useState(true);

  const mockPredefinedUsers = [
    { nome: 'Cel. Alberto Silva (Defesa)', clearance: 'SECRETO' as NivelSigilo, dept: 'DEFESA' },
    { nome: 'Auditora Helena Reis (Inteligência)', clearance: 'ULTRA_SECRETO' as NivelSigilo, dept: 'INTELIGENCIA' },
    { nome: 'Analista Bruno Costa (Planejamento)', clearance: 'CONFIDENCIAL' as NivelSigilo, dept: 'PLANEJAMENTO' },
    { nome: 'Acesso Público Anônimo (Sem Chaves)', clearance: '' as any, dept: '' },
  ];

  const handlePresetSelect = (preset: typeof mockPredefinedUsers[0]) => {
    setCurrentClearance(preset.clearance);
    setCurrentDepartment(preset.dept);
  };

  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    onAddDocument({
      titulo: newTitle,
      conteudo: newContent,
      classificacao: newClass,
      departamento_dono: newDept,
    });
    setNewTitle('');
    setNewContent('');
    setShowAddForm(false);
  };

  const handleStartEdit = (doc: DocumentoSensivel) => {
    setEditingId(doc.id);
    setEditTitle(doc.titulo);
    setEditContent(doc.conteudo);
    setEditClass(doc.classificacao);
    setEditDept(doc.departamento_dono);
  };

  const handleSaveEdit = (id: string) => {
    onUpdateDocument(id, {
      titulo: editTitle,
      conteudo: editContent,
      classificacao: editClass,
      departamento_dono: editDept,
    });
    setEditingId(null);
  };

  const canReadClass = (docClass: NivelSigilo) => {
    const levels: NivelSigilo[] = ['PUBLICO', 'RESTRITO', 'CONFIDENCIAL', 'SECRETO', 'ULTRA_SECRETO'];
    const userIndex = levels.indexOf(currentClearance);
    const docIndex = levels.indexOf(docClass);
    return userIndex >= docIndex;
  };

  const isDepartmentMatched = (docDept: string) => {
    return docDept === currentDepartment;
  };

  return (
    <div className="space-y-6">
      {/* 1. Header context block */}
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 h-32 w-32 bg-amber-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 h-32 w-32 bg-indigo-500/5 rounded-full blur-3xl"></div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
              <UserCheck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-display font-semibold text-gray-100 flex items-center gap-2">
                Simulador de Atributos de Sessão (ABAC Token Claims)
              </h2>
              <p className="text-xs text-gray-400">
                Configure as credenciais JWT do usuário atual para emular a verificação de segurança em tempo de execução.
              </p>
            </div>
          </div>
          <button 
            onClick={onResetDatabase} 
            className="px-3.5 py-1.5 text-xs font-mono bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 hover:text-white border border-zinc-700/50 transition-all cursor-pointer self-start md:self-auto"
          >
            Resetar Banco de Dados
          </button>
        </div>

        {/* Credentials setting grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5 pt-5 border-t border-[#1f2937]">
          {/* Preset templates */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-amber-400/80 uppercase tracking-wider block">Templates Operacionais</label>
            <div className="space-y-1.5">
              {mockPredefinedUsers.map((user, i) => (
                <button
                  key={i}
                  id={`preset-user-${i}`}
                  onClick={() => handlePresetSelect(user)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-sans transition-all flex items-center justify-between border ${
                    (user.clearance === currentClearance && user.dept === currentDepartment) || (!user.clearance && !currentClearance)
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                      : 'bg-[#1f2937]/50 border-transparent text-gray-400 hover:bg-[#1f2937] hover:text-gray-200'
                  }`}
                >
                  <span className="font-medium">{user.nome}</span>
                  <span className="text-[10px] bg-[#111827] px-2 py-0.5 rounded text-gray-400 border border-[#1f2937] font-mono">
                    {user.clearance || 'NULO'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Explicit configuration */}
          <div className="md:grid md:grid-cols-2 lg:grid-cols-1 lg:col-span-2 gap-4 space-y-4 md:space-y-0 lg:space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-gray-400 block">Nível de Clearance (Clearance Level)</label>
                <select
                  value={currentClearance || ''}
                  onChange={(e) => setCurrentClearance(e.target.value as NivelSigilo)}
                  className="w-full bg-[#1f2937] border border-[#374151] rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-amber-500/50"
                >
                  <option value="">(NULO) - Sem Autenticação</option>
                  <option value="PUBLICO">PUBLICO</option>
                  <option value="RESTRITO">RESTRITO</option>
                  <option value="CONFIDENCIAL">CONFIDENCIAL</option>
                  <option value="SECRETO">SECRETO</option>
                  <option value="ULTRA_SECRETO">ULTRA_SECRETO</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-gray-400 block">Departamento Ativo (Department)</label>
                <select
                  value={currentDepartment || ''}
                  onChange={(e) => setCurrentDepartment(e.target.value)}
                  className="w-full bg-[#1f2937] border border-[#374151] rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-amber-500/50"
                >
                  <option value="">(NULO) - Sem Departamento</option>
                  <option value="DEFESA">DEFESA (Defesa e Soberania)</option>
                  <option value="INTELIGENCIA">INTELIGENCIA (Inteligência Geral)</option>
                  <option value="PLANEJAMENTO">PLANEJAMENTO (Planejamento e Orçamento)</option>
                  <option value="FINANCAS">FINANCAS (Finanças Setoriais)</option>
                  <option value="OPERACAO_PADRAO">OPERACAO_PADRAO (Operação Geral)</option>
                </select>
              </div>
            </div>

            {/* Micro blueprint status */}
            <div className="bg-[#1f2937]/40 border border-[#374151]/50 rounded-lg p-3 text-xs flex items-start gap-2.5 font-mono">
              <Key className="h-4 w-4 text-amber-500/80 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20 mr-1.5 font-bold uppercase">SESSÃO</span>
                PostgreSQL session variables:
                <div className="text-[11px] text-[#93c5fd] mt-1 space-y-0.5">
                  <div>SET LOCAL "jwt.claims.clearance_level" = '{currentClearance || 'NULL'}';</div>
                  <div>SET LOCAL "jwt.claims.department" = '{currentDepartment || 'NULL'}';</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. RLS Security policy banner */}
      <div className="bg-[#0f172a] border border-blue-900/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5 shadow-md">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20 mt-0.5 select-none">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-100 flex items-center gap-2">
              Política de Row-Level Security (RLS) Ativa
            </h3>
            <p className="text-xs text-gray-400 font-mono mt-0.5">
              USING: <span className="text-blue-300">excluido = FALSE</span> AND <span className="text-amber-400">obter_clearance_level_sessao() &gt;= classificacao</span> AND <span className="text-indigo-400">obter_departamento_sessao() = departamento_dono</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 self-end sm:self-auto bg-green-500/10 border border-green-500/30 text-green-400 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium">
          <ShieldCheck className="h-3.5 w-3.5" />
          FORCE RLS ENFORCED
        </div>
      </div>

      {/* 3. Document grid listing based on RLS */}
      <div className="space-y-4">
        <div className="flex justify-between items-center bg-[#111827] px-4 py-3 rounded-lg border border-[#1f2937]">
          <h3 className="text-sm font-semibold text-gray-100 uppercase tracking-widest font-mono">
            Tabela de Ativos de Informação ({documentos.length} Registros)
          </h3>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-xs text-white font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Inserir Novo Ativo Setorial
          </button>
        </div>

        {/* Add Asset Form */}
        {showAddForm && (
          <form onSubmit={handleSubmitAdd} className="bg-[#111827] border border-indigo-500/30 rounded-xl p-5 shadow-2xl space-y-4">
            <h4 className="text-xs font-mono text-indigo-400 uppercase tracking-wider font-bold">Novo Ativo de Informação Estratégico (INSERT)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-1 md:col-span-2">
                <label className="text-xs text-gray-300 block">Título do Documento</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: ESPECIFICAÇÃO DO PROJETO X"
                  className="w-full bg-[#1f2937] border border-[#374151] rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-gray-300 block">Classificação de Risco (Sigilo)</label>
                <select
                  value={newClass}
                  onChange={(e) => setNewClass(e.target.value as NivelSigilo)}
                  className="w-full bg-[#1f2937] border border-[#374151] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="PUBLICO">PUBLICO (Acesso Aberto)</option>
                  <option value="RESTRITO">RESTRITO (Auditoria Básica)</option>
                  <option value="CONFIDENCIAL">CONFIDENCIAL (Gerencial)</option>
                  <option value="SECRETO">SECRETO (Diretoria Executiva)</option>
                  <option value="ULTRA_SECRETO">ULTRA_SECRETO (Gabinete de Crise)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-gray-300 block">Departamento Proprietário (Need-to-Know)</label>
                <select
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value)}
                  className="w-full bg-[#1f2937] border border-[#374151] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="DEFESA">DEFESA</option>
                  <option value="INTELIGENCIA">INTELIGENCIA</option>
                  <option value="PLANEJAMENTO">PLANEJAMENTO</option>
                  <option value="FINANCAS">FINANCAS</option>
                  <option value="OPERACAO_PADRAO">OPERACAO_PADRAO</option>
                </select>
              </div>

              <div className="space-y-1.5 col-span-1 md:col-span-2">
                <label className="text-xs text-gray-300 block">Conteúdo Sensível do Documento</label>
                <textarea
                  required
                  rows={3}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Escreva as diretrizes técnicas ou dados sensíveis..."
                  className="w-full bg-[#1f2937] border border-[#374151] rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3.5 py-1.5 border border-gray-600 rounded text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded text-xs text-white font-medium transition-colors cursor-pointer"
              >
                Executar INSERT
              </button>
            </div>
          </form>
        )}

        {/* Assets evaluation list */}
        {documentos.length === 0 ? (
          <div className="bg-[#111827] border border-dashed border-[#1f2937] rounded-xl py-12 px-4 text-center">
            <EyeOff className="h-10 w-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm font-sans">Nenhum registro retornado pelo banco (Todos os blocos podem ter sido excluídos fisicamente se o Event Trigger de defesa estrutural foi burlado).</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {documentos.map((doc) => {
              // Client-side visual RLS filter evaluation
              const hasClearance = canReadClass(doc.classificacao);
              const hasDeptMatching = isDepartmentMatched(doc.departamento_dono);
              const visibleByRls = hasClearance && hasDeptMatching;

              return (
                <div
                  key={doc.id}
                  id={`doc-card-${doc.id}`}
                  className={`border rounded-xl shadow-md transition-all flex flex-col md:flex-row justify-between p-5 gap-4 relative overflow-hidden ${
                    visibleByRls
                      ? 'bg-[#111827] border-[#1f2937] hover:border-gray-700/50'
                      : 'bg-[#111827]/30 border-red-950/20 opacity-35 filter blur-[0.6px] saturate-50'
                  }`}
                >
                  <div className="space-y-2.5 flex-1 select-none">
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                        doc.classificacao === 'ULTRA_SECRETO' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                        doc.classificacao === 'SECRETO' ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' :
                        doc.classificacao === 'CONFIDENCIAL' ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' :
                        doc.classificacao === 'RESTRITO' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                        'bg-zinc-500/10 text-zinc-400 border-zinc-500/30'
                      }`}>
                        {doc.classificacao}
                      </span>
                      <span className="text-[10px] font-mono bg-[#1f2937] border border-[#374151] px-2 py-0.5 rounded text-gray-300">
                        DEPT: {doc.departamento_dono}
                      </span>
                      <span className="text-[10px] font-mono bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
                        VERSÃO: {doc.versao}
                      </span>
                      {doc.excluido && (
                        <span className="text-[10px] font-mono bg-red-600/25 text-red-300 border border-red-500/30 px-2 py-0.5 rounded animate-pulse">
                          EXCLUÍDO LOGICAMENTE
                        </span>
                      )}
                    </div>

                    {editingId === doc.id ? (
                      <div className="space-y-3 mt-2 pr-0 md:pr-4">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full bg-[#1f2937] border border-indigo-500/50 rounded px-2.5 py-1.5 text-xs text-white"
                        />
                        <textarea
                          rows={2}
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full bg-[#1f2937] border border-indigo-500/50 rounded px-2.5 py-1 text-xs text-white"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveEdit(doc.id)}
                            className="px-2.5 py-1 bg-green-700 text-white text-[11px] rounded hover:bg-green-600 font-mono transition-colors cursor-pointer"
                          >
                            Salvar UPDATE
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-2.5 py-1 bg-zinc-800 text-zinc-300 text-[11px] rounded hover:bg-zinc-700 font-mono transition-colors cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h4 className="text-sm font-semibold tracking-wide text-gray-100 font-sans">
                          {visibleByRls ? doc.titulo : '•••••••• ••••••••• •• ••••••••••••'}
                        </h4>
                        <p className="text-xs text-gray-300 leading-relaxed font-sans max-w-2xl">
                          {visibleByRls 
                            ? doc.conteudo 
                            : 'CONTEÚDO BLOQUEADO: Seus atributos JWT claims atuais (Clearance e Departamento) não satisfazem os requisitos mínimos da política ABAC/RLS para este elemento do banco de dados.'
                          }
                        </p>
                      </>
                    )}

                    <div className="text-[10px] font-mono text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
                      <span>ID: {doc.id}</span>
                      <span>Criado em: {new Date(doc.criado_em).toLocaleString('pt-BR')}</span>
                    </div>
                  </div>

                  {/* Actions buttons if visible */}
                  {visibleByRls && (
                    <div className="flex md:flex-col justify-end items-center gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-[#1f2937] flex-shrink-0">
                      {editingId !== doc.id && (
                        <button
                          onClick={() => handleStartEdit(doc)}
                          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-all cursor-pointer"
                          title="Fazer UPDATE no registro"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => onDeleteDocument(doc.id)}
                        className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-all cursor-pointer"
                        title="Fazer DELETE físico (Será interceptado pela trigger e convertido em lógico)"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {/* Redacted lock seal if blocked by RLS */}
                  {!visibleByRls && (
                    <div className="absolute inset-0 bg-[#0c0f14]/80 flex flex-col items-center justify-center p-4">
                      <div className="p-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full mb-1">
                        <EyeOff className="h-4 w-4" />
                      </div>
                      <span className="text-[10px] font-mono text-red-400 uppercase tracking-widest font-black">RLS REDACTED</span>
                      <span className="text-[9px] text-gray-500 text-center scale-90 max-w-xs block mt-0.5">
                        {(!currentClearance || !currentDepartment) 
                          ? 'Sessão Nula - Fail-Closed Ativado'
                          : `Requisitos: Clearance >= ${doc.classificacao} e Dept == ${doc.departamento_dono}`
                        }
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
