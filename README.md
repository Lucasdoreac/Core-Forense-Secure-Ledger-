# Core Forense - Ledger & Security Simulator (ISDS V3 Compliant)

Este repositório contém o **Core Forense Ledger Simulator**, uma aplicação interativa desenvolvida em React + TypeScript para demonstração prática e homologação de mecanismos de confiabilidade, governança de dados e defesas sistêmicas contra sabotagem interna ou escalação de privilégios em bancos de dados relacionais (*PostgreSQL 16+*).

Em total conformidade com a **Diretriz de Defesa Sistêmica e Integridade (ISDS V3)**, a aplicação simula com fidelidade matemática e semântica transacional os controles contidos no Core Forense.

---

## 🎨 Arquitetura de Defesas Implementada

O simulador modela quatro camadas críticas de defesa cibernética integradas ao motor relacional:

### 1. Integridade de Ledger Criptográfico (Blockchain-like)
* **Encadeamento SHA-256**: Cada operação de modificação (`INSERT`, `UPDATE` de metadados, ou `DELETE_LOGICO`) grava um log de auditoria sequencial inquebrável. O bloco $N$ herda a assinatura do bloco $N-1$ (`hash_anterior`), recalculando o hash do estado atualizado.
* **Detecção Automática de Fraudes**: Se um administrador burlar a segurança e alterar os dados brutos de forma retroativa, a cadeia linear de custódia acusa quebra imediata na verificação geométrica de assinaturas.

### 2. Sincronização por Advisory Locks (pg_advisory_xact_lock)
* **Mitigação de Concorrência**: Evita a condição de corrida clássica em bancos multiversão (*MVCC*). Sob alta carga concorrente (por exemplo, 5.000 requisições simultâneas), threads comuns gerariam ramificações (*forks*) no cálculo de hashes anteriores paralelos.
* **Locks em nível de transação**: O semáforo na memória RAM do banco serializa a gravação e liberação no ledger de maneira rápida e fail-closed, sem travar tabelas inteiras ou causar lentidão sistêmica.

### 3. Compartimentação Baseada em Atributos (ABAC / RLS)
* **Row-Level Security (RLS)**: Aplicação ativa e forçada (`FORCE ROW LEVEL SECURITY`) inclusive para o proprietário da tabela. 
* **Need-to-Know**: Restringe o retorno de registros baseado em variáveis dinâmicas de sessão injetadas a partir de claims de tokens JWT (`jwt.claims.clearance_level` e `jwt.claims.department`), impedindo vazamentos transversais de informações de segurança nacional.

### 4. Proteção de Catálogo contra DBA Malicioso (Event Triggers DDL)
* **Gatilhos de Evento Globais**: Interceptam instruções estruturais como `DROP TABLE` ou desativação manual de defesas legítimas (`DISABLE TRIGGER ALL`).
* **Segurança do Ledger**: Aborta a transação de alteração do compilador com alertas insolúveis antes da efetivação no disco de armazenamento físico, forçando ações ruidosas notificadas em canais externos de SIEM.

---

## 🚀 Funcionalidades do Painel

A interface intuitiva foi dividida em cinco abas operacionais independentes:

* **📂 Documentos & ABAC (RLS)**: Simule claims de usuários selecionando departamentos correspondentes e níveis de autorização. Modifique ou exclua os documentos para ver a reação imediata do banco.
* **🛡️ Cadeia de Custódia (Ledger)**: Visualize a cadeia encadeada de logs de auditoria. Ative o **Modo Sabotador** para desativar as travas do trigger e injetar alterações diretas para constatar o colapso do Ledger por corrupção de hash.
* **⚡ Estresse Concorrente**: Execute simulações de sobrecarga de escrita em paralelo para testar a resiliência do algoritmo com e sem a proteção exclusiva de travamento e serialização por **Advisory Locks**.
* **💻 Terminal DDL (Catálogo)**: Um console interativo capaz de emular e tentar sabotar a estrutura do banco através de comandos invasivos ou modificações furtivas. O console simula fielmente a interceptação das exceções geradas pelos *Event Triggers*.
* **📦 Arquivamento WORM**: Gerencie a conversão física de partições utilizando o paradigma temporal mensual por faixas (`PARTITION BY RANGE`). Faça o `DETACH` de logs antigos enviando-os para armazenamento frio.
* **🤖 Auditor Inteligente AI**: Faça perguntas de riscos de exfiltração de dados ou solicite orientações avançadas para o assistente integrado alimentado pelo **Gemini 3.5**.

---

## 🛠️ Tecnologias Utilizadas

* **Framework**: React 19 + TypeScript.
* **Transições e Microanimações**: `motion/react` (staggered cards, overlays fluidos, avisos piscantes).
* **Styling**: Tailwind CSS 4.0 aplicando a tipografia refinada *Outfit* e *JetBrains Mono*.
* **Icons**: Biblioteca integrada via `lucide-react`.
* **Motor Inteligente**: `@google/genai` (SDK Core da Google Cloud).
* **Backend de Simulação**: Servidor Express com emulação fidedigna de processos estruturados e triggers baseadas em transações matemáticas determinísticas do PostgreSQL.

---

## 💻 Instruções de Desenvolvimento

Para rodar a aplicação localmente no seu ambiente de desenvolvimento:

```bash
# Instalar dependências declaradas
npm install

# Iniciar servidor integrado em ambiente isolado de simulação
npm run dev
```

O servidor Express estará ativo escutando tráfegos de entrada na porta local `3000`. Desfrute de um ambiente de homologação robusto e imersivo.
