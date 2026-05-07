# Hades — Projeto Completo

## Visão Geral

Hades é um aplicativo Next.js (App Router) com foco em rastreamento de séries, filmes e gamificação pessoal. Ele integra dados locais armazenados em Prisma/PostgreSQL com APIs externas do TMDB e RSS de notícias para mostrar recomendações, notícias, progresso e metas de exibição.

Tecnologias principais:
- Next.js 16.2.4
- React 19.2.4
- TypeScript 6
- Prisma 6.19.3 + PostgreSQL
- Tailwind CSS 4 (via PostCSS) / CSS global customizado
- TMDB API para dados de mídia

---

## Estrutura de Pastas do Projeto

```
.
├── .env
├── .gitignore
├── README.md
├── package.json
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs
├── eslint.config.mjs
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── public/
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── activity/
│   │   │   │   ├── [id]/route.ts
│   │   │   │   ├── export/route.ts
│   │   │   │   ├── import/route.ts
│   │   │   │   └── route.ts
│   │   │   ├── add-media/route.ts
│   │   │   ├── backup/
│   │   │   │   ├── full-export/route.ts
│   │   │   │   └── full-import/route.ts
│   │   │   ├── entries/
│   │   │   │   ├── [id]/route.ts
│   │   │   │   ├── import/route.ts
│   │   │   │   └── route.ts
│   │   │   ├── entry/
│   │   │   │   ├── [id]/route.ts
│   │   │   │   └── by-slug/[slug]/route.ts
│   │   │   ├── gamification/
│   │   │   │   ├── award-xp/route.ts
│   │   │   │   ├── bootstrap-xp/route.ts
│   │   │   │   ├── challenges/route.ts
│   │   │   │   ├── personal-goals/route.ts
│   │   │   │   ├── reset-daily-challenges/route.ts
│   │   │   │   └── user-stats/route.ts
│   │   │   ├── next-up/route.ts
│   │   │   ├── notifications/route.ts
│   │   │   ├── profile/
│   │   │   │   ├── export/route.ts
│   │   │   │   ├── import/route.ts
│   │   │   │   └── route.ts
│   │   │   ├── refresh-all/route.ts
│   │   │   ├── relations/
│   │   │   │   ├── export/route.ts
│   │   │   │   ├── import/route.ts
│   │   │   │   └── route.ts
│   │   │   ├── staff/
│   │   │   │   ├── [id]/route.ts
│   │   │   │   └── search/route.ts
│   │   │   └── update-entry/route.ts
│   │   ├── gamification/page.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── profile/
│   │   │   ├── page.tsx
│   │   │   └── profile.module.css
│   │   ├── search/page.tsx
│   │   ├── staff/page.tsx
│   │   └── staff/[id]/page.tsx
│   │   └── titles/[id]/page.tsx
│   ├── components/
│   │   ├── AchievementToast.tsx
│   │   ├── AiringProgressCard.tsx
│   │   ├── ChallengeToast.tsx
│   │   ├── ChallengeWidget.tsx
│   │   ├── ListEditor.tsx
│   │   ├── NextUpCard.tsx
│   │   ├── NotificationPanel.tsx
│   │   ├── PersonalGoalModal.tsx
│   │   ├── PersonalGoalsSection.tsx
│   │   ├── xp-progress.module.css
│   │   ├── XPProgressBar.tsx
│   │   ├── XPToastHost.tsx
│   │   └── StaffComponents/
│   │       ├── StaffFavoriteButton.tsx
│   │       ├── StaffHeader.tsx
│   │       └── StaffRolesSection.tsx
│   ├── hooks/
│   │   └── useXPNotification.ts
│   └── lib/
│       ├── activity.ts
│       ├── achievements.ts
│       ├── challenge-generator.ts
│       ├── challenge-tracker.ts
│       ├── gamification.ts
│       ├── level-system.ts
│       ├── next-up.ts
│       ├── notifications.ts
│       ├── personal-goals.ts
│       ├── prisma.ts
│       ├── relations-manager.ts
│       ├── staff.ts
│       ├── tmdb-airing.ts
│       ├── tmdb-titles.ts
│       ├── tmdb.ts
│       ├── utils.ts
│       └── xp-calculator.ts
├── test-db.js
└── other docs and backups
```

---

## Arquivos de Configuração Importantes

