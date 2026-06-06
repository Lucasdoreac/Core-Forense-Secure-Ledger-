import React, { useState } from 'react';
import { Bot, Send, ShieldAlert, Sparkles, HelpCircle, HardDrive, Cpu, Terminal, Key, RefreshCw } from 'lucide-react';

interface AIAuditorProps {
  onCallGemini: (prompt: string) => Promise<string>;
}

export default function AIAuditor({ onCallGemini }: AIAuditorProps) {
  const [loading, setLoading] = useState(false);
  const [userInput, setUserInput] = useState('');
  
  // Converational dialogue logs
  const [dialogues, setDialogues] = useState<Array<{
    sender: 'user' | 'assistant';
    text: string;
    timestamp: string;
  }>>([
    {
      sender: 'assistant',
      text: 'Olá! Sou o **Assistente AI de Auditoria de Defesa e Confiabilidade de Bancos de Dados**. Estou pronto para avaliar o comportamento do Core Forense, analisar seus scripts DDL/DML, validar vulnerabilidades e propor blindagens técnicas. Escolha um dos tópicos sugeridos ou envie sua própria query!',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);

  const presetQuestions = [
    {
      title: 'Blockchain & Race Conditions',
      desc: 'Como Advisory Locks evitam fragmentação de hashes sob 5000 acessos?',
      prompt: 'Explique detalhadamente como a trava preventiva pg_advisory_xact_lock() sincroniza o cálculo consecutivo de hashes em auditoria linear e impede forks na cadeia de custódia (ledgers).'
    },
    {
      title: 'Segurança Zero-Trust RLS',
      desc: 'Por que o RLS garante Fail-Closed frente a DBAs?',
      prompt: 'Como a aplicação conjunta de Row-Level Security (ENABLE RLS), FORCE RLS e variáveis de sessão jwt.claims garantem que nem mesmo o superusuário postgres consiga exfiltrar dados sem token correto?'
    },
    {
      title: 'Ataques Antiforenses DDL',
      desc: 'Como Event Triggers barram DROP TABLE e alteração de gatilhos?',
      prompt: 'Qual a diferença entre uma trigger de tabela DML tradicional e um Event Trigger de banco de dados DDL para proteção contra administradores maliciosos que desejam apagar vestígios?'
    },
    {
      title: 'Hardening & Custódia WORM',
      desc: 'Como as partições permitem expurgo de forma segura?',
      prompt: 'Como o particionamento temporal mensal (PARTITION BY RANGE) e desvencilhamento (DETACH PARTITION) viabilizam arquivamento frio de logs sob o paradigma imutável WORM?'
    }
  ];

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;
    setLoading(true);

    const userMessage = {
      sender: 'user' as const,
      text: textToSend,
      timestamp: new Date().toLocaleTimeString()
    };
    setDialogues(prev => [...prev, userMessage]);

    try {
      const responseText = await onCallGemini(textToSend);
      
      setDialogues(prev => [...prev, {
        sender: 'assistant' as const,
        text: responseText,
        timestamp: new Date().toLocaleTimeString()
      }]);
    } catch (err: any) {
      setDialogues(prev => [...prev, {
        sender: 'assistant' as const,
        text: `FALHA DE PROCESSAMENTO DA IA: ${err.message || 'Mecanismo Gemini temporariamente indisponível. Verifique suas credenciais de nuvem.'}`,
        timestamp: new Date().toLocaleTimeString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || loading) return;
    handleSend(userInput);
    setUserInput('');
  };

  // Simplistic clean parser for Markdown-style bold texts and lists
  const renderFormattedText = (rawText: string) => {
    const lines = rawText.split('\n');
    return lines.map((line, lineIdx) => {
      // Codeblock renderer
      if (line.startsWith('```')) {
        return null; // For simple display, let's keep it compact
      }

      // Check bullet point lists
      let content = line;
      let isBullet = false;
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        isBullet = true;
        content = line.trim().substring(2);
      } else if (/^\d+\.\s/.test(line.trim())) {
        isBullet = true;
        content = line.trim().replace(/^\d+\.\s/, '');
      }

      // Basic Bold parse (**text**)
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIdx = 0;
      let match;
      
      while ((match = boldRegex.exec(content)) !== null) {
        if (match.index > lastIdx) {
          parts.push(content.substring(lastIdx, match.index));
        }
        parts.push(<strong key={match.index} className="text-white font-semibold">{match[1]}</strong>);
        lastIdx = boldRegex.lastIndex;
      }
      
      if (lastIdx < content.length) {
        parts.push(content.substring(lastIdx));
      }

      const inlineCodeRegex = /`(.*?)`/g;
      // If we find backticks, render them as mono
      const textToDisplay = parts.length > 0 ? parts : [content];

      if (isBullet) {
        return (
          <li key={lineIdx} className="ml-4 list-disc pl-1 text-[#cbd5e1] text-xs font-sans mt-1">
            {textToDisplay}
          </li>
        );
      }

      return (
        <p key={lineIdx} className="text-xs text-[#cbd5e1] font-sans leading-relaxed mt-1.5 min-h-[1px]">
          {textToDisplay}
        </p>
      );
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Header description */}
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-5 shadow-2xl relative overflow-hidden flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-md font-display font-bold text-gray-100 flex items-center gap-1.5 animate-pulse">
              Consultor de Segurança AI (Gemini Core Defense)
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Avalie seus scripts de banco de dados, aprenda padrões e investigue cenários de ataque do playbooks sob a tutela do modelo avançado da Google.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-purple-500/10 text-purple-400 px-3 py-1 border border-purple-500/20 rounded-full text-[10px] font-mono">
          <Sparkles className="h-3 w-5" />
          Model: gemini-3.5-flash
        </div>
      </div>

      {/* 2. Interactive Dialogues Canvas */}
      <div className="bg-[#090d16] border border-zinc-800 rounded-xl overflow-hidden shadow-2xl flex flex-col h-[400px]">
        {/* Dialogue history scroll */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 scrollbar">
          {dialogues.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
            >
              {/* Profile icon */}
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center border font-bold flex-shrink-0 select-none ${
                msg.sender === 'user'
                  ? 'bg-zinc-800 text-purple-400 border-zinc-700'
                  : 'bg-indigo-600/15 text-[#6366f1] border-[#6366f1]/20'
              }`}>
                {msg.sender === 'user' ? 'U' : <Bot className="h-4 w-4" />}
              </div>

              {/* Message text bubble */}
              <div className={`p-4 rounded-xl border flex flex-col ${
                msg.sender === 'user'
                  ? 'bg-zinc-900 border-zinc-800 text-gray-200 rounded-tr-none'
                  : 'bg-[#111827] border-[#1f2937] text-gray-300 rounded-tl-none'
              }`}>
                <div className="space-y-1">
                  {renderFormattedText(msg.text)}
                </div>
                <span className="text-[9px] text-gray-500 font-mono mt-2 self-start uppercase select-none">
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))}

          {/* Artificial streaming/thinking loader */}
          {loading && (
            <div className="flex gap-3 max-w-[85%]">
              <div className="h-8 w-8 rounded-lg bg-indigo-600/15 text-[#6366f1] border border-[#6366f1]/20 flex items-center justify-center flex-shrink-0 animate-ping">
                <Bot className="h-4 w-4" />
              </div>
              <div className="p-4 bg-[#111827] border border-[#1f2937] rounded-xl rounded-tl-none text-xs text-gray-400 flex items-center gap-2 font-mono">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-purple-400" />
                Auditor Ciber-Forense analisando o log da transação...
              </div>
            </div>
          )}
        </div>

        {/* Console Input Send Drawer Form */}
        <form onSubmit={handleSubmit} className="border-t border-zinc-800/60 p-3 bg-[#0c1221] flex gap-2">
          <input
            type="text"
            required
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            disabled={loading}
            placeholder="Pergunte sobre as vulnerabilidades, os triggers PL/pgSQL ou peça sugestões de hardening..."
            className="flex-1 bg-transparent px-3.5 py-2 hover:border-[#1f2937] rounded-lg border border-zinc-800/80 outline-none text-xs text-white placeholder-gray-500 font-sans focus:border-indigo-500 transition-colors disabled:text-gray-600"
          />
          <button
            type="submit"
            disabled={loading || !userInput.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 text-white rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1.5 font-bold"
          >
            <Send className="h-3.5 w-3.5" />
            Enviar
          </button>
        </form>
      </div>

      {/* 3. Preset suggested topics */}
      <div className="space-y-3">
        <h4 className="text-xs font-mono text-gray-400 tracking-wider">TÓPICOS RÁPIDOS SUGERIDOS PARA AUDITORIA</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {presetQuestions.map((q, i) => (
            <button
              key={i}
              id={`preset-prompt-${i}`}
              onClick={() => handleSend(q.prompt)}
              disabled={loading}
              className="text-left bg-[#111827] border border-[#1f2937] p-4 rounded-xl space-y-2 hover:border-zinc-700 transition-all cursor-pointer disabled:opacity-50 select-none"
            >
              <div className="flex items-start gap-2.5">
                <div className="p-1 bg-[#1f2937] sm:bg-transparent rounded mt-0.5 text-indigo-400">
                  <HelpCircle className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-200 font-sans">{q.title}</h4>
                  <p className="text-[11px] text-gray-400 pt-0.5 leading-snug font-sans">{q.desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
