# HADES — Documentação Master Completa

**Versão:** 4.0 (Mai 2026)  
**Status:** Em Desenvolvimento Ativo  
**Última Atualização:** 12 de Maio de 2026

---

## 📑 Sumário Executivo

Hades é um aplicativo Next.js avançado para rastreamento de séries, filmes e gamificação pessoal com sincronização em tempo real com TMDB, sistema visual inteligente de status de produção e 100+ conquistas personalizadas.

**Pilares do Projeto:**
- ✅ Rastreamento completo de mídia (séries, filmes, documentários)
- ✅ Sistema de gamificação com XP, níveis e desafios
- ✅ Metas pessoais inteligentes com IA
- ✅ Sincronização em tempo real com TMDB (Fase 1 — concluída)
- ✅ Status visual com bolinhas de produção (Fase 2 — concluída e refinada)
- ✅ Filtros avançados por status de produção
- ✅ 100+ conquistas baseadas em comportamento do usuário (Fase 5 — concluída)
- ✅ Sistema de temporadas com visibilidade condicional (Fase 4 — concluída)
- ✅ Interface visual inspirada em AniList

---

## 🎯 Índice

1. [Visão Geral](#visão-geral)
2. [Status Atual do Projeto](#status-atual-do-projeto)
3. [Arquitetura do Projeto](#arquitetura-do-projeto)
4. [Banco de Dados](#banco-de-dados)
5. [Bugs Conhecidos](#bugs-conhecidos)
6. [Sistema Visual - Bolinhas de Status](#sistema-visual---bolinhas-de-status)
7. [Sistema de Sincronização em Tempo Real](#sistema-de-sincronização-em-tempo-real)
8. [Melhorias Visuais](#melhorias-visuais)
9. [Sistema de Filtragem Avançado](#sistema-de-filtragem-avançado)
10. [Sistema de Temporadas](#sistema-de-temporadas)
11. [100+ Conquistas](#100-conquistas)
12. [Página de Browser Aprimorada](#página-de-browser-aprimorada)
13. [Features Existentes](#features-existentes)
14. [Checklist de Implementação](#checklist-de-implementação)

---

## 📚 Visão Geral

## 🧠 Status Atual do Projeto

### Fases Concluídas

- ✅ **Fase 1 — Sincronização TMDB**: `tmdb-sync.ts` implementado, agendador cron ativo, tabela `SyncLog` criada, rota `/api/sync` funcional.
- ✅ **Fase 2 — Bolinhas de Status (StatusBubble)**: componente implementado em `src/components/StatusBubble.tsx`, integrado a todos os cards. **Refinamento aplicado em Mai/2026**: bolinha não renderiza para `Released` (filmes) e `Ended` (séries) — estados "normais" não precisam de indicador visual, igual ao sistema do AniList.
- ✅ **Fase 4 — Sistema de Temporadas**: visibilidade de temporadas e relações reduzida no frontend. `relations` visível apenas em `titles/[id]`. Season pills removidas de profile, cards e modais. `ListEditor.tsx` revisado.
- ✅ **Fase 5 — 100+ Conquistas**: `achievements.ts` expandido, `AchievementEngine` integrado às ações do usuário, UI de conquistas e toasts de desbloqueio implementados.

### Alterações Recentes (Mai/2026)

- `StatusBubble.tsx` refinado: adicionada lógica de `SILENT_STATUSES` — `Released` e `Ended` retornam `null`, sem renderizar bolinha. Comportamento inteligente idêntico ao AniList.
- `StatusDot` removido de `src/app/profile/page.tsx` (`EntryCard`): bolinhas de watching/completed/paused/etc não existem mais nos cards do profile. A barra de cor no topo do card já indica o status de watch do usuário.
- Import de `StatusDot` removido do `profile/page.tsx`.

### Pendências Imediatas

- [ ] Validar que `StatusDot` também foi removido de outros componentes que não sejam o profile (ex: `AiringProgressCard`, `NextUpCard`, `MediaCard`) caso esteja sendo usado.
- [ ] Confirmar que o comportamento de `relations` permanece apenas no tab de detalhes de título após as últimas alterações.
- [ ] Revisar se há uso residual de `StatusDot` em outros lugares do app que não fazem sentido após a mudança de escopo.

### Bugs Recentes

- **Bug #2**: Malformed JSX comment em `src/app/titles/[id]/page.tsx` após remover season UI. ✅ Corrigido.
- **Bug #3**: Possível UI residual de `season` / `episode` em `ListEditor.tsx` e modais de adicionar título. Necessita validação final.

### Notas Técnicas

- `StatusBubble` usa `SILENT_STATUSES = new Set(['Released', 'Ended'])` — se o status normalizado estiver nesse set, o componente retorna `null`. Sem bolinha, sem espaço ocupado.
- A barra de cor no topo do `EntryCard` (profile) continua existindo e indica o status de watch (`WATCHING`, `COMPLETED`, etc) via `STATUS_COLOR`. Esse é o único indicador de status de watch nos cards.
- A camada de dados continua suportando temporada/episódio para evitar regressão no histórico de progresso.

### Estado Atual

- `npm run build` passou sem erros.
- Fases 1, 2 (com refinamento), 4 e 5 concluídas.
- Fases 3, 6, 7 e 8 pendentes.

---

### Tecnologias Principais

```
Frontend:
- Next.js 16.2.4 (App Router)
- React 19.2.4
- TypeScript 6
- Tailwind CSS 4 + PostCSS
- CSS global customizado

Backend:
- Node.js / Next.js API Routes
- Prisma 6.19.3 ORM
- PostgreSQL

Integrações Externas:
- TMDB API (dados de mídia)
- RSS Feed (notícias de entretenimento)

Build & Deploy:
- ESLint para linting
- Next.js Build otimizado
```

### Funcionalidades Principais

1. **Rastreamento de Mídia**: Adicione, edite e acompanhe séries, filmes e documentários
2. **Gamificação**: XP, níveis, badges e desafios diários
3. **Metas Pessoais**: Defina e acompanhe metas com assistência de IA
4. **Sincronização em Tempo Real**: Atualização automática de dados do TMDB
5. **Status Visual**: Bolinhas de produção inteligentes (invisíveis para Released/Ended)
6. **Filtros Inteligentes**: Filtragem por status de produção
7. **Sistema de Temporadas**: Acompanhamento de temporadas restrito a páginas de título
8. **Sistema de Favoritos**: Marque títulos e staff como favoritos
9. **Backup/Restore**: Exporte e importe dados completos
10. **Atividade**: Log de todas as interações

---

## 🏗️ Arquitetura do Projeto

### Estrutura de Pastas Atual

```
hades/
├── prisma/
│   ├── schema.prisma              (Modelos de dados)
│   └── migrations/                (Histórico de schema)
├── public/                        (Assets estáticos)
├── src/
│   ├── app/
│   │   ├── api/                   (API routes)
│   │   │   ├── activity/          (activity logs)
│   │   │   ├── add-media/         (API para adicionar mídia)
│   │   │   ├── backup/            (export/import de dados)
│   │   │   ├── entries/           (operações de coleção de títulos)
│   │   │   ├── entry/             (operações de título único)
│   │   │   ├── gamification/      (XP, desafios, metas)
│   │   │   ├── next-up/           (dados de próximo a assistir)
│   │   │   ├── notifications/     (notificações do usuário)
│   │   │   ├── profile/           (perfil do usuário)
│   │   │   ├── refresh-all/       (sincronização completa)
│   │   │   ├── relations/         (relações entre títulos)
│   │   │   ├── seasons/           (dados de temporadas)
│   │   │   ├── staff/             (dados de staff)
│   │   │   ├── sync/              (sincronização TMDB)
│   │   │   └── update-entry/      (atualização de título)
│   │   ├── browser/page.tsx       (browser principal e filtros)
│   │   ├── gamification/page.tsx  (painel de gamificação)
│   │   ├── globals.css            (estilos globais)
│   │   ├── layout.tsx             (layout e inicialização global)
│   │   ├── page.tsx               (home)
│   │   ├── profile/page.tsx       (página de perfil do usuário)
│   │   ├── search/page.tsx        (busca de títulos)
│   │   ├── staff/page.tsx         (lista de staff)
│   │   ├── staff/[id]/page.tsx    (detalhes de staff)
│   │   └── titles/[id]/page.tsx   (detalhes de título)
│   ├── components/
│   │   ├── AchievementToast.tsx
│   │   ├── AiringProgressCard.tsx
│   │   ├── ChallengeToast.tsx
│   │   ├── ChallengeWidget.tsx
│   │   ├── EpisodeGrid.tsx
│   │   ├── ListEditor.tsx
│   │   ├── MediaCard.tsx
│   │   ├── NextUpCard.tsx
│   │   ├── NotificationPanel.tsx
│   │   ├── PersonalGoalModal.tsx
│   │   ├── PersonalGoalsSection.tsx
│   │   ├── ProductionFilterBar.tsx
│   │   ├── SeasonSelector.tsx
│   │   ├── StaffComponents/
│   │   ├── StatusBubble.tsx       ← bolinha de produção inteligente
│   │   ├── StatusDot.tsx          ← NÃO usar em cards de profile/lista
│   │   ├── TvSeasonNavClient.tsx
│   │   ├── XPProgressBar.tsx
│   │   ├── XPToastHost.tsx
│   │   └── xp-progress.module.css
│   └── lib/
│       ├── achievements.ts
│       ├── activity.ts
│       ├── browser-filter.ts
│       ├── challenge-generator.ts
│       ├── challenge-tracker.ts
│       ├── entry-poster-sync.ts
│       ├── gamification.ts
│       ├── level-system.ts
│       ├── next-up.ts
│       ├── notifications.ts
│       ├── personal-goals.ts
│       ├── prisma.ts
│       ├── production-status.ts   ← cores e tipos de produção
│       ├── relations-manager.ts
│       ├── seasons.ts
│       ├── staff.ts
│       ├── tmdb-airing.ts
│       ├── tmdb-sync.ts           ← sincronização com TMDB
│       ├── tmdb-titles.ts
│       ├── tmdb.ts
│       ├── utils.ts
│       └── xp-calculator.ts
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
├── eslint.config.mjs
├── next-env.d.ts
└── .env
```

### Rotas de API Principais

- `/api/activity` — logs de atividade do usuário
- `/api/add-media` — adicionar nova mídia ao catálogo
- `/api/backup` — exportação e importação de dados
- `/api/entries` — CRUD e listagem de entradas
- `/api/entry` — operações individuais de entrada
- `/api/gamification` — XP, conquistas, desafios e metas
- `/api/next-up` — dados de próximos episódios/títulos
- `/api/notifications` — notificações do usuário
- `/api/profile` — carregamento e atualização de perfil
- `/api/refresh-all` — sincronização completa de dados
- `/api/relations` — relações entre títulos
- `/api/seasons` — temporadas e dados relacionados
- `/api/staff` — busca e dados de staff
- `/api/sync` — sincronização manual TMDB
- `/api/update-entry` — atualizar campos de entrada específicos

### Dependências e Ferramentas

- `next` 16.2.4
- `react` 19.2.4
- `typescript` 6
- `tailwindcss` 4
- `prisma` 6.19.3
- `node-cron` + `p-queue` para agendamento e fila de sincronização
- `lucide-react` para ícones
- `clsx` para composição condicional de classes
- `isomorphic-fetch` para chamadas HTTP compatíveis cliente/servidor

### Scripts Principais

- `npm run dev` — inicia o servidor de desenvolvimento
- `npm run build` — gera Prisma Client e compila o app para produção
- `npm run start` — inicia o servidor de produção
- `npm run lint` — executa ESLint
- `postinstall` — `prisma generate`

---

## 🗄️ Banco de Dados

### Schema Atual (`prisma/schema.prisma`)

O schema real implementado usa os seguintes modelos principais:

```prisma
enum MediaStatus {
  WATCHING
  COMPLETED
  PAUSED
  DROPPED
  PLANNING
  REWATCHING
  UPCOMING
}

enum MediaType {
  MOVIE
  TV_SEASON
}

model Entry {
  id             String      @id @default(cuid())
  tmdbId         Int         @unique
  parentTmdbId   Int?
  seasonNumber   Int?
  title          String
  type           MediaType
  status         MediaStatus @default(PLANNING)
  score          Float       @default(0)
  progress       Int         @default(0)
  totalEpisodes  Int?
  totalSeasons   Int?
  episodeRuntime Int?

  startDate    DateTime?
  finishDate   DateTime?
  rewatchCount Int       @default(0)

  synopsis         String?   @db.Text
  releaseDate      String?
  endDate          String?
  lastAirDate      String?
  format           String?
  rating           Float?
  popularity       Float?
  imagePath        String?
  bannerPath       String?
  logoPath         String?
  customImage      String?
  genres           String?
  studio           String?
  networks         String?
  languages        String?
  staff            Json?
  productionStatus String    @default("Released")
  lastSyncedAt     DateTime?

  notes          String? @db.Text
  private        Boolean @default(false)
  hidden         Boolean @default(false)
  hasNewEpisodes Boolean @default(false)

  isFavorite   Boolean @default(false)
  favoriteRank Int?

  updatedAt DateTime @updatedAt
  createdAt DateTime @default(now())

  relationsFrom Relation[] @relation("SourceRelations")
  relationsTo   Relation[] @relation("TargetRelations")
  seasons       Season[]
  episodes      Episode[]
  syncLogs      SyncLog[]
}

model Profile {
  id          String   @id @default("main")
  username    String   @default("My Profile")
  bio         String?
  avatarUrl   String?
  bannerUrl   String?
  avatarColor String   @default("#3db4f2")
  updatedAt   DateTime @updatedAt
  createdAt   DateTime @default(now())
}

model SyncLog {
  id            String   @id @default(cuid())
  entryId       String
  changedFields String[] @default([])
  status        String
  errorMessage  String?  @db.Text
  syncedAt      DateTime @default(now())

  entry Entry @relation(fields: [entryId], references: [id], onDelete: Cascade)
}

model Season {
  id           String   @id @default(cuid())
  entryId      String
  tmdbId       Int?
  parentTmdbId Int
  seasonNumber Int
  title        String
  overview     String?  @db.Text
  posterPath   String?
  airDate      String?
  episodeCount Int      @default(0)
  status       String   @default("Unknown")

  entry    Entry     @relation(...)
  episodes Episode[]

  @@unique([entryId, seasonNumber])
}

model Episode {
  id            String    @id @default(cuid())
  entryId       String
  seasonId      String?
  tmdbId        Int?
  parentTmdbId  Int
  seasonNumber  Int
  episodeNumber Int
  title         String
  overview      String?   @db.Text
  stillPath     String?
  airDate       String?
  runtime       Int?
  watched       Boolean   @default(false)
  watchedAt     DateTime?

  entry  Entry   @relation(...)
  season Season? @relation(...)

  @@unique([entryId, seasonNumber, episodeNumber])
}
```

---

## 🐛 Bugs Conhecidos

### Bug #1: Personal Goals — Conclusão Automática

**Descrição:**
Sistema está completando automaticamente metas pessoais sem ação explícita do usuário.

**Localização:**
- `src/components/PersonalGoalsSection.tsx`
- `src/lib/personal-goals.ts`
- `src/app/api/gamification/personal-goals/route.ts`

**Problema Raiz:**
- `syncGoalProgress()` em `personal-goals.ts` está atualizando `current` com base em dados reais
- Função não deve completar automaticamente, apenas sincronizar valor de progresso

**Solução:**
```typescript
// ✅ CORRETO — apenas sincronizar valor, nunca marcar como completo
export async function syncGoalProgress(goalId: string) {
  const goal = await prisma.personalGoal.findUnique({ where: { id: goalId } })
  const realProgress = await calculateRealProgress(goal)

  await prisma.personalGoal.update({
    where: { id: goalId },
    data: { current: realProgress }
    // ❌ NUNCA chamar markGoalComplete() aqui
  })
}
```

**Status:** ⚠️ Pendente de validação

---

### Bug #3: UI Residual de Temporada em ListEditor

**Descrição:**
Possível renderização de season pills ou controles de temporada/episódio no `ListEditor.tsx` e nos modais de adição de título.

**Localização:**
- `src/components/ListEditor.tsx`

**Status:** ⚠️ Pendente de validação final

---

## 🎨 Sistema Visual - Bolinhas de Status

### Comportamento Inteligente (Estilo AniList)

A `StatusBubble` segue o mesmo princípio do sistema de bolinhas do AniList: **só exibe bolinha para statuses que precisam de atenção ou indicam algo fora do estado padrão**. Títulos já lançados ou encerrados não recebem indicador visual — eles são a maioria e não precisam de destaque.

**Regra central:** `Released` (filmes) e `Ended` (séries) = sem bolinha. Qualquer outro status = bolinha colorida.

### Tabela de Cores — Filmes

| Status | Bolinha | Hex | Descrição |
|--------|---------|-----|-----------|
| Rumored | 🔴 Vermelho | `#ef4444` | Rumor de produção |
| Planned | 🟠 Laranja | `#f97316` | Planejado |
| In Production | 🟡 Amarelo | `#eab308` | Em produção |
| Post Production | 🟣 Roxo | `#a855f7` | Pós-produção |
| Released | _(sem bolinha)_ | — | Lançado — estado normal |
| Canceled | ⚫ Cinza | `#6b7280` | Cancelado |

### Tabela de Cores — Séries

| Status | Bolinha | Hex | Descrição |
|--------|---------|-----|-----------|
| Planned | 🔴 Vermelho | `#ef4444` | Planejada |
| In Production | 🟠 Laranja | `#f97316` | Em produção |
| Returning Series | 🟢 Verde | `#22c55e` | Retornando |
| Pilot | 🔵 Azul | `#3b82f6` | Piloto |
| Ended | _(sem bolinha)_ | — | Finalizada — estado normal |
| Canceled | ⚫ Preto | `#000000` | Cancelada |

### Componente `StatusBubble.tsx` (implementação atual)

```typescript
// src/components/StatusBubble.tsx

import {
  PRODUCTION_STATUS_COLORS,
  type MediaKind,
  type ProductionStatus,
} from '@/lib/production-status';

// Statuses que NÃO exibem bolinha — são o estado "normal" de cada tipo
const SILENT_STATUSES = new Set<string>(['Released', 'Ended']);

interface StatusBubbleProps {
  status?: ProductionStatus | string | null;
  mediaType?: MediaKind | 'MOVIE' | 'TV_SEASON';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_MAP = {
  sm: { size: 8,  offset: 5 },
  md: { size: 12, offset: 7 },
  lg: { size: 16, offset: 9 },
};

export default function StatusBubble({
  status,
  mediaType,
  size = 'sm',
  className,
}: StatusBubbleProps) {
  const normalized = (
    status ||
    (mediaType === 'MOVIE' || mediaType === 'movie' ? 'Released' : 'Ended')
  ) as ProductionStatus;

  // Released e Ended não renderizam bolinha
  if (SILENT_STATUSES.has(normalized)) return null;

  const color = PRODUCTION_STATUS_COLORS[normalized] ?? '#6b7280';
  const dimensions = SIZE_MAP[size];

  return (
    <span
      className={className}
      title={normalized}
      aria-label={`Production status: ${normalized}`}
      style={{
        position: 'absolute',
        top:    dimensions.offset,
        left:   dimensions.offset,
        width:  dimensions.size,
        height: dimensions.size,
        borderRadius:    '50%',
        backgroundColor: color,
        border:    '1px solid rgba(255,255,255,0.55)',
        zIndex:    12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.45)',
        pointerEvents: 'none',
      }}
    />
  );
}
```

### Integração em Cards

`StatusBubble` é usado em todos os cards do site via:
```tsx
<StatusBubble
  status={entry.productionStatus}
  mediaType={entry.type}
  size="sm"
/>
```

A bolinha fica no canto superior esquerdo do poster (`position: absolute`, `top/left: offset`). O card pai precisa de `position: relative`.

### StatusDot — Uso Restrito

`StatusDot` (bolinha de watching/completed/paused/etc) **NÃO deve ser usado em cards de listagem ou profile**. Foi removido de `profile/page.tsx`. A barra de cor no topo do `EntryCard` já cumpre essa função visualmente.

`StatusDot` pode ser usado apenas onde fizer sentido contextual explícito (ex: badges específicos de gamificação).

---

## ⚡ Sistema de Sincronização em Tempo Real

### Estratégia de Sincronização

**Tipo 1: Sincronização Periódica (Background)**
- Executada a cada 6 horas via `node-cron`
- Atualiza todos os títulos cadastrados
- Processa em fila com limite de 5 requisições paralelas (`p-queue`)

**Tipo 2: Sincronização on-demand**
- Usuário clica em "atualizar" manualmente
- Rota: `POST /api/sync/manual` com `{ entryId }`

**Tipo 3: Sincronização ao adicionar título**
- Busca dados iniciais completos do TMDB ao criar entry
- Salva com `lastSyncedAt`

### Implementação Principal

```typescript
// src/lib/tmdb-sync.ts

import cron from 'node-cron'
import PQueue from 'p-queue'
import { prisma } from './prisma'
import { fetchTMDBData } from './tmdb'

const syncQueue = new PQueue({ concurrency: 5 })

export async function syncEntryWithTMDB(entryId: string) {
  try {
    const entry = await prisma.entry.findUnique({ where: { id: entryId } })
    if (!entry) throw new Error('Entry not found')

    const tmdbData = await fetchTMDBData(entry.tmdbId, entry.type)
    const changes: Record<string, unknown> = {}
    const changedFields: string[] = []

    if (tmdbData.title !== entry.title) {
      changes.title = tmdbData.title; changedFields.push('title')
    }
    if (tmdbData.posterPath !== entry.imagePath) {
      changes.imagePath = tmdbData.posterPath; changedFields.push('imagePath')
    }
    if (tmdbData.productionStatus !== entry.productionStatus) {
      changes.productionStatus = tmdbData.productionStatus
      changedFields.push('productionStatus')
    }

    if (changedFields.length > 0) {
      await prisma.entry.update({
        where: { id: entryId },
        data: { ...changes, lastSyncedAt: new Date() }
      })
      await prisma.syncLog.create({
        data: { entryId, changedFields, status: 'success' }
      })
    } else {
      await prisma.entry.update({
        where: { id: entryId },
        data: { lastSyncedAt: new Date() }
      })
    }

    return { success: true, changedFields }
  } catch (error: any) {
    await prisma.syncLog.create({
      data: { entryId, status: 'failed', errorMessage: error.message }
    })
    return { success: false, changedFields: [], error: error.message }
  }
}

export async function syncAllEntries() {
  const entries = await prisma.entry.findMany({ select: { id: true } })
  for (const entry of entries) {
    syncQueue.add(() => syncEntryWithTMDB(entry.id))
  }
  await syncQueue.onIdle()
}

export function initSyncScheduler() {
  cron.schedule('0 */6 * * *', async () => {
    await syncAllEntries()
  })
}
```

### Inicialização no App

```typescript
// src/app/layout.tsx
import { initSyncScheduler } from '@/lib/tmdb-sync'

if (typeof window === 'undefined') {
  initSyncScheduler()
}
```

---

## 🎨 Melhorias Visuais

### Cards de Mídia — Grid Responsivo

```css
.media-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  padding: 24px;
}

@media (max-width: 1400px) { .media-grid { grid-template-columns: repeat(4, 1fr); } }
@media (max-width: 1024px) { .media-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 768px)  { .media-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 480px)  { .media-grid { grid-template-columns: 1fr; } }
```

### EntryCard — Profile (`profile/page.tsx`)

Estrutura do card nos status de produção:
- **Barra de cor no topo** (4px) indica o status de watch (`STATUS_COLOR[entry.status]`)
- **StatusBubble** no canto superior esquerdo indica o production status (invisível para Released/Ended)
- **Sem StatusDot** — removido. A barra de cor já cumpre essa função

```tsx
// Estrutura do EntryCard (simplificada)
<div style={{ position: 'relative', ... }}>
  {/* Barra de status de watch */}
  <div style={{ background: STATUS_COLOR[entry.status], height: '4px', ... }} />
  
  {/* Bolinha de production status (invisível para Released/Ended) */}
  <StatusBubble status={entry.productionStatus} mediaType={entry.type} size="sm" />

  {/* Poster + overlay + progresso + score */}
  <Link href={...}>...</Link>

  {/* Botões de favorito e editar (visíveis no hover) */}
</div>
```

---

## 🔍 Sistema de Filtragem Avançado

### Filtros por Status de Produção

```typescript
// src/components/ProductionFilterBar.tsx

const MOVIE_FILTERS = ['All', 'Rumored', 'Planned', 'In Production', 'Post Production', 'Released', 'Canceled']
const TV_FILTERS    = ['All', 'Returning Series', 'Planned', 'In Production', 'Ended', 'Canceled', 'Pilot']

interface FilterBarProps {
  mediaType: 'movie' | 'tv'
  selectedFilters: string[]
  onFilterChange: (filters: string[]) => void
}
```

### Lógica de Filtragem

```typescript
// src/lib/browser-filter.ts

export async function getFilteredEntries(
  mediaType: 'MOVIE' | 'TV_SEASON',
  statuses?: string[]
) {
  return prisma.entry.findMany({
    where: {
      type: mediaType,
      ...(statuses && statuses.length > 0 && statuses[0] !== 'All'
        ? { productionStatus: { in: statuses } }
        : {})
    }
  })
}
```

---

## 📺 Sistema de Temporadas

### Visibilidade Condicional (Comportamento Atual)

| Contexto | Temporadas | Relações |
|----------|-----------|----------|
| `titles/[id]/page.tsx` | ✅ Visível | ✅ Visível |
| `profile/page.tsx` | ❌ Oculto | ❌ Oculto |
| `browser/page.tsx` | ❌ Oculto | ❌ Oculto |
| Cards / modais de lista | ❌ Oculto | ❌ Oculto |

### Modelos no Banco

```prisma
model Season {
  id, entryId, tmdbId, parentTmdbId, seasonNumber
  title, overview, posterPath, airDate, episodeCount, status
  episodes Episode[]
}

model Episode {
  id, entryId, seasonId, tmdbId, parentTmdbId
  seasonNumber, episodeNumber, title, overview
  stillPath, airDate, runtime, watched, watchedAt
}
```

A camada de dados continua completa para evitar regressão. Apenas a renderização foi restringida.

---

## 🏆 100+ Conquistas

### Sistema Implementado

As conquistas são definidas em `src/lib/achievements.ts` e desbloqueadas pelo `AchievementEngine` integrado às ações do usuário.

```typescript
export type AchievementType =
  | 'milestone' | 'streak' | 'collection' | 'rating'
  | 'discovery' | 'social' | 'seasonal' | 'expert' | 'secret'

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: AchievementType
  xpReward: number
  requirement: (stats: UserStats) => boolean
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
}
```

Desbloqueio automático ao atingir o `requirement`. Toast de notificação via `AchievementToast.tsx`.

---

## 🌐 Página de Browser Aprimorada

A página `/browser` exibe dados por padrão (sem necessidade de busca ativa) e suporta filtros de production status via `ProductionFilterBar`.

Rota dinâmica `/browser/[filter]/page.tsx` aceita filtros pré-selecionados via URL.

---

## ✨ Features Existentes

### 1. Rastreamento de Mídia
- Adicionar, editar, deletar títulos
- Suporta séries (`TV_SEASON`) e filmes (`MOVIE`)
- Sincronização com TMDB para informações atualizadas
- Status: Watching, Completed, Paused, Dropped, Planning, Rewatching, Upcoming

### 2. Gamificação
- Sistema de XP e níveis
- Desafios diários, semanais e mensais
- Badges e conquistas (100+)
- Streak tracking
- Sistema de notificações

### 3. Metas Pessoais
- Criar metas customizadas
- Assistência de IA para sugerir metas
- Progresso em tempo real
- XP como recompensa
- Deadlines e alertas

### 4. Atividade
- Log de todas as interações
- Histórico de mudanças com agrupamento de episódios consecutivos
- Timeline de atividades

### 5. Backup & Restore
- Export completo do banco
- Import de dados
- Recuperação de dados

### 6. Sistema de Relações
- Prequelas e sequelas
- Spinoffs, adaptações, títulos relacionados
- Visível apenas em `titles/[id]`

### 7. Staff & Criadores
- Busca de atores e criadores
- Páginas de detalhe de staff
- Histórico de obras e favoritar staff

### 8. Sistema de Favoritos
- Marcar títulos como favoritos com ranking
- Marcar staff como favoritos
- Aba dedicada no profile

---

## ✅ Checklist de Implementação

### Fase 1: Sistema de Sincronização ✅ CONCLUÍDA
- [x] Instalar `node-cron` e `p-queue`
- [x] Criar `src/lib/tmdb-sync.ts`
- [x] Criar tabela `SyncLog` no banco
- [x] Implementar agendador de sincronização
- [x] Criar rota API `/api/sync`
- [x] Testes de sincronização

### Fase 2: Bolinhas de Status ✅ CONCLUÍDA + REFINADA
- [x] Criar componente `StatusBubble.tsx`
- [x] Adicionar campo `productionStatus` a `Entry`
- [x] Integrar `StatusBubble` em todos os cards
- [x] Criar migração Prisma
- [x] **Refinamento**: `Released` e `Ended` não renderizam bolinha (comportamento AniList)
- [x] **Refinamento**: `StatusDot` removido de `profile/page.tsx` — barra de cor já indica status de watch
- [ ] Validar que `StatusDot` foi removido de outros componentes de listagem onde não faz sentido

### Fase 3: Sistema de Filtragem (pendente)
- [ ] Criar `ProductionFilterBar.tsx`
- [ ] Implementar lógica de filtros em `browser-filter.ts`
- [ ] Atualizar API routes para aceitar filtros
- [ ] Integrar filtros em browser page
- [ ] Testes de filtros

### Fase 4: Sistema de Temporadas ✅ CONCLUÍDA
- [x] Revisar visibilidade de temporada e relação no frontend
- [x] Remover season pills de profile, cards e modal de título
- [x] Manter `relations` visíveis apenas em `titles/[id]`
- [x] Validar que a remoção de UI não quebrou layout nem funcionalidades
- [ ] Revisão final de `ListEditor.tsx` (Bug #3 — pendente de validação)

### Fase 5: 100+ Conquistas ✅ CONCLUÍDA
- [x] Expandir `achievements.ts` para 100+ conquistas
- [x] Criar `AchievementEngine` para checking
- [x] Integrar em todas as ações do usuário
- [x] Criar UI de visualização de conquistas
- [x] Toasts de desbloqueio

### Fase 6: Browser Aprimorado (pendente)
- [ ] Refatorar `/browser/page.tsx` para exibir dados por padrão
- [ ] Criar `/browser/[filter]/page.tsx` dinâmica
- [ ] Implementar filtros de production status
- [ ] Links entre páginas
- [ ] Testes de navegação e otimização de performance

### Fase 7: Melhorias Visuais (pendente)
- [ ] Atualizar `AiringProgressCard.tsx` com novo layout
- [ ] Atualizar `NextUpCard.tsx`
- [ ] Criar `MediaCard.module.css`
- [ ] Implementar overlay hover
- [ ] Responsividade (5 col → 4 col → 3 col → 2 col → 1 col)
- [ ] Testes em múltiplos breakpoints

### Fase 8: QA & Otimização (pendente)
- [ ] Testes integrais de todas as features
- [ ] Performance profiling
- [ ] Otimização de queries
- [ ] Cache estratégico
- [ ] Bug fixes (Bug #1 e Bug #3)
- [ ] Documentação final

---

## 📊 Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                        Cliente (React)                      │
├─────────────────────────────────────────────────────────────┤
│  page.tsx  Profile  Browser  Gamification  Staff  Titles   │
│        ↓       ↓        ↓          ↓         ↓       ↓     │
│  Components (Cards, Modals, StatusBubble, Forms, etc)      │
└───────────────────────────────────────────────────────────┬─┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                    Next.js API Routes                       │
├─────────────────────────────────────────────────────────────┤
│  /api/entries   /api/gamification   /api/sync   /api/staff │
│      ↓                 ↓                ↓            ↓     │
│   entries            XP/goals      TMDB Sync    staff data │
└────────────┬─────────────────────────────────────────────┬──┘
             ↓                                              ↓
       ┌──────────────────────────────────────────────────┐
       │           Camada de Lógica (src/lib)             │
       ├──────────────────────────────────────────────────┤
       │ tmdb-sync.ts  gamification.ts  achievements.ts   │
       │ production-status.ts  personal-goals.ts  ...     │
       └────────────────┬───────────────────────────┬─────┘
                        ↓                           ↓
       ┌──────────────────────────────────────────────────┐
       │            Prisma ORM + PostgreSQL               │
       ├──────────────────────────────────────────────────┤
       │  Entry  Profile  UserGamification  PersonalGoal  │
       │  Season  Episode  SyncLog  ActivityLog           │
       └──────────────────────────────────────────────────┘
                        ↓
       ┌──────────────────────────────────────────────────┐
       │          APIs Externas (TMDB, etc)               │
       └──────────────────────────────────────────────────┘
```

---

## 🚀 Começando

### Pré-requisitos

```bash
# Node.js 18+ / npm 9+
node -v
npm -v

# Variáveis de Ambiente
NEXT_PUBLIC_TMDB_API_KEY=your_api_key_here
DATABASE_URL=postgresql://user:password@localhost:5432/hades
```

### Setup Inicial

```bash
# 1. Instalar dependências
npm install

# 2. Configurar banco de dados
npx prisma migrate deploy

# 3. Fazer seed do banco (opcional)
npx prisma db seed

# 4. Rodar em dev
npm run dev

# 5. Abrir http://localhost:3000
```

---

## 📝 Notas Importantes

1. **Bolinhas**: `StatusBubble` é inteligente — não renderiza para `Released` e `Ended`. Apenas statuses relevantes exibem indicador visual.
2. **StatusDot**: removido dos cards de listagem/profile. Não deve ser reintroduzido. A barra de cor no topo do card indica o status de watch.
3. **Sincronização**: automática a cada 6 horas + manual on-demand via `/api/sync`.
4. **Performance**: fila de sincronização com max 5 requisições paralelas.
5. **Conquistas**: desbloqueadas automaticamente ao atingir o requirement, com toast de notificação.
6. **Temporadas**: dados completos no banco, mas renderização restrita à página `titles/[id]`.
7. **Relations**: visível apenas em `titles/[id]`, nunca em cards ou listagens.

---

**Versão:** 4.0  
**Última Atualização:** 12 de Maio de 2026  
**Status:** ✅ Fases 1, 2, 4, 5 concluídas — Fases 3, 6, 7, 8 pendentes