- `package.json`: scripts `dev`, `build`, `start`, `lint`; dependências `next`, `react`, `react-dom`, `clsx`, `lucide-react`, `tailwind-merge`; devDependencies incluem Prisma e TypeScript.
- `tsconfig.json`: configura o TypeScript para o App Router, `baseUrl: .` e alias `@/*` para `./src/*`.
- `next.config.ts`: arquivo de configuração Next.js, atualmente vazio e pronto para ajustes adicionais.
- `postcss.config.mjs`: configura o pipeline CSS para Tailwind/PostCSS.
- `.env`: contém variáveis de ambiente como `DATABASE_URL` e `NEXT_PUBLIC_TMDB_API_KEY`.

---

## Banco de Dados e Prisma

### `prisma/schema.prisma`
O modelo de dados principal contém:

- `Entry`: lista de títulos monitorados com campos de TMDB, status, score, progresso, imagens e preferências.
- `Relation`: relações entre entries, por exemplo prequelas, spinoffs e adaptações.
- `Profile`: dados do perfil do usuário, avatar, banner e bio.
- `UserGamification`: XP do usuário, nível atual, badges e progresso.
- `GamificationActivityLog`: histórico de ações gamificadas.
- `StreakData`: streak diário do usuário.
- `UserChallenge`: desafios ativos com metas, status e prêmios.
- `ChallengeCompletion`: desafios concluídos gravados.
- `ActivityLog`: log de atividade de mídia e atualizações.
- `PersonalGoal`: metas pessoais do usuário com tipo, target, progresso e conclusão.

### `src/lib/prisma.ts`
Configura e exporta o cliente Prisma para todo o app.
- Usa `globalForPrisma` para evitar múltiplas instâncias durante desenvolvimento.
- Habilita `log: ['query']` para depuração de consultas.

---

## App Router e Layout Global

### `src/app/layout.tsx`
Define o shell global do app:
- Importa o CSS global em `./globals.css`
- Renderiza a navbar com links para Home, Profile, Browse, Gamification etc.
- Inclui widgets de XP e notificações:
  - `XPProgressBar`
  - `NotificationPanel`
  - `XPToastHost`
  - `AchievementToast`
  - `ChallengeToast`
- Usa `HadesIcon` SVG embutido como logotipo.
- Aplica classes e estilos globais de navbar.

### `src/app/globals.css`
Contém o tema visual principal:
- Paleta escura inspirada em Hades com gradientes rosas/dourados.
- Reset CSS e estilo base para `html`, `body`, links, tipografia.
- Estilização fixa da navbar, rolagem, seleção, animações de logotipo.

---

## Páginas Principais

### `src/app/page.tsx` — Home

A home é uma página server-side que:
- Busca jogos atuais em andamento no banco (`prisma.entry`) com status `WATCHING`.
- Chama a API TMDB para informação de próximo episódio e detalhes de trending.
- Busca notícias de entretenimento via RSS e filtra tópicos de filmes/TV.
- Carrega listas de mudanças recentes e adições via TMDB.
- Exibe `AiringProgressCard`, `NextUpCard` e `ChallengeWidget`.
- Usa `Suspense` para skeletons de carregamento enquanto espera dados.

### `src/app/profile/page.tsx` — Perfil

Página de cliente (`'use client'`) que reúne:
- `ListEditor`: exibe e edita a lista de entries do usuário.
- `PersonalGoalsSection`: exibe metas pessoais e abre `PersonalGoalModal`.
- Hooks de notificação XP via `useXPNotification`.
- Filtros de abas como `overview`, `series`, `films`, `favorites`, `stats`, `search`, `goals`.
- Mecanismos de atualização de progresso, score e favoritos.

### `src/app/search/page.tsx` — Busca

Página de navegação/browse que:
- Permite pesquisa de títulos usando TMDB.
- Exibe resultados de séries e filmes.
- Trabalha com filtros e um sistema de renderização baseado em query.

### `src/app/gamification/page.tsx` — Gamificação

Mostra o painel de gamificação do usuário:
- Barra de XP e badges
- Desafios ativos e completados
- Resumo de progresso
- Possíveis ações de `award-xp`, `bootstrap-xp` e reset de desafios.

### `src/app/staff/page.tsx` e `src/app/staff/[id]/page.tsx`

Gerencia dados de staff / criadores:
- `staff/page.tsx`: lista de staff ou busca de pessoas.
- `staff/[id]/page.tsx`: página dinâmica para detalhe de staff.
- Usa `src/lib/staff.ts` para consultar e transformar dados de staff.

