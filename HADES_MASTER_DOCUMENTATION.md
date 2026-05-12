# HADES — Documentação Master Completa

**Versão:** 3.0 (Mai 2026)  
**Status:** Pronto para Implementação  
**Última Atualização:** 12 de Maio de 2026

---

## 📑 Sumário Executivo

Hades é um aplicativo Next.js avançado para rastreamento de séries, filmes e gamificação pessoal com sincronização em tempo real com TMDB, sistema visual inteligente de status de produção e 100+ conquistas personalizadas.

**Pilares do Projeto:**
- ✅ Rastreamento completo de mídia (séries, filmes, documentários)
- ✅ Sistema de gamificação com XP, níveis e desafios
- ✅ Metas pessoais inteligentes com IA
- ✅ Sincronização em tempo real com TMDB
- ✅ Status visual com bolinhas de produção
- ✅ Filtros avançados por status de produção
- ✅ 100+ conquistas baseadas em comportamento do usuário
- ✅ Sistema de temporadas imbutido em todo o site
- ✅ Interface visual inspirada em AniList

---

## 🎯 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura do Projeto](#arquitetura-do-projeto)
3. [Banco de Dados](#banco-de-dados)
4. [Bugs Conhecidos](#bugs-conhecidos)
5. [Sistema Visual - Bolinhas de Status](#sistema-visual---bolinhas-de-status)
6. [Sistema de Sincronização em Tempo Real](#sistema-de-sincronização-em-tempo-real)
7. [Melhorias Visuais](#melhorias-visuais)
8. [Sistema de Filtragem Avançado](#sistema-de-filtragem-avançado)
9. [Sistema de Temporadas](#sistema-de-temporadas)
10. [100+ Conquistas](#100-conquistas)
11. [Página de Browser Aprimorada](#página-de-browser-aprimorada)
12. [Features Existentes](#features-existentes)
13. [Checklist de Implementação](#checklist-de-implementação)

---

## 📚 Visão Geral

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
5. **Status Visual**: Bolinhas indicando fase de produção
6. **Filtros Inteligentes**: Filtragem por status de produção
7. **Sistema de Temporadas**: Acompanhamento de temporadas em todo o site
8. **Sistema de Favoritos**: Marque títulos e staff como favoritos
9. **Backup/Restore**: Exporte e importe dados completos
10. **Atividade**: Log de todas as interações

---

## 🏗️ Arquitetura do Projeto

### Estrutura de Pastas

```
hades/
├── prisma/
│   ├── schema.prisma              (Modelos de dados)
│   └── migrations/                (Histórico de banco)
├── public/                         (Assets estáticos)
├── src/
│   ├── app/
│   │   ├── api/                   (Rotas backend)
│   │   │   ├── activity/          (Logs de atividade)
│   │   │   ├── gamification/      (XP, desafios, metas)
│   │   │   ├── staff/             (Dados de staff)
│   │   │   ├── entries/           (CRUD de títulos)
│   │   │   ├── backup/            (Export/import)
│   │   │   └── sync/              (Sincronização TMDB) [NOVO]
│   │   ├── page.tsx               (Home)
│   │   ├── profile/page.tsx       (Perfil do usuário)
│   │   ├── search/page.tsx        (Busca)
│   │   ├── browser/page.tsx       (Browse com filtros) [MELHORADO]
│   │   ├── gamification/page.tsx  (Painel de gamificação)
│   │   ├── staff/page.tsx         (Staff)
│   │   ├── staff/[id]/page.tsx    (Detalhes de staff)
│   │   ├── titles/[id]/page.tsx   (Detalhes de título)
│   │   ├── layout.tsx             (Layout global)
│   │   └── globals.css            (Estilos globais)
│   ├── components/
│   │   ├── AiringProgressCard.tsx (Card de em exibição)
│   │   ├── NextUpCard.tsx         (Card de próximo)
│   │   ├── StatusDot.tsx          (Bolinha de status) [NOVO]
│   │   ├── StatusBubble.tsx       (Bolinha de produção) [NOVO]
│   │   ├── SeasonSelector.tsx     (Seletor de temporadas) [NOVO]
│   │   ├── PersonalGoalsSection.tsx
│   │   ├── PersonalGoalModal.tsx
│   │   ├── ChallengeWidget.tsx
│   │   ├── NotificationPanel.tsx
│   │   ├── XPProgressBar.tsx
│   │   ├── XPToastHost.tsx
│   │   ├── AchievementToast.tsx
│   │   ├── ChallengeToast.tsx
│   │   ├── ListEditor.tsx
│   │   └── StaffComponents/
│   └── lib/
│       ├── prisma.ts              (Cliente Prisma)
│       ├── tmdb.ts                (Integração TMDB)
│       ├── tmdb-airing.ts         (Dados de exibição)
│       ├── tmdb-titles.ts         (Dados de títulos)
│       ├── tmdb-sync.ts           (Sincronização) [NOVO]
│       ├── gamification.ts        (Lógica de XP)
│       ├── personal-goals.ts      (Metas pessoais)
│       ├── achievements.ts        (100+ conquistas) [EXPANDIDO]
│       ├── production-status.ts   (Status de produção) [NOVO]
│       ├── seasons.ts             (Lógica de temporadas) [NOVO]
│       └── ...
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
├── eslint.config.mjs
└── .env
```

---

## 🗄️ Banco de Dados

### `prisma/schema.prisma` — Modelos de Dados

#### Modelos Principais

```prisma
// Usuário e Perfil
model Profile {
  id            String   @id @default(cuid())
  name          String
  avatar        String?
  banner        String?
  bio           String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

// Entrada de Mídia (Série, Filme, etc)
model Entry {
  id                  String   @id @default(cuid())
  tmdbId              Int      @unique
  type                String   // 'tv', 'movie', 'documentary'
  title               String
  slug                String   @unique
  status              String   // 'WATCHING', 'COMPLETED', 'ON_HOLD', 'DROPPED', 'PLAN_TO_WATCH'
  productionStatus    String   // 'Rumored', 'Planned', 'In Production', 'Post Production', 'Released', 'Canceled', 'Returning Series', 'Ended', 'Pilot'
  
  // Progresso de Séries
  currentSeason       Int?
  currentEpisode      Int?
  totalSeasons        Int?
  totalEpisodes       Int?
  episodeRuntime      Int?
  
  // Avaliação e Notas
  score               Int?     // 0-10
  notes               String?
  personalRating      Int?     // Rating pessoal 1-5 (stars)
  
  // Mídia
  posterPath          String?
  backdropPath        String?
  logoPath            String?
  
  // Metadados TMDB
  releaseDate         DateTime?
  firstAirDate        DateTime?
  lastAirDate         DateTime?
  overview            String?
  genres              String[] @default([])
  networks            String[] @default([])
  studios             String[] @default([])
  languages           String[] @default([])
  
  // Flags
  isFavorite          Boolean  @default(false)
  isHidden            Boolean  @default(false)
  hasNewEpisodes      Boolean  @default(false)
  
  // Timestamps
  addedAt             DateTime @default(now())
  lastUpdated         DateTime @updatedAt
  lastSyncedAt        DateTime? // Última sincronização com TMDB
  
  // Relações
  relations           Relation[]
  activities          ActivityLog[]
  goals               PersonalGoal[]
}

// Relações entre Mídia
model Relation {
  id              String @id @default(cuid())
  source          Entry  @relation("RelationSource", fields: [sourceId], references: [id])
  sourceId        String
  target          Entry  @relation("RelationTarget", fields: [targetId], references: [id])
  targetId        String
  relationType    String // 'prequel', 'sequel', 'spinoff', 'adaptation', 'based_on', 'related'
}

// Gamificação
model UserGamification {
  id            String   @id @default(cuid())
  currentXP     Int      @default(0)
  currentLevel  Int      @default(1)
  totalXPEarned Int      @default(0)
  badges        String[] @default([])
  streak        Int      @default(0)
}

// Desafios
model UserChallenge {
  id              String   @id @default(cuid())
  title           String
  description     String?
  type            String   // 'daily', 'weekly', 'monthly', 'custom'
  target          Int
  current         Int      @default(0)
  xpReward        Int      @default(0)
  badgeReward     String?
  completed       Boolean  @default(false)
  completedAt     DateTime?
  expiresAt       DateTime
  createdAt       DateTime @default(now())
}

// Metas Pessoais
model PersonalGoal {
  id            String   @id @default(cuid())
  entryId       String?
  entry         Entry?   @relation(fields: [entryId], references: [id])
  title         String
  type          String   // 'watch', 'complete', 'collect', 'custom'
  target        Int
  current       Int      @default(0)
  unit          String   // 'episodes', 'hours', 'titles', 'movies', etc
  dueDate       DateTime?
  xpReward      Int?
  isPinned      Boolean  @default(false)
  isCompleted   Boolean  @default(false)
  completedAt   DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

// Log de Atividade
model ActivityLog {
  id            String   @id @default(cuid())
  entryId       String
  entry         Entry    @relation(fields: [entryId], references: [id])
  action        String   // 'added', 'updated_status', 'updated_progress', 'marked_complete', 'rated', 'favorited'
  details       String?
  xpGained      Int?
  createdAt     DateTime @default(now())
}

// Sincronização de Dados
model SyncLog {
  id              String   @id @default(cuid())
  entryId         String
  changedFields   String[] // ['posterPath', 'title', 'releaseDate']
  syncedAt        DateTime @default(now())
  status          String   // 'success', 'partial', 'failed'
  errorMessage    String?
}
```

#### Migrações Necessárias

```
// 1. Adicionar campos de produção status
ALTER TABLE Entry ADD COLUMN productionStatus STRING DEFAULT 'Released';

// 2. Adicionar campo de sincronização
ALTER TABLE Entry ADD COLUMN lastSyncedAt TIMESTAMP;

// 3. Criar tabela SyncLog
CREATE TABLE SyncLog (
  id STRING PRIMARY KEY,
  entryId STRING NOT NULL,
  changedFields STRING[] DEFAULT array[]::text[],
  syncedAt TIMESTAMP DEFAULT now(),
  status STRING,
  errorMessage STRING
);

// 4. Adicionar campos de temporadas
ALTER TABLE Entry ADD COLUMN currentSeason INT;
ALTER TABLE Entry ADD COLUMN currentEpisode INT;
ALTER TABLE Entry ADD COLUMN totalSeasons INT;
ALTER TABLE Entry ADD COLUMN totalEpisodes INT;
ALTER TABLE Entry ADD COLUMN episodeRuntime INT;
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
- Modal de edição pode estar salvando estado incorreto

**Solução:**
```typescript
// ❌ ERRADO
export async function syncGoalProgress(goalId: string) {
  const goal = await prisma.personalGoal.findUnique({ where: { id: goalId } })
  
  // Calcular progresso real
  const realProgress = await calculateRealProgress(goal)
  
  // ❌ NÃO fazer isso:
  if (realProgress >= goal.target) {
    await markGoalComplete(goalId) // CAUSA BUG
  }
}

// ✅ CORRETO
export async function syncGoalProgress(goalId: string) {
  const goal = await prisma.personalGoal.findUnique({ where: { id: goalId } })
  
  // Calcular progresso real
  const realProgress = await calculateRealProgress(goal)
  
  // ✅ Apenas sincronizar valor, não completar
  await prisma.personalGoal.update({
    where: { id: goalId },
    data: { current: realProgress }
  })
}
```

**Testes Necessários:**
- [ ] Criar meta pessoal
- [ ] Sair da página
- [ ] Voltar ao profile
- [ ] Verificar se meta ainda está ativa (não concluída)
- [ ] Completar meta manualmente
- [ ] Verificar se marca como completada apenas ao clicar botão

---

## 🎨 Sistema Visual - Bolinhas de Status

### Production Status Bubble

Um sistema de bolinhas coloridas indicando a fase de produção de cada título, visível em **TODOS os cards** do site.

#### Status de Filmes

| Status | Cor | Hex | Descrição |
|--------|-----|-----|-----------|
| 🔴 Rumored | Vermelho | `#ef4444` | Rumor de produção |
| 🟠 Planned | Laranja | `#f97316` | Planejado |
| 🟡 In Production | Amarelo | `#eab308` | Em produção |
| 🟣 Post Production | Roxo | `#a855f7` | Pós-produção |
| 🟢 Released | Verde | `#22c55e` | Lançado |
| ⚫ Canceled | Cinza/Preto | `#6b7280` | Cancelado |

#### Status de Séries

| Status | Cor | Hex | Descrição |
|--------|-----|-----|-----------|
| 🔴 Planned | Vermelho | `#ef4444` | Planejada |
| 🟠 In Production | Laranja | `#f97316` | Em produção |
| 🟢 Returning Series | Verde | `#22c55e` | Retornando |
| 🔵 Pilot | Azul | `#3b82f6` | Piloto |
| ⚫ Ended | Cinza | `#6b7280` | Finalizada |
| ⚫ Canceled | Preto | `#000000` | Cancelada |

### Componente StatusBubble

```typescript
// src/components/StatusBubble.tsx

type MediaType = 'movie' | 'tv'
type ProductionStatus = 
  | 'Rumored' | 'Planned' | 'In Production' | 'Post Production' | 'Released' | 'Canceled'
  | 'Returning Series' | 'Ended' | 'Pilot'

const PRODUCTION_COLORS: Record<ProductionStatus, string> = {
  // Filmes
  'Rumored': '#ef4444',
  'Planned': '#f97316',
  'In Production': '#eab308',
  'Post Production': '#a855f7',
  'Released': '#22c55e',
  'Canceled': '#6b7280',
  
  // Séries
  'Returning Series': '#22c55e',
  'Ended': '#6b7280',
  'Pilot': '#3b82f6',
}

interface StatusBubbleProps {
  status: ProductionStatus
  mediaType: MediaType
  size?: 'sm' | 'md' | 'lg'
}

export function StatusBubble({ status, mediaType, size = 'sm' }: StatusBubbleProps) {
  const color = PRODUCTION_COLORS[status]
  
  const sizeMap = {
    sm: { width: '8px', height: '8px', top: '4px', left: '4px' },
    md: { width: '12px', height: '12px', top: '6px', left: '6px' },
    lg: { width: '16px', height: '16px', top: '8px', left: '8px' },
  }
  
  const dimensions = sizeMap[size]
  
  return (
    <span
      style={{
        position: 'absolute',
        top: dimensions.top,
        left: dimensions.left,
        width: dimensions.width,
        height: dimensions.height,
        borderRadius: '50%',
        backgroundColor: color,
        border: '1px solid rgba(255,255,255,0.3)',
        zIndex: 10,
        boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
        pointerEvents: 'none',
      }}
      title={status}
    />
  )
}
```

### Integração em Cards

```typescript
// src/components/AiringProgressCard.tsx

export function AiringProgressCard({ entry }: Props) {
  return (
    <div className="card-wrapper">
      <div className="card-poster" style={{ position: 'relative' }}>
        <StatusBubble 
          status={entry.productionStatus}
          mediaType={entry.type === 'tv' ? 'tv' : 'movie'}
          size="md"
        />
        
        <img src={entry.posterPath} alt={entry.title} />
        
        {/* Overlay no hover */}
        <div className="card-overlay">
          {/* Conteúdo */}
        </div>
      </div>
      
      <div className="card-info">
        <p className="ep-label">Ep {entry.currentEpisode}</p>
        <p className="time-label">{formatTimeUntilNext(entry)}</p>
      </div>
    </div>
  )
}
```

---

## ⚡ Sistema de Sincronização em Tempo Real

### Visão Geral

Sincronização automática de dados com TMDB sem interferir na experiência do usuário, utilizando pacotes gratuitos.

### Tecnologias

```json
{
  "dependencies": {
    "node-cron": "^3.0.0",
    "p-queue": "^4.3.2",
    "isomorphic-fetch": "^3.0.0"
  }
}
```

### Estratégia de Sincronização

**Tipo 1: Sincronização Periódica (Background)**
- Executada a cada 6 horas
- Atualiza todos os títulos cadastrados
- Processa em fila com limite de 5 requisições paralelas
- Não bloqueia a interface

**Tipo 2: Sincronização on-demand**
- Usuário clica em "atualizar" manualmente
- Sincroniza single title com TMDB
- Resultado retorna em tempo real via API

**Tipo 3: Sincronização ao adicionar título**
- Quando usuário adiciona novo título
- Busca dados iniciais completos do TMDB
- Salva com `lastSyncedAt`

### Implementação

```typescript
// src/lib/tmdb-sync.ts

import cron from 'node-cron'
import PQueue from 'p-queue'
import { prisma } from './prisma'
import { fetchTMDBData } from './tmdb'

const syncQueue = new PQueue({ concurrency: 5 })

interface TMDBChanges {
  title?: string
  overview?: string
  posterPath?: string
  backdropPath?: string
  releaseDate?: Date
  firstAirDate?: Date
  lastAirDate?: Date
  genres?: string[]
  networks?: string[]
  productionStatus?: string
  currentSeason?: number
  totalSeasons?: number
  totalEpisodes?: number
  status?: string
}

export async function syncEntryWithTMDB(entryId: string): Promise<{
  success: boolean
  changedFields: string[]
  error?: string
}> {
  try {
    const entry = await prisma.entry.findUnique({ where: { id: entryId } })
    if (!entry) throw new Error('Entry not found')
    
    // Buscar dados atualizados do TMDB
    const tmdbData = await fetchTMDBData(entry.tmdbId, entry.type)
    
    // Comparar e identificar mudanças
    const changes: TMDBChanges = {}
    const changedFields: string[] = []
    
    if (tmdbData.title !== entry.title) {
      changes.title = tmdbData.title
      changedFields.push('title')
    }
    
    if (tmdbData.posterPath !== entry.posterPath) {
      changes.posterPath = tmdbData.posterPath
      changedFields.push('posterPath')
    }
    
    if (tmdbData.productionStatus !== entry.productionStatus) {
      changes.productionStatus = tmdbData.productionStatus
      changedFields.push('productionStatus')
    }
    
    if (entry.type === 'tv') {
      if (tmdbData.currentSeason !== entry.currentSeason) {
        changes.currentSeason = tmdbData.currentSeason
        changedFields.push('currentSeason')
      }
      if (tmdbData.totalEpisodes !== entry.totalEpisodes) {
        changes.totalEpisodes = tmdbData.totalEpisodes
        changedFields.push('totalEpisodes')
      }
    }
    
    // Se houver mudanças, atualizar
    if (changedFields.length > 0) {
      await prisma.entry.update({
        where: { id: entryId },
        data: {
          ...changes,
          lastSyncedAt: new Date(),
        }
      })
      
      // Log de sincronização
      await prisma.syncLog.create({
        data: {
          entryId,
          changedFields,
          status: 'success',
        }
      })
    } else {
      // Nenhuma mudança, apenas atualizar timestamp
      await prisma.entry.update({
        where: { id: entryId },
        data: { lastSyncedAt: new Date() }
      })
    }
    
    return { success: true, changedFields }
  } catch (error) {
    await prisma.syncLog.create({
      data: {
        entryId,
        status: 'failed',
        errorMessage: error.message,
      }
    })
    
    return { success: false, changedFields: [], error: error.message }
  }
}

// Sincronização em lote (background)
export async function syncAllEntries(): Promise<void> {
  try {
    const entries = await prisma.entry.findMany({
      select: { id: true, lastSyncedAt: true }
    })
    
    // Sincronizar todos os títulos em fila
    for (const entry of entries) {
      syncQueue.add(() => syncEntryWithTMDB(entry.id))
    }
    
    // Aguardar conclusão
    await syncQueue.onIdle()
    
    console.log(`✅ Sincronização de ${entries.length} títulos concluída`)
  } catch (error) {
    console.error('❌ Erro na sincronização em lote:', error)
  }
}

// Agendador cron (executa a cada 6 horas)
export function initSyncScheduler(): void {
  // Sincronizar a cada 6 horas: 0, 6, 12, 18
  cron.schedule('0 */6 * * *', async () => {
    console.log('🔄 Iniciando sincronização automática com TMDB...')
    await syncAllEntries()
  })
  
  console.log('📅 Agendador de sincronização ativado')
}

// Sincronização ao adicionar título
export async function addEntryWithSync(tmdbId: number, type: 'tv' | 'movie'): Promise<string> {
  // 1. Buscar dados do TMDB
  const tmdbData = await fetchTMDBData(tmdbId, type)
  
  // 2. Criar entry
  const entry = await prisma.entry.create({
    data: {
      tmdbId,
      type,
      title: tmdbData.title,
      slug: generateSlug(tmdbData.title),
      posterPath: tmdbData.posterPath,
      backdropPath: tmdbData.backdropPath,
      productionStatus: tmdbData.productionStatus,
      genres: tmdbData.genres,
      overview: tmdbData.overview,
      status: 'PLAN_TO_WATCH',
      lastSyncedAt: new Date(),
      // ... outros campos
    }
  })
  
  return entry.id
}
```

### API Route de Sincronização Manual

```typescript
// src/app/api/sync/manual/route.ts

import { syncEntryWithTMDB } from '@/lib/tmdb-sync'

export async function POST(request: Request) {
  try {
    const { entryId } = await request.json()
    
    const result = await syncEntryWithTMDB(entryId)
    
    return Response.json(result)
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
```

### Inicialização no App

```typescript
// src/app/layout.tsx

import { initSyncScheduler } from '@/lib/tmdb-sync'

// Inicializar agendador (apenas servidor)
if (typeof window === 'undefined') {
  initSyncScheduler()
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // ...
}
```

---

## 🎨 Melhorias Visuais

### Cards de Mídia — Grid Responsivo

#### Layout Desktop-First (5 Colunas)

```css
.media-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  padding: 24px;
}

@media (max-width: 1400px) {
  .media-grid { grid-template-columns: repeat(4, 1fr); }
}

@media (max-width: 1024px) {
  .media-grid { grid-template-columns: repeat(3, 1fr); }
}

@media (max-width: 768px) {
  .media-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 480px) {
  .media-grid { grid-template-columns: 1fr; }
}
```

#### Card Individual

```typescript
// src/components/MediaCard.tsx

interface MediaCardProps {
  entry: Entry
  showStatus?: boolean
  onHover?: () => void
}

export function MediaCard({ entry, showStatus = true }: MediaCardProps) {
  const [showOverlay, setShowOverlay] = useState(false)
  
  return (
    <div 
      className="card-wrapper"
      onMouseEnter={() => setShowOverlay(true)}
      onMouseLeave={() => setShowOverlay(false)}
    >
      {/* Poster */}
      <div className="card-poster" style={{ position: 'relative' }}>
        {/* Production Status Bubble */}
        {showStatus && (
          <StatusBubble 
            status={entry.productionStatus}
            mediaType={entry.type === 'tv' ? 'tv' : 'movie'}
          />
        )}
        
        {/* Watch Status Dot */}
        {entry.status === 'WATCHING' && (
          <StatusDot status="watching" />
        )}
        {entry.status === 'PLAN_TO_WATCH' && (
          <StatusDot status="upcoming" />
        )}
        
        <img 
          src={entry.posterPath} 
          alt={entry.title}
          className="card-poster-image"
        />
        
        {/* Overlay no Hover */}
        {showOverlay && (
          <div className="card-overlay">
            <div className="overlay-thumbnail">
              <img src={entry.posterPath} alt={entry.title} />
            </div>
            
            <p className="overlay-status">
              {entry.type === 'tv' && entry.currentEpisode 
                ? `Ep ${entry.currentEpisode}`
                : 'Ready to Watch'}
            </p>
            
            <h3 className="overlay-title">{entry.title}</h3>
            
            <div className="overlay-progress-bar">
              <div 
                className="progress-fill"
                style={{
                  width: `${(entry.currentEpisode / entry.totalEpisodes) * 100}%`
                }}
              />
            </div>
            
            <p className="overlay-progress-text">
              Progress: {entry.currentEpisode}/{entry.totalEpisodes}
            </p>
          </div>
        )}
      </div>
      
      {/* Info Abaixo do Poster */}
      <div className="card-info">
        <p className="card-title">{entry.title}</p>
        {entry.type === 'tv' && entry.totalEpisodes && (
          <p className="card-progress">
            Ep {entry.currentEpisode}/{entry.totalEpisodes}
          </p>
        )}
        {entry.score && (
          <p className="card-score">⭐ {entry.score}/10</p>
        )}
      </div>
    </div>
  )
}
```

#### CSS Módulo

```css
/* src/components/MediaCard.module.css */

.card_wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card_poster {
  position: relative;
  aspect-ratio: 2 / 3;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  background: #1a1a1a;
}

.card_poster_image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.3s ease;
}

.card_poster:hover .card_poster_image {
  transform: scale(1.05);
}

.card_overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 12px;
  gap: 6px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.card_poster:hover .card_overlay {
  opacity: 1;
}

.overlay_thumbnail {
  width: 40px;
  height: 55px;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 4px;
}

.overlay_thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.overlay_status {
  font-size: 12px;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
}

.overlay_title {
  font-size: 13px;
  color: #ffffff;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.overlay_progress_bar {
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.2);
  overflow: hidden;
}

.progress_fill {
  height: 100%;
  background: #22c55e;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.overlay_progress_text {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
}

.card_info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card_title {
  font-size: 12px;
  color: #c9d1d9;
  font-weight: 500;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card_progress {
  font-size: 11px;
  color: #8b949e;
  margin: 0;
}

.card_score {
  font-size: 11px;
  color: #ffd700;
  margin: 0;
}
```

---

## 🔍 Sistema de Filtragem Avançado

### Filtros por Status de Produção

O novo sistema de filtros segue exatamente os statuses do TMDB:

#### Filtros para Filmes

```typescript
type MovieProductionFilter = 
  | 'All'
  | 'Rumored'
  | 'Planned'
  | 'In Production'
  | 'Post Production'
  | 'Released'
  | 'Canceled'
```

#### Filtros para Séries

```typescript
type SeriesProductionFilter =
  | 'All'
  | 'Returning Series'
  | 'Planned'
  | 'In Production'
  | 'Ended'
  | 'Canceled'
  | 'Pilot'
```

### Componente de Filtros

```typescript
// src/components/ProductionFilterBar.tsx

interface FilterBarProps {
  mediaType: 'movie' | 'tv'
  selectedFilters: string[]
  onFilterChange: (filters: string[]) => void
}

const MOVIE_FILTERS = [
  'All', 'Rumored', 'Planned', 'In Production', 
  'Post Production', 'Released', 'Canceled'
]

const TV_FILTERS = [
  'All', 'Returning Series', 'Planned', 'In Production',
  'Ended', 'Canceled', 'Pilot'
]

export function ProductionFilterBar({ 
  mediaType, 
  selectedFilters, 
  onFilterChange 
}: FilterBarProps) {
  const filters = mediaType === 'movie' ? MOVIE_FILTERS : TV_FILTERS
  
  const toggleFilter = (filter: string) => {
    if (filter === 'All') {
      onFilterChange(['All'])
    } else {
      const newFilters = selectedFilters.includes(filter)
        ? selectedFilters.filter(f => f !== filter)
        : [...selectedFilters.filter(f => f !== 'All'), filter]
      
      onFilterChange(newFilters.length === 0 ? ['All'] : newFilters)
    }
  }
  
  return (
    <div className="filter-bar">
      {filters.map(filter => (
        <button
          key={filter}
          className={`filter-button ${
            selectedFilters.includes(filter) ? 'active' : ''
          }`}
          onClick={() => toggleFilter(filter)}
        >
          <StatusBubble 
            status={filter as any}
            mediaType={mediaType}
            size="sm"
          />
          <span>{filter}</span>
        </button>
      ))}
    </div>
  )
}
```

### Lógica de Filtragem

```typescript
// src/lib/filter-engine.ts

export async function filterEntriesByProduction(
  entries: Entry[],
  mediaType: 'movie' | 'tv',
  statuses: string[]
): Promise<Entry[]> {
  if (statuses.includes('All') || statuses.length === 0) {
    return entries.filter(e => e.type === (mediaType === 'movie' ? 'movie' : 'tv'))
  }
  
  return entries.filter(
    e => e.type === (mediaType === 'movie' ? 'movie' : 'tv') &&
         statuses.includes(e.productionStatus)
  )
}

// Usar em API routes e páginas
export async function getFilteredEntries(
  mediaType: 'movie' | 'tv',
  statuses?: string[]
) {
  const entries = await prisma.entry.findMany({
    where: {
      type: mediaType === 'movie' ? 'movie' : 'tv',
      ...(statuses && statuses.length > 0 && statuses[0] !== 'All'
        ? { productionStatus: { in: statuses } }
        : {})
    }
  })
  
  return entries
}
```

---

## 📺 Sistema de Temporadas

### Modelo de Dados Expandido

```prisma
model Season {
  id              String   @id @default(cuid())
  entryId         String
  entry           Entry    @relation(fields: [entryId], references: [id])
  seasonNumber    Int
  episodeCount    Int
  airDate         DateTime?
  overview        String?
  posterPath      String?
  
  episodes        Episode[]
}

model Episode {
  id              String   @id @default(cuid())
  seasonId        String
  season          Season   @relation(fields: [seasonId], references: [id])
  episodeNumber   Int
  title           String
  overview        String?
  airDate         DateTime?
  runtime         Int?
  stillPath       String?
  watched         Boolean  @default(false)
}
```

### Componente de Seletor de Temporadas

```typescript
// src/components/SeasonSelector.tsx

interface SeasonSelectorProps {
  entry: Entry & { seasons: Season[] }
  selectedSeason: number
  onSeasonChange: (seasonNumber: number) => void
}

export function SeasonSelector({
  entry,
  selectedSeason,
  onSeasonChange
}: SeasonSelectorProps) {
  return (
    <div className="season-selector">
      <label>Temporada:</label>
      
      <select
        value={selectedSeason}
        onChange={(e) => onSeasonChange(parseInt(e.target.value))}
      >
        {entry.seasons.map(season => (
          <option key={season.id} value={season.seasonNumber}>
            Temporada {season.seasonNumber}
            {season.overview && ` - ${season.overview.substring(0, 50)}...`}
          </option>
        ))}
      </select>
      
      <div className="season-info">
        <p>{entry.seasons.find(s => s.seasonNumber === selectedSeason)?.episodeCount} episódios</p>
      </div>
    </div>
  )
}
```

### Grade de Episódios

```typescript
// src/components/EpisodeGrid.tsx

interface EpisodeGridProps {
  episodes: Episode[]
  onEpisodeClick: (episode: Episode) => void
}

export function EpisodeGrid({ episodes, onEpisodeClick }: EpisodeGridProps) {
  return (
    <div className="episode-grid">
      {episodes.map(episode => (
        <div
          key={episode.id}
          className={`episode-card ${episode.watched ? 'watched' : ''}`}
          onClick={() => onEpisodeClick(episode)}
        >
          {episode.stillPath ? (
            <img src={episode.stillPath} alt={episode.title} />
          ) : (
            <div className="episode-placeholder">
              <p>Ep {episode.episodeNumber}</p>
            </div>
          )}
          
          <div className="episode-info">
            <h4>Ep {episode.episodeNumber}: {episode.title}</h4>
            {episode.airDate && (
              <p className="air-date">{formatDate(episode.airDate)}</p>
            )}
          </div>
          
          {episode.watched && <div className="watched-badge">✓</div>}
        </div>
      ))}
    </div>
  )
}
```

### Integração em Páginas Principais

```typescript
// Incluir em: page.tsx, profile/page.tsx, browser/page.tsx, titles/[id]/page.tsx

import { SeasonSelector } from '@/components/SeasonSelector'
import { EpisodeGrid } from '@/components/EpisodeGrid'

export default function MyMediaPage() {
  const [selectedSeason, setSelectedSeason] = useState(1)
  
  const currentSeason = entry.seasons.find(s => s.seasonNumber === selectedSeason)
  const episodes = currentSeason?.episodes || []
  
  return (
    <div>
      {/* ... outros conteúdos */}
      
      <div className="seasons-section">
        <SeasonSelector 
          entry={entry}
          selectedSeason={selectedSeason}
          onSeasonChange={setSelectedSeason}
        />
        
        <EpisodeGrid 
          episodes={episodes}
          onEpisodeClick={handleEpisodeClick}
        />
      </div>
    </div>
  )
}
```

---

## 🏆 100+ Conquistas

### Sistema de Conquistas Expandido

As conquistas são baseadas em ações do usuário em todo o site e fornecem XP, badges e reconhecimento.

```typescript
// src/lib/achievements.ts

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

const ACHIEVEMENTS: Achievement[] = [
  // ========== MILESTONE ACHIEVEMENTS ==========
  {
    id: 'first-entry',
    name: '🎬 Início da Jornada',
    description: 'Adicione seu primeiro título à lista',
    icon: '🎬',
    category: 'milestone',
    xpReward: 10,
    requirement: (stats) => stats.totalEntries >= 1,
    rarity: 'common',
  },
  {
    id: 'ten-entries',
    name: '📺 Cineasta',
    description: 'Adicione 10 títulos à lista',
    icon: '📺',
    category: 'milestone',
    xpReward: 50,
    requirement: (stats) => stats.totalEntries >= 10,
    rarity: 'uncommon',
  },
  {
    id: 'fifty-entries',
    name: '🎞️ Crítico de Cinema',
    description: 'Rastreie 50 títulos diferentes',
    icon: '🎞️',
    category: 'milestone',
    xpReward: 150,
    requirement: (stats) => stats.totalEntries >= 50,
    rarity: 'rare',
  },
  {
    id: 'hundred-entries',
    name: '🎥 Historiador da Mídia',
    description: 'Rastreie 100 títulos diferentes',
    icon: '🎥',
    category: 'milestone',
    xpReward: 300,
    requirement: (stats) => stats.totalEntries >= 100,
    rarity: 'epic',
  },
  
  // ========== STREAK ACHIEVEMENTS ==========
  {
    id: 'week-streak',
    name: '🔥 Semana Quente',
    description: 'Mantenha uma streak de 7 dias',
    icon: '🔥',
    category: 'streak',
    xpReward: 75,
    requirement: (stats) => stats.currentStreak >= 7,
    rarity: 'uncommon',
  },
  {
    id: 'month-streak',
    name: '🌟 Um Mês de Fogo',
    description: 'Mantenha uma streak de 30 dias',
    icon: '🌟',
    category: 'streak',
    xpReward: 250,
    requirement: (stats) => stats.currentStreak >= 30,
    rarity: 'rare',
  },
  {
    id: 'year-streak',
    name: '👑 Lendário',
    description: 'Mantenha uma streak de 365 dias',
    icon: '👑',
    category: 'streak',
    xpReward: 1000,
    requirement: (stats) => stats.currentStreak >= 365,
    rarity: 'legendary',
  },
  
  // ========== COLLECTION ACHIEVEMENTS ==========
  {
    id: 'anime-collector',
    name: '🍣 Colecionador de Anime',
    description: 'Adicione 20 animes à sua lista',
    icon: '🍣',
    category: 'collection',
    xpReward: 100,
    requirement: (stats) => stats.animeCount >= 20,
    rarity: 'uncommon',
  },
  {
    id: 'all-genres',
    name: '🎭 Cinéfilo Universal',
    description: 'Assista títulos de todos os 10 gêneros principais',
    icon: '🎭',
    category: 'collection',
    xpReward: 200,
    requirement: (stats) => stats.uniqueGenres >= 10,
    rarity: 'epic',
  },
  {
    id: 'country-explorer',
    name: '🌍 Explorador Global',
    description: 'Assista títulos de 15 países diferentes',
    icon: '🌍',
    category: 'collection',
    xpReward: 150,
    requirement: (stats) => stats.countriesWatched >= 15,
    rarity: 'rare',
  },
  {
    id: 'complete-series',
    name: '✅ Série Completa',
    description: 'Complete uma série inteira (todas as temporadas)',
    icon: '✅',
    category: 'collection',
    xpReward: 80,
    requirement: (stats) => stats.completedSeries >= 1,
    rarity: 'uncommon',
  },
  {
    id: 'trilogy-watcher',
    name: '🎬 Trilogia Master',
    description: 'Assista uma trilogia completa',
    icon: '🎬',
    category: 'collection',
    xpReward: 90,
    requirement: (stats) => stats.trilogiesCompleted >= 1,
    rarity: 'uncommon',
  },
  {
    id: 'prequel-sequelmaster',
    name: '🔗 Mestre de Relações',
    description: 'Assista prequela e sequela de 5 títulos',
    icon: '🔗',
    category: 'collection',
    xpReward: 120,
    requirement: (stats) => stats.relatedTitlesWatched >= 5,
    rarity: 'rare',
  },
  
  // ========== RATING ACHIEVEMENTS ==========
  {
    id: 'first-review',
    name: '📝 Crítico Amador',
    description: 'Escreva sua primeira resenha',
    icon: '📝',
    category: 'rating',
    xpReward: 15,
    requirement: (stats) => stats.reviewsWritten >= 1,
    rarity: 'common',
  },
  {
    id: 'ten-reviews',
    name: '📚 Crítico Profissional',
    description: 'Escreva 10 resenhas',
    icon: '📚',
    category: 'rating',
    xpReward: 100,
    requirement: (stats) => stats.reviewsWritten >= 10,
    rarity: 'uncommon',
  },
  {
    id: 'perfect-score',
    name: '⭐ Favorito Perfeito',
    description: 'Dê nota 10 para um título',
    icon: '⭐',
    category: 'rating',
    xpReward: 50,
    requirement: (stats) => stats.perfectScores >= 1,
    rarity: 'rare',
  },
  {
    id: 'critical-taste',
    name: '🎯 Paladar Crítico',
    description: 'Dê nota 1 a algum título',
    icon: '🎯',
    category: 'rating',
    xpReward: 30,
    requirement: (stats) => stats.lowScores >= 1,
    rarity: 'uncommon',
  },
  
  // ========== DISCOVERY ACHIEVEMENTS ==========
  {
    id: 'hidden-gem',
    name: '💎 Joia Escondida',
    description: 'Descubra um título com menos de 100 visualizações',
    icon: '💎',
    category: 'discovery',
    xpReward: 75,
    requirement: (stats) => stats.obscureTitlesFound >= 1,
    rarity: 'rare',
  },
  {
    id: 'trend-surfer',
    name: '📈 Surfista de Tendências',
    description: 'Assista um título antes de virar tendência',
    icon: '📈',
    category: 'discovery',
    xpReward: 100,
    requirement: (stats) => stats.trendingTitlesBeforeBoom >= 3,
    rarity: 'rare',
  },
  {
    id: 'imdb-explorer',
    name: '🔍 Explorador Ousado',
    description: 'Assista um título com menos de 5.0 de IMDB',
    icon: '🔍',
    category: 'discovery',
    xpReward: 40,
    requirement: (stats) => stats.lowRatedTitles >= 1,
    rarity: 'uncommon',
  },
  
  // ========== SEASONAL ACHIEVEMENTS ==========
  {
    id: 'spring-watcher',
    name: '🌸 Primavera Animada',
    description: 'Assista 5 títulos lançados na primavera',
    icon: '🌸',
    category: 'seasonal',
    xpReward: 60,
    requirement: (stats) => stats.springTitles >= 5,
    rarity: 'uncommon',
  },
  {
    id: 'summer-marathon',
    name: '☀️ Maratona de Verão',
    description: 'Assista 10 títulos durante o verão',
    icon: '☀️',
    category: 'seasonal',
    xpReward: 100,
    requirement: (stats) => stats.summerTitles >= 10,
    rarity: 'uncommon',
  },
  {
    id: 'fall-classic',
    name: '🍂 Clássico do Outono',
    description: 'Assista um clássico do cinema (lançado antes de 1990)',
    icon: '🍂',
    category: 'seasonal',
    xpReward: 80,
    requirement: (stats) => stats.classicTitles >= 1,
    rarity: 'uncommon',
  },
  {
    id: 'winter-holiday',
    name: '❄️ Festas de Inverno',
    description: 'Assista 5 filmes de férias/natalino',
    icon: '❄️',
    category: 'seasonal',
    xpReward: 70,
    requirement: (stats) => stats.holidayTitles >= 5,
    rarity: 'uncommon',
  },
  
  // ========== EXPERT ACHIEVEMENTS ==========
  {
    id: 'level-10',
    name: '🚀 Nível 10',
    description: 'Atinja nível 10 no sistema de gamificação',
    icon: '🚀',
    category: 'expert',
    xpReward: 500,
    requirement: (stats) => stats.currentLevel >= 10,
    rarity: 'epic',
  },
  {
    id: 'level-20',
    name: '👾 Nível 20 - Mestre',
    description: 'Atinja nível 20 - você é um mestre!',
    icon: '👾',
    category: 'expert',
    xpReward: 1000,
    requirement: (stats) => stats.currentLevel >= 20,
    rarity: 'legendary',
  },
  {
    id: 'challenge-master',
    name: '🎯 Mestre de Desafios',
    description: 'Complete 50 desafios',
    icon: '🎯',
    category: 'expert',
    xpReward: 300,
    requirement: (stats) => stats.challengesCompleted >= 50,
    rarity: 'epic',
  },
  {
    id: 'goal-crusher',
    name: '💪 Destruidor de Metas',
    description: 'Complete 20 metas pessoais',
    icon: '💪',
    category: 'expert',
    xpReward: 250,
    requirement: (stats) => stats.goalsCompleted >= 20,
    rarity: 'rare',
  },
  {
    id: 'xp-millionaire',
    name: '💰 Milionário de XP',
    description: 'Ganhe 1,000,000 de XP total',
    icon: '💰',
    category: 'expert',
    xpReward: 2000,
    requirement: (stats) => stats.totalXpEarned >= 1000000,
    rarity: 'legendary',
  },
  
  // ========== SECRET ACHIEVEMENTS ==========
  {
    id: 'easter-egg-1',
    name: '🥚 Ovo de Páscoa #1',
    description: 'Encontre um segredo especial...',
    icon: '🥚',
    category: 'secret',
    xpReward: 150,
    requirement: (stats) => stats.secretsFound >= 1,
    rarity: 'epic',
  },
  {
    id: 'midnight-watcher',
    name: '🌙 Vigilante Noturno',
    description: 'Use o app entre 00:00 e 04:00 por 10 vezes',
    icon: '🌙',
    category: 'secret',
    xpReward: 100,
    requirement: (stats) => stats.midnightSessions >= 10,
    rarity: 'rare',
  },
  {
    id: 'lucky-day',
    name: '🍀 Dia de Sorte',
    description: 'Complete um desafio em 13º dia do mês',
    icon: '🍀',
    category: 'secret',
    xpReward: 50,
    requirement: (stats) => stats.luckyDayChallenges >= 1,
    rarity: 'uncommon',
  },
]

// Total: 40 conquistas base - será expandido para 100+
```

### Implementação de Desbloqueio

```typescript
// src/lib/achievement-engine.ts

export async function checkAndUnlockAchievements(userId: string): Promise<string[]> {
  const userStats = await getUserStats(userId)
  const unlockedAchievements: string[] = []
  
  for (const achievement of ACHIEVEMENTS) {
    const hasRequirement = achievement.requirement(userStats)
    const alreadyUnlocked = await isAchievementUnlocked(userId, achievement.id)
    
    if (hasRequirement && !alreadyUnlocked) {
      // Unlock achievement
      await prisma.userAchievement.create({
        data: {
          userId,
          achievementId: achievement.id,
          unlockedAt: new Date(),
        }
      })
      
      // Award XP
      await awardXP(userId, achievement.xpReward, `Conquista: ${achievement.name}`)
      
      unlockedAchievements.push(achievement.id)
    }
  }
  
  return unlockedAchievements
}

// Verificar ao executar ações
export async function onUserAction(userId: string, action: 'entry_added' | 'challenge_completed' | 'goal_completed') {
  const newAchievements = await checkAndUnlockAchievements(userId)
  
  if (newAchievements.length > 0) {
    // Notificar usuário
    for (const achievementId of newAchievements) {
      const achievement = ACHIEVEMENTS.find(a => a.id === achievementId)!
      await triggerAchievementNotification(userId, achievement)
    }
  }
}
```

---

## 🌐 Página de Browser Aprimorada

### Visão Geral

A página de browser agora exibe **séries e filmes visíveis por padrão**, com clique redirecionando para página filtrada.

### Novo Fluxo

```
[Browser Page]
    ↓
[Trending Movies] ← Grid 5 col, visível por padrão
    ↓
[Popular Movies] ← Grid 5 col, visível por padrão
    ↓
[Trending Series] ← Grid 5 col, visível por padrão
    ↓
[Upcoming Movies] ← Grid 5 col, visível por padrão
    ↓
[Popular Series] ← Grid 5 col, visível por padrão

[Click on any card]
    ↓
[Filtered Results Page: /browser/[filter]?status=...]
    ↓
[Full list with filters applied]
```

### Componente Principal

```typescript
// src/app/browser/page.tsx

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MediaCard } from '@/components/MediaCard'
import { ProductionFilterBar } from '@/components/ProductionFilterBar'
import { fetchTrendingMovies, fetchPopularMovies, fetchTrendingTV } from '@/lib/tmdb'

export default function BrowserPage() {
  const [trendingMovies, setTrendingMovies] = useState([])
  const [popularMovies, setPopularMovies] = useState([])
  const [trendingTV, setTrendingTV] = useState([])
  const [upcomingMovies, setUpcomingMovies] = useState([])
  const [popularTV, setPopularTV] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const [trending, popular, trendingTv, upcoming, popularTv] = await Promise.all([
          fetchTrendingMovies(),
          fetchPopularMovies(),
          fetchTrendingTV(),
          fetchUpcomingMovies(),
          fetchPopularTV(),
        ])
        
        setTrendingMovies(trending)
        setPopularMovies(popular)
        setTrendingTV(trendingTv)
        setUpcomingMovies(upcoming)
        setPopularTV(popularTv)
      } catch (error) {
        console.error('Erro ao carregar dados do browser:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [])

  if (loading) {
    return <div className="loader">Carregando...</div>
  }

  return (
    <div className="browser-page">
      <header className="browser-header">
        <h1>Explorar Conteúdo</h1>
        <p>Navegue por filmes e séries em tendência</p>
      </header>

      {/* Seção: Filmes em Tendência */}
      <section className="browser-section">
        <div className="section-header">
          <h2>🔥 Filmes em Tendência</h2>
          <Link href="/browser/trending-movies?type=movie" className="view-all">
            Ver Todos →
          </Link>
        </div>
        <div className="media-grid">
          {trendingMovies.slice(0, 10).map(movie => (
            <Link 
              key={movie.id}
              href={`/browser/trending-movies?type=movie&filter=all`}
            >
              <MediaCard entry={movie} showStatus />
            </Link>
          ))}
        </div>
      </section>

      {/* Seção: Filmes Populares */}
      <section className="browser-section">
        <div className="section-header">
          <h2>⭐ Filmes Populares</h2>
          <Link href="/browser/popular-movies?type=movie" className="view-all">
            Ver Todos →
          </Link>
        </div>
        <div className="media-grid">
          {popularMovies.slice(0, 10).map(movie => (
            <Link 
              key={movie.id}
              href={`/browser/popular-movies?type=movie&filter=all`}
            >
              <MediaCard entry={movie} showStatus />
            </Link>
          ))}
        </div>
      </section>

      {/* Seção: Séries em Tendência */}
      <section className="browser-section">
        <div className="section-header">
          <h2>📺 Séries em Tendência</h2>
          <Link href="/browser/trending-tv?type=tv" className="view-all">
            Ver Todas →
          </Link>
        </div>
        <div className="media-grid">
          {trendingTV.slice(0, 10).map(series => (
            <Link 
              key={series.id}
              href={`/browser/trending-tv?type=tv&filter=all`}
            >
              <MediaCard entry={series} showStatus />
            </Link>
          ))}
        </div>
      </section>

      {/* Seção: Filmes Próximos */}
      <section className="browser-section">
        <div className="section-header">
          <h2>🗓️ Filmes em Breve</h2>
          <Link href="/browser/upcoming-movies?type=movie" className="view-all">
            Ver Todos →
          </Link>
        </div>
        <div className="media-grid">
          {upcomingMovies.slice(0, 10).map(movie => (
            <Link 
              key={movie.id}
              href={`/browser/upcoming-movies?type=movie&filter=In%20Production,Post%20Production`}
            >
              <MediaCard entry={movie} showStatus />
            </Link>
          ))}
        </div>
      </section>

      {/* Seção: Séries Populares */}
      <section className="browser-section">
        <div className="section-header">
          <h2>📻 Séries Populares</h2>
          <Link href="/browser/popular-tv?type=tv" className="view-all">
            Ver Todas →
          </Link>
        </div>
        <div className="media-grid">
          {popularTV.slice(0, 10).map(series => (
            <Link 
              key={series.id}
              href={`/browser/popular-tv?type=tv&filter=all`}
            >
              <MediaCard entry={series} showStatus />
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
```

### Página Filtrada Dinâmica

```typescript
// src/app/browser/[filter]/page.tsx

'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { MediaCard } from '@/components/MediaCard'
import { ProductionFilterBar } from '@/components/ProductionFilterBar'
import { getFilteredEntriesByBrowser } from '@/lib/browser-filter'

interface Props {
  params: { filter: string }
}

export default function FilteredBrowserPage({ params }: Props) {
  const searchParams = useSearchParams()
  const type = searchParams.get('type') as 'movie' | 'tv'
  const statusFilters = searchParams.get('filter')?.split(',') || ['All']
  
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedFilters, setSelectedFilters] = useState<string[]>(statusFilters)

  useEffect(() => {
    async function loadFilteredResults() {
      setLoading(true)
      try {
        const data = await getFilteredEntriesByBrowser(
          type,
          params.filter,
          selectedFilters
        )
        setResults(data)
      } catch (error) {
        console.error('Erro ao carregar resultados filtrados:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadFilteredResults()
  }, [type, params.filter, selectedFilters])

  const handleFilterChange = (newFilters: string[]) => {
    setSelectedFilters(newFilters)
  }

  return (
    <div className="filtered-browser-page">
      <header className="filter-header">
        <h1>{params.filter.replace(/-/g, ' ')}</h1>
        
        <ProductionFilterBar 
          mediaType={type}
          selectedFilters={selectedFilters}
          onFilterChange={handleFilterChange}
        />
      </header>

      {loading ? (
        <div className="loader">Carregando...</div>
      ) : (
        <div className="results-section">
          <p className="result-count">{results.length} resultados encontrados</p>
          
          <div className="media-grid large">
            {results.map(item => (
              <MediaCard key={item.id} entry={item} showStatus />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

---

## ✨ Features Existentes

### 1. Rastreamento de Mídia
- Adicionar, editar, deletar títulos
- Suporta séries, filmes e documentários
- Sincronização com TMDB para informações atualizadas
- Status: Watching, Completed, On Hold, Dropped, Plan to Watch

### 2. Gamificação
- Sistema de XP e níveis
- Desafios diários, semanais e mensais
- Badges e conquistas
- Streak tracking
- Sistema de notificações

### 3. Metas Pessoais
- Criar metas customizadas
- Assistência de IA (Claude) para sugerir metas
- Progresso em tempo real
- XP como recompensa
- Deadlines e alertas

### 4. Atividade
- Log de todas as interações
- Histórico de mudanças
- Timeline de atividades
- Export/import de atividades

### 5. Backup & Restore
- Export completo do banco
- Import de dados
- Suporte a versiones anteriores
- Recuperação de dados

### 6. Sistema de Relações
- Prequelas e sequelas
- Spinoffs
- Adaptações
- Títulos relacionados

### 7. Staff & Criadores
- Busca de atores e criadores
- Páginas de detalhe de staff
- Histórico de obras
- Favoritar staff

### 8. Sistema de Favoritos
- Marcar títulos como favoritos
- Marcar staff como favoritos
- Listas personalizadas
- Acessar rapidamente

---

## ✅ Checklist de Implementação

### Fase 1: Sistema de Sincronização (Semana 1-2)
- [ ] Instalar `node-cron` e `p-queue`
- [ ] Criar `src/lib/tmdb-sync.ts`
- [ ] Criar tabela `SyncLog` no banco
- [ ] Implementar agendador de sincronização
- [ ] Criar rota API `/api/sync/manual`
- [ ] Testes de sincronização

### Fase 2: Bolinhas de Status (Semana 2-3)
- [ ] Criar componente `StatusBubble.tsx`
- [ ] Adicionar campo `productionStatus` a Entry
- [ ] Integrar StatusBubble em todos os cards
- [ ] Criar migração Prisma
- [ ] Testes visuais em desktop, tablet, mobile

### Fase 3: Sistema de Filtragem (Semana 3-4)
- [ ] Criar `ProductionFilterBar.tsx`
- [ ] Implementar lógica de filtros em `filter-engine.ts`
- [ ] Atualizar `/api` routes para aceitar filtros
- [ ] Integrar filtros em browser page
- [ ] Testes de filtros

### Fase 4: Sistema de Temporadas (Semana 4-5)
- [ ] Criar modelos `Season` e `Episode` no Prisma
- [ ] Criar tabelas no banco
- [ ] Fazer migração
- [ ] Criar `SeasonSelector.tsx` e `EpisodeGrid.tsx`
- [ ] Integrar em page.tsx, profile/page.tsx, browser
- [ ] Sincronizar seasons com TMDB
- [ ] Testes

### Fase 5: 100+ Conquistas (Semana 5-6)
- [ ] Expandir `achievements.ts` para 100+ conquistas
- [ ] Criar `AchievementEngine` para checking
- [ ] Integrar em todas as ações do usuário
- [ ] Criar UI de visualização de conquistas
- [ ] Toasts de desbloqueio
- [ ] Testes

### Fase 6: Browser Aprimorado (Semana 6-7)
- [ ] Refatorar `/browser/page.tsx` para exibir dados por padrão
- [ ] Criar `/browser/[filter]/page.tsx` dinâmica
- [ ] Implementar filtros de produção status
- [ ] Links entre páginas
- [ ] Testes de navegação
- [ ] Otimização de performance

### Fase 7: Melhorias Visuais (Semana 7-8)
- [ ] Atualizar `AiringProgressCard.tsx` com novo layout
- [ ] Atualizar `NextUpCard.tsx`
- [ ] Criar `MediaCard.module.css`
- [ ] Implementar overlay hover
- [ ] Responsividade (5 col → 4 col → 3 col → 2 col → 1 col)
- [ ] Testes em múltiplos breakpoints

### Fase 8: QA & Otimização (Semana 8-9)
- [ ] Testes integrais de todas as features
- [ ] Performance profiling
- [ ] Otimização de queries
- [ ] Cache estratégico
- [ ] Bug fixes
- [ ] Documentação

---

## 📊 Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                        Cliente (React)                      │
├─────────────────────────────────────────────────────────────┤
│  Page (page.tsx)  Profile  Browser  Gamification  Staff    │
│        ↓              ↓        ↓          ↓         ↓       │
│  Components (Cards, Modals, Forms, etc)                    │
│        ↓              ↓        ↓          ↓         ↓       │
└───────────────────────────────────────────────────────────┬─┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                    Next.js API Routes                       │
├─────────────────────────────────────────────────────────────┤
│  /api/entries    /api/gamification   /api/sync    /api/staff
│      ↓                 ↓                  ↓            ↓
│   entries            XP/goals      TMDB Sync      staff data
└────────────┬─────────────────────────────────────────────┬──┘
             ↓                                              ↓
       ┌──────────────────────────────────────────────────┐
       │           Camada de Lógica (src/lib)             │
       ├──────────────────────────────────────────────────┤
       │ tmdb.ts  gamification.ts  personal-goals.ts  ... │
       └────────────────┬───────────────────────────┬─────┘
                        ↓                           ↓
       ┌──────────────────────────────────────────────────┐
       │            Prisma ORM + PostgreSQL               │
       ├──────────────────────────────────────────────────┤
       │  Entry  Profile  UserGamification  PersonalGoal │
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
# 1. Instalar dependências (incluindo novas)
npm install node-cron p-queue

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

1. **Sincronização**: Sistema automático a cada 6 horas + manual on-demand
2. **Bolinhas**: Visíveis em TODOS os cards do site, corner superior esquerdo
3. **Performance**: Fila de sincronização com max 5 requisições paralelas
4. **Conquistas**: Desbloqueadas automaticamente ao atingir requirement
5. **Browser**: Dados visíveis por padrão, click redireciona para filtrado
6. **Seasons**: Sistema imbutido em home, profile, browser, detalhes

---

**Documento Supremo Criado:** 12 de Maio de 2026  
**Versão Final:** 3.0  
**Status:** ✅ Pronto para Desenvolvimento