### `src/app/titles/[id]/page.tsx` — Detalhes do título

Página dinâmica de título que exibe informações completas do entry:
- Dados de título, sinopse, progresso, status, notas e staff relacionados.
- Carrega dados de uma entry específica e possivelmente informações do TMDB.

---

## API Routes

A pasta `src/app/api` contém rotas do App Router que expõem a camada backend:

### `activity/`
- `route.ts`: lista de atividades recentes.
- `[id]/route.ts`: operação em item de atividade único.
- `export/route.ts`, `import/route.ts`: exportar/importar logs de atividade.

### `add-media/route.ts`
- Rota para adicionar novos títulos diretamente ao banco de dados.

### `backup/`
- `full-export/route.ts`: exporta backup completo do banco.
- `full-import/route.ts`: importa backup completo.

### `entries/`
- `route.ts`: CRUD e listagem de entries.
- `[id]/route.ts`: operação para entry específica.
- `import/route.ts`: importar entries em lote.

### `entry/`
- `[id]/route.ts`: route para entry por ID.
- `by-slug/[slug]/route.ts`: consulta de entry pelo slug.

### `gamification/`
- `award-xp/route.ts`: concede XP por ação.
- `bootstrap-xp/route.ts`: inicializa XP do usuário.
- `challenges/route.ts`: expõe desafios e atualizações.
- `personal-goals/route.ts`: CRUD de metas pessoais.
- `reset-daily-challenges/route.ts`: reseta desafios diários.
- `user-stats/route.ts`: retorna estatísticas de usuário.

### `next-up/route.ts`
- Retorna itens "próximos" para assistir, com base em regras de prioridade.

### `notifications/route.ts`
- Rota de notificações para o painel de UI.

### `profile/`
- `route.ts`: retorna dados de perfil.
- `export/route.ts`: exporta perfil.
- `import/route.ts`: importa perfil.

### `refresh-all/route.ts`
- Gatilha recarga de dados, provavelmente para sincronizar TMDB, gamificação e cache.

### `relations/`
- `route.ts`: gerencia relações de mídia.
- `export/route.ts` e `import/route.ts`: exportar/importar relações.

### `staff/`
- `search/route.ts`: busca staff.
- `[id]/route.ts`: detalhes de staff.

### `update-entry/route.ts`
- Atualiza progresso, status ou score de uma entrada existente.

---

## Components e UI

### `src/components/PersonalGoalsSection.tsx`
Exibe lista de metas pessoais e controla:
- busca de metas via API
- filtros (ativas, concluídas, todas)
- ações de delete, pin e concluir
- abertura do modal de criação/edição

### `src/components/PersonalGoalModal.tsx`
Modal de criação/edição de metas com:
- seleção de templates de metas
- assistente de IA (Claude) para sugerir metas
- formulário de título, target, unidade, deadline, XP e pin
- validação e chamadas POST/PATCH
- header fixo, conteúdo rolável e footer fixo

### `src/components/AiringProgressCard.tsx`
Mostra cards de títulos em exibição com:
- status de progresso
- indicador de episódios e tempo restante
- hover overlay com detalhes adicionais

### `src/components/NextUpCard.tsx`
Renderiza cards de próximos itens a assistir:
- título, status e progresso
- badge de prioridade e overlay no hover

### `src/components/ChallengeWidget.tsx`
Exibe desafios ativos e progresso gamificado na home.

### `src/components/NotificationPanel.tsx`
Controla abertura do menu de notificações e exibição de alertas.

### `src/components/XPProgressBar.tsx`
Barra de XP global usada no topo para mostrar nível e progresso.

### `src/components/XPToastHost.tsx`
Host de toasts de XP e conquistas na interface.

### `src/components/AchievementToast.tsx` e `ChallengeToast.tsx`
Componentes de toast usados para exibir conquistas e desafios concluídos.

### `src/components/ListEditor.tsx`
Editor de lista de entries, usado em perfil para atualizar status, notas e progresso.

### `src/components/StaffComponents/*`
- `StaffHeader.tsx`: cabeçalho da página de staff com foto, biografia e metadados.
- `StaffRolesSection.tsx`: exibe papeis de staff por título.
- `StaffFavoriteButton.tsx`: botão de favoritar membro staff.

---

## Biblioteca de Lógica (`src/lib`)

### `src/lib/utils.ts`
Funções utilitárias comuns:
- formatação de score
- geração de slugs para entries e títulos
- URLs de imagem do TMDB
- helpers de data

### `src/lib/prisma.ts`
Cliente Prisma centralizado.

### `src/lib/tmdb.ts`
Funções de integração com a API TMDB: busca de detalhes gerais.

### `src/lib/tmdb-titles.ts`
Helpers específicos para títulos, slugs e metadados de filmes/TV.

### `src/lib/tmdb-airing.ts`
Funções para buscar dados de séries em exibição e próximos episódios.

### `src/lib/next-up.ts`
Lógica para calcular o conjunto "Next Up" baseado em entries existentes.

### `src/lib/activity.ts`
Lida com a construção de logs de atividade e leitura de histórico.

### `src/lib/notifications.ts`
Lógica de notificações do sistema e disparo de alertas.

### `src/lib/gamification.ts`
Funções que unem XP, níveis e badges.

### `src/lib/level-system.ts`
Regras de progressão de nível e cálculo de XP necessário.

### `src/lib/xp-calculator.ts`
Calcula XP ganho de ações e tarefas completadas.

### `src/lib/challenge-generator.ts`
Gera desafios com base em categorias e períodos.

### `src/lib/challenge-tracker.ts`
Monitora progresso de desafios e finalização.

### `src/lib/personal-goals.ts`
CRUD e sincronização de metas pessoais:
- `getGoals`, `createGoal`, `updateGoal`, `deleteGoal`, `markGoalComplete`
- `syncGoalProgress`: atualiza `current` com dados reais, mas não completa automaticamente
- helpers de apresentação como `%` e dias restantes

### `src/lib/relations-manager.ts`
Gerencia relações entre entradas de mídia, correspondendo source/target.

### `src/lib/staff.ts`
Lógica de staff e pessoas relacionadas a títulos.

---

## Hooks

### `src/hooks/useXPNotification.ts`
Controla a lógica de notificações de XP:
- Emite eventos de XP ganho
- Centraliza dados para toasts
- Permite disparar alertas visuais ao completar conquistas ou desafios

---

## Padrões de Funcionamento

### Fluxo de entrada de dados
1. Usuário acessa página.
2. Páginas server-side buscam dados do banco e/ou APIs externas.
3. Componentes renderizam cards, listas e modais.
4. Interações do usuário (favoritar, atualizar progresso, criar metas) chamam rotas API.
5. As rotas API usam `src/lib/*` para executar regras de negócio e persistir no Prisma.
6. Notificações e toasts são geradas via `useXPNotification` e componentes de toast.

### Roteamento
- `app/page.tsx`: home estática com conteúdo dinâmico via fetch de TMDB.
- `app/profile/page.tsx`: área de usuário e metas.
- `app/search/page.tsx`: busca de mídia.
- `app/gamification/page.tsx`: painel de gamificação.
- `app/staff/page.tsx` e `app/staff/[id]/page.tsx`: staff e detalhes.
- `app/titles/[id]/page.tsx`: detalhe de título dinâmico.

### Gamificação e metas
- `UserGamification` e `PersonalGoal` são os pilares de progresso.
- Desafios são gerados, rastreados e completados via `UserChallenge`.
- Metas pessoais podem ser criadas, editadas, concluídas e removidas.
- O app tem rotas específicas para award XP, reset de desafios e bootstrap de gamificação.

---

## Observações Extras

- `test-db.js`: possivelmente utilizado para testes rápidos de banco ou execução local.
- Documentos auxiliares como `BUGFIX_PERSONAL_GOALS.md`, `SOLUÇÕES_ANÁLISE.md`, `BACKUP_SYSTEM_GUIDE.md` e `AUDIT_EXPORT_IMPORT.md` são guias e registros de trabalho.
- `public/` contém ícones SVG de suporte, mas nenhuma imagem de mídia principal.

---

## Recomendações para leitura rápida

1. `src/app/layout.tsx`: estrutura de navegação global.
2. `src/app/page.tsx`: principal lógica de home e integração TMDB.
3. `src/app/profile/page.tsx`: workflow de perfil e metas.
4. `src/app/api/gamification/personal-goals/route.ts`: API de metas pessoais.
5. `src/lib/personal-goals.ts`: regras de negócio de metas.
6. `prisma/schema.prisma`: modelo de dados completo.

---

Este documento cobre a arquitetura principal, o propósito dos arquivos mais importantes e a forma como cada camada do aplicativo se conecta.
