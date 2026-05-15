# Hades — Projeto Completo

## 1. Visão Geral Executiva

**Hades** é uma aplicação Next.js full-stack de **rastreamento, colecionamento e gamificação de mídia** (séries, filmes e conteúdo audiovisual). O projeto combina uma experiência de usuário moderna e imersiva inspirada na mitologia grega com um sistema robusto de gamificação, desafios progressivos e acompanhamento de metas pessoais.

### Propósito Central
- 📺 **Rastreamento de Mídia**: Controle preciso de séries em andamento, filmes completados, watchlist e histórico de visualização.
- 🎮 **Gamificação Progressiva**: Sistema de XP, níveis (até 100+), badges, conquistas e streaks para incentivar hábitos de consumo.
- 🎯 **Metas Pessoais**: Criação de objetivos customizáveis inspirados em mitologia grega com recompensas XP progressivas.
- 🏆 **Desafios Dinâmicos**: Desafios diários, semanais e especiais com dificuldade escalável e recompensas em cascata.
- 🔗 **Integração TMDB**: Sincronização automática com The Movie Database para imagens, sinopses, informações de elenco e dados de exibição em tempo real.
- 📰 **Feed de Notícias**: Agregação de notícias de entretenimento via RSS de Deadline, Variety e Hollywood Reporter.

### Público-alvo
- Cinéfilos e maratonistas de séries que desejam rastrear e organizar seu consumo de mídia.
- Usuários que buscam gamificação e sistemas de progressão para manter hábitos de consumo.
- Colecionadores que querem catalogar, anotar e rankear obras audiovisuais.

---

## 2. Stack Tecnológico Detalhado

### Frontend
- **Next.js 16.2.4**: App Router com renderização híbrida (SSR, SSG, ISR)
  - Routing file-based automático em `/src/app`
  - Suporte a dynamic routes `[id]`, `[slug]`
  - API routes nativas via `/api` routes
  - Streaming e Suspense para experiência incremental
  
- **React 19.2.4**: Componentes modernos
  - Use of Client Components (`'use client'`) para interatividade
  - Suspense boundaries para skeleton loaders
  - React hooks para state management local
  
- **TypeScript 6**: Tipagem forte em todo o projeto
  - Strict mode habilitado
  - Interfaces customizadas para Entry, Profile, UserGamification, etc.

- **Tailwind CSS 4**: Estilização utilitária com tema escuro inspirado em Hades
  - Paleta de cores: rosa (`#e67d99`), dourado (`#c9973a`), preto/cinza escuro
  - CSS Modules para componentes com escopo local (`.module.css`)
  - Animações customizadas (shimmer, fade, glow)

- **Lucide React 1.11.0**: Ícones SVG performáticos
  - Ícones como Flame, Trophy, Zap, Star, Shield, Target, Activity, etc.

### Backend
- **Next.js API Routes**: Endpoint REST nativo
  - Roteamento automático baseado em arquivos
  - Handlers para GET, POST, PATCH, DELETE
  - Middleware nativo para autenticação (quando necessário)

- **Prisma 6.19.3**: ORM robusto e type-safe
  - Schema declarativo em `/prisma/schema.prisma`
  - Migrations automáticas e rastreáveis
  - Query builder com type hints completos
  - Gerenciamento de relações (1-to-many, many-to-many)
  - Soft deletes via flags booleanas (hidden, private)

### Banco de Dados
- **PostgreSQL**: ACID compliance, índices avançados, JSON nativo
  - Suporte a tipos enumerados (MediaStatus, MediaType)
  - Campos JSON para metadados flexíveis (staff, metadata, progressData)
  - Índices compostos para queries de gamificação

### APIs Externas
- **TMDB (The Movie Database)**: Dados de mídia em tempo real
  - Base URL: `https://api.themoviedb.org/3`
  - Endpoints principais:
    - `/tv/{id}` e `/tv/{id}/season/{s}` para séries
    - `/movie/{id}` para filmes
    - `/trending/tv/week` e `/trending/movie/week` para tendências
    - `/tv/changes` e `/movie/changes` para atualizações
    - `/tv/{id}/credits` para elenco

- **RSS 2 JSON**: Agregação de feeds de notícias
  - Gateway: `https://api.rss2json.com/v1/api.json`
  - Fontes: Deadline, Variety, Hollywood Reporter
  - Filtragem por keywords de filme/TV

### Utilitários
- **node-cron 3.0.3**: Agendamento de tarefas backend
  - Usado para sync automático, reset de desafios diários, etc.

- **p-queue 4.0.0**: Rate limiting e fila de requisições
  - Controla concorrência para requisições TMDB

- **isomorphic-fetch 3.0.0**: Requisições HTTP compatíveis SSR/SSG

---

## 3. Arquitetura do Banco de Dados (Prisma Schema)

### 3.1 Modelo Core — Entry (Entrada de Mídia)
```
Entry {
  id: String @id @unique (CUID)
  tmdbId: Int @unique
  parentTmdbId: Int? (para seasons, referencia a série-mãe)
  seasonNumber: Int?
  title: String
  type: MediaType (MOVIE | TV_SEASON)
  status: MediaStatus (WATCHING, COMPLETED, PAUSED, DROPPED, PLANNING, REWATCHING, UPCOMING)
  score: Float (0-10, default 0)
  progress: Int (episódios completados ou percentual de filme)
  totalEpisodes: Int?
  totalSeasons: Int?
  episodeRuntime: Int? (minutos)
  
  # Datas e duração
  startDate: DateTime?
  finishDate: DateTime?
  lastSyncedAt: DateTime?
  
  # Metadados TMDB
  synopsis: String @db.Text
  releaseDate: String
  endDate: String? (para séries)
  lastAirDate: String?
  format: String? (série, minissérie, filme)
  rating: Float? (IMDB rating)
  popularity: Float? (score de popularidade TMDB)
  genres: String? (separados por vírgula)
  studio: String?
  networks: String? (redes de transmissão)
  languages: String?
  staff: Json (credenciais de diretores, roteiristas, etc.)
  productionStatus: String (Released, Post-Production, In Production, Planned)
  
  # Imagens
  imagePath: String? (poster TMDB)
  bannerPath: String? (backdrop TMDB)
  logoPath: String? (logo TMDB)
  customImage: String? (upload do usuário)
  
  # Flags de controle
  notes: String @db.Text (anotações pessoais)
  private: Boolean (ocultar de públicos)
  hidden: Boolean (ocultar da lista)
  hasNewEpisodes: Boolean (trigger para notificações)
  isFavorite: Boolean (destaque em favoritos)
  favoriteRank: Int? (ranking de favoritismo)
  
  # Rewatchability
  rewatchCount: Int (vezes reassistido)
  
  # Relacionamentos
  relationsFrom: Relation[] (prequelas, sequências, adaptações)
  relationsTo: Relation[]
  seasons: Season[] (temporadas de série)
  episodes: Episode[] (episódios)
  syncLogs: SyncLog[] (histórico de sincronização)
  
  # Índices para performance
  @@index([status])
  @@index([type])
  @@index([isFavorite])
  @@index([productionStatus])
  @@index([lastSyncedAt])
}
```

### 3.2 Modelo Relation (Relações entre Mídias)
Conecta obras relacionadas: prequelas, sequências, adaptações, spin-offs, etc.

```
Relation {
  id: String @id (CUID)
  
  sourceEntryId: String (entrada que "propõe" a relação)
  targetEntryId: String? (entrada relacionada no BD)
  
  relationType: String (prequel, sequel, adaptation, spin-off, etc.)
  title: String
  poster_path: String?
  kind: String (TV, Movie, etc.)
  year: String?
  seasonNumber: Int?
  order: Int? (ordem numa sequência)
  
  # Target info (se não está no BD)
  targetTmdbId: Int
  targetParentTmdbId: Int?
  targetSeasonNumber: Int?
  targetType: String? (MOVIE, TV_SEASON)
  
  @@unique([sourceEntryId, targetTmdbId])
}
```

### 3.3 Modelo Season e Episode
Estrutura hierárquica para séries:

```
Season {
  id: String @id (CUID)
  entryId: String (referência à Entry série)
  tmdbId: Int?
  parentTmdbId: Int (ID TMDB da série)
  seasonNumber: Int
  title: String
  overview: String @db.Text
  posterPath: String?
  airDate: String?
  episodeCount: Int
  status: String (Returning Series, Ended, Airing, etc.)
  
  entry: Entry
  episodes: Episode[]
  
  @@unique([entryId, seasonNumber])
}

Episode {
  id: String @id (CUID)
  entryId: String
  seasonId: String?
  tmdbId: Int?
  parentTmdbId: Int
  seasonNumber: Int
  episodeNumber: Int
  title: String
  overview: String @db.Text
  stillPath: String?
  airDate: String?
  runtime: Int? (minutos)
  watched: Boolean (marcado como assistido)
  watchedAt: DateTime?
  
  entry: Entry
  season: Season?
  
  @@unique([entryId, seasonNumber, episodeNumber])
}
```

### 3.4 Profile (Perfil do Usuário)
```
Profile {
  id: String @id (sempre "main" para usuário único)
  username: String
  bio: String?
  avatarUrl: String?
  bannerUrl: String?
  avatarColor: String (color hex para avatar gerado)
}
```

### 3.5 Gamification — UserGamification
Estado geral de XP e progressão:

```
UserGamification {
  id: String @id (CUID)
  userId: String @unique (sempre "main")
  
  totalXP: Int (total acumulado)
  currentLevel: Int (1-100+)
  currentXP: Int (XP até próximo level)
  xpToNextLevel: Int (meta para level-up)
  
  badges: String[] (array de IDs de badges desbloqueados)
  lastAwardedAt: DateTime?
  
  @@index([currentLevel])
  @@index([totalXP])
}
```

### 3.6 Gamification — GamificationActivityLog
Registro de todas as ações que geraram XP:

```
GamificationActivityLog {
  id: String @id (CUID)
  userId: String
  action: String (XPAction: complete_episode, rate_title, etc.)
  xpGained: Int
  metadata: Json {
    score?: number
    episodeCount?: number
    minutesWatched?: number
    streakBonus?: number
    levelMultiplier?: number
  }
  createdAt: DateTime
  
  @@index([userId, createdAt])
  @@index([action])
}
```

### 3.7 Gamification — StreakData
Rastreamento de hábito diário:

```
StreakData {
  id: String @id (CUID)
  userId: String @unique
  
  currentStreak: Int (quantos dias consecutivos)
  longestStreak: Int (recorde pessoal)
  lastActivityDay: DateTime? (último dia com atividade)
  
  updatedAt: DateTime
}
```

### 3.8 Challenges — UserChallenge
Desafio ativo para o usuário:

```
UserChallenge {
  id: String @id (CUID)
  userId: String
  
  challengeId: String (ID do template: daily_watcher, critic_day, etc.)
  periodKey: String (YYYY-MM-DD para daily, YYYY-W## para weekly)
  category: String (daily, weekly, special)
  
  title: String
  description: String
  type: String (watch_episodes, rate_titles, genre_focused, etc.)
  difficulty: String (easy, medium, hard, legendary)
  
  goal: Int (meta numérica)
  current: Int (progresso atual)
  rewardXP: Int
  rewardBadge: String?
  
  metadata: Json (genre, scoreRange, etc. do template)
  progressData: Json (dados internos de tracking)
  
  startsAt: DateTime
  expiresAt: DateTime
  completedAt: DateTime?
  claimedAt: DateTime? (quando foi reclamado o XP)
  
  @@unique([userId, challengeId, periodKey])
  @@index([userId, category, periodKey])
  @@index([expiresAt])
}
```

### 3.9 Challenges — ChallengeCompletion
Histórico de desafios completados:

```
ChallengeCompletion {
  id: String @id (CUID)
  userId: String
  challengeId: String
  periodKey: String
  category: String
  title: String
  xpAwarded: Int
  badge: String?
  completedAt: DateTime
  
  @@unique([userId, challengeId, periodKey])
  @@index([userId, completedAt])
}
```

### 3.10 PersonalGoal (Metas Pessoais)
Objetivos customizáveis inspirados em mitologia:

```
PersonalGoal {
  id: String @id (CUID)
  userId: String (default: "main")
  
  title: String (ex: "Binge Stranger Things S4")
  type: String (episodes, series_completed, movies_completed, paused_cleared, streak_days, score_avg, titles_genre, watchlist_cleared, custom)
  
  target: Float (meta: 8 episódios, 10 séries, 75% de score médio, etc.)
  current: Float (progresso atual)
  
  unit: String (episódios, séries, filmes, dias, %, etc.)
  emoji: String (🎯, 🔥, ⭐, etc.)
  
  deadline: DateTime?
  rewardXP: Int
  
  pinned: Boolean (destacado na UI)
  completed: Boolean
  completedAt: DateTime?
  
  # Novos campos (estrutura estendida)
  notes: String? (contexto adicional)
  difficulty: String? (mortal, heroi, titan, deus)
  
  @@index([userId])
  @@index([completed])
}
```

### 3.11 ActivityLog (Histórico de Atividades)
Registro de mudanças de status, score e progresso:

```
ActivityLog {
  id: String @id (CUID)
  entryId: String
  
  title: String
  imagePath: String?
  type: String (MOVIE, TV_SEASON)
  status: String (novo status: WATCHING -> COMPLETED)
  
  progressStart: Int?
  progressEnd: Int? (antes e depois)
  score: Float
  
  slug: String
  createdAt: DateTime
  lastUpdatedAt: DateTime
  
  @@index([entryId, createdAt])
}
```

### 3.12 SyncLog (Histórico de Sincronização)
Rastreamento de quando cada entry foi sincronizado com TMDB:

```
SyncLog {
  id: String @id (CUID)
  entryId: String
  syncType: String (full, incremental, seasonal)
  status: String (success, partial, failed)
  errorMessage: String?
  itemsUpdated: Int
  executedAt: DateTime
  
  entry: Entry
  @@index([entryId, executedAt])
}
```

---

## 4. Sistema de Gamificação (Tier-by-Tier)

### 4.1 Sistema de XP e Cálculo

#### XPAction — 31 tipos de ações que geram XP:
1. **Add Entry** — 50 XP: adicionar novo título
2. **Add Movie** — 60 XP: filme completo (bonus por ser unidade única)
3. **Add TV Season** — 50 XP: temporada de série
4. **Complete Episode** — 100 XP (1x-1.5x por score): marcar episódio assistido
5. **Complete Season** — 300 XP: finalizar temporada inteira
6. **Complete Series** — 500 XP: série completa finalizada
7. **Complete Movie** — 150 XP (1x-1.5x por score): filme finalizado
8. **Rate Title** — 25 XP: dar nota a obra
9. **Score 9+** — 100 XP: obra entra em patamar excelente
10. **Score 10/10** — 200 XP: favorito absoluto
11. **Write Notes** — 35 XP: adicionar anotações pessoais
12. **Favorite Title** — 40 XP: marcar como favorito
13. **Rewatch Episode** — 60 XP: reassistir episódio
14. **Rewatch Title** — 120 XP: obra completa reassistida
15. **Long Episode** — 40 XP: bonus episódios > 60 min
16. **Movie Marathon** — 250 XP: 2+ filmes em mesmo dia
17. **Weekend Session** — 30 XP: atividade sábado/domingo
18. **Genre Explorer** — 80 XP: novo gênero explorado
19. **Classic Title** — 75 XP: obra antiga ou histórica
20. **Hidden Gem** — 90 XP: obra pouco popular (low popularity)
21. **First Entry** — 150 XP (único): primeiro título adicionado
22. **Planning Cleanup** — 45 XP: mover planning → watching/completed
23. **Streak 3 Days** — 120 XP: atividade 3 dias consecutivos
24. **Streak 7 Days** — 300 XP: atividade semanal
25. **Streak 14 Days** — 650 XP: 2 semanas de rotina
26. **Streak 30 Days** — 1000 XP: mês de atividade
27. **Comeback Session** — 90 XP: retorno após muitos dias parado
28. **Import Collection** — 200 XP: importar coleção em lote
29. **Refresh Library** — 20 XP: sincronizar com TMDB
30. **Manual Bonus** — 0 XP (custom): ajustes administrativos

#### Anti-Farm (Daily Limits)
Para evitar exploração:
- `add_entry`: 20/dia
- `complete_episode`: 30/dia
- `rate_title`: 15/dia
- `score_10`: 5/dia
- ...e mais

#### Multiplicadores de XP
- **Score-based**: episódio/filme com score 8.5+ recebe 1.35x
- **Level-based**: acima de level 10, +2% por level (level 20 = 1.2x multiplicador)
- **Streak bonus**: streaks de 3, 7, 14, 30 dias geram XP bônus automático

### 4.2 Sistema de Levels (1-100+)

**LEVEL_THRESHOLDS** define progressão exponencial:

```typescript
Level 1-2:   1,000 XP por level
Level 3:     +1,500 XP
Level 4:     +2,000 XP
Level 5-10:  +2,500 à 7,000 XP
Level 11-20: +7,000 à 32,000 XP
Level 21-50: +32,000 à 260,000 XP
Level 50+:   +18,000 XP por level
```

**Recompensas por Level**:
- Cada 5 levels: nova moldura de avatar + badge especial
- Cada 10 levels: novo conjunto de desafios
- Cada 25 levels: tema premium e moldura lendária
- Cada level: progresso de cosmetics e bônus passivo

**Nomes de Levels** (100+ únicos):
```
1. Novato → 10. Guru → 20. Lorde da Watchlist → 30. Herdeiro de Hades 
50. Deus do Cinema → 75. Imperador Neon → 100. Hades Absoluto
```

### 4.3 System de Streaks
Habitos diários com graças de 48h:

```
StreakData {
  currentStreak: Int          // dias ativos consecutivos
  longestStreak: Int          // recorde pessoal
  lastActivityDay: DateTime   // permite gap de até 2 dias
}
```

**Lógica**:
- Qualquer XP concedido no dia mantém/avança streak
- Intervalo <= 48h = streak avança
- Intervalo > 48h = streak reseta para 1 (mas `longestStreak` é preservado)
- Milestones: 3, 7, 14, 30 dias conceden XP adicional automático

### 4.4 Achievements — 30+ Conquistas Desbloqueáveis

**Categorias**:

1. **Episódios**
   - `episodes_1`, `episodes_10`, `episodes_50`, `episodes_100`, `episodes_250`, `episodes_500`, `episodes_1000`, `episodes_2000` (🎬 → 💯 → 🌙 → 🛋️ → ⚡)

2. **Séries Completadas**
   - `series_1`, `series_5`, `series_10`, `series_25`, `series_50` (🎬 → 📺 → 🏆)

3. **Filmes Completados**
   - `movies_1`, `movies_5`, `movies_10`, `movies_25`, `movies_50`

4. **Scores Altos**
   - `score_10_count_1`, `score_10_count_5`, `score_10_count_10`, `score_10_count_25` (10/10s coletados)

5. **Streaks**
   - `streak_7`, `streak_14`, `streak_30`, `streak_60`, `streak_90`, `streak_365` (👥 → 🔥 → ⭐)

6. **Nível & XP**
   - `level_10`, `level_25`, `level_50`, `level_100`, `level_200` (🎖️ → 👑)

7. **Diversidade**
   - `genres_10`, `genres_20`, `genres_30` (🎭)

8. **Raridade**:
   - `common`: 50-80 XP de recompensa
   - `rare`: 150-300 XP
   - `epic`: 450-600 XP
   - `legendary`: 1000+ XP

Cada achievement tem:
- Ícone emoji único
- Descrição clara
- "How to Unlock" para UI
- Trigger automático ao atingir meta

---

## 5. Sistema de Desafios (Challenges)

### 5.1 Estrutura de Desafios

**Período de Desafios**:
- **Daily**: 00:00 UTC - 23:59 UTC (periodKey: YYYY-MM-DD)
- **Weekly**: Segunda 00:00 UTC - domingo 23:59 UTC (periodKey: YYYY-W##)
- **Special**: Datas arbitrárias (eventos temáticos)

**Dificuldade Escalável**:
- easy: 2x XP base
- medium: 3x XP base
- hard: 4x XP base
- legendary: 5x+ XP base + badge especial

### 5.2 Templates de Desafios Diários

1. **daily_watcher** (Assistidor Diário)
   - Meta: 2 episódios
   - Recompensa: 150 XP
   - Dificuldade: easy

2. **critic_day** (Dia do Crítico)
   - Meta: 5 títulos com score >= 7
   - Recompensa: 250 XP
   - Dificuldade: medium
   - Metadata: scoreRange [7, 10]

3. **action_junkie** (Viciado em Ação)
   - Meta: 3 episódios de Action
   - Recompensa: 220 XP + badge
   - Dificuldade: medium
   - Metadata: genre = "Action"

4. **drama_focus** (Turno Dramático)
   - Meta: 2 episódios/filmes de Drama
   - Recompensa: 200 XP
   - Dificuldade: easy

5. **comedy_break** (Pausa de Comédia)
   - Meta: 2 títulos de Comédia
   - Recompensa: 180 XP
   - Dificuldade: easy

6. **score_polish** (Polimento de Notas)
   - Meta: Avaliar 8 títulos
   - Recompensa: 200 XP

...+ 10+ mais templates

### 5.3 Sincronização de Desafios com Ações

Função `trackChallengesForAction()` intercepta cada `awardXP()` para:
1. Buscar desafios ativos do usuário (não expirados, não completados)
2. Filtrar por tipo de ação
3. Atualizar `progressData` incrementando `current`
4. Se `current >= goal`: marcar `completedAt`
5. Retornar array de `ChallengeProgressResult` com updates

**Exemplo**: `awardXP({action: 'complete_episode', metadata: {genre: 'Action'}})`
- Incrementa `daily_watcher` em +1
- Incrementa `action_junkie` em +1 (se genero é Action)
- Incrementa `score_polish` em +1 (se há score)

### 5.4 Reclamação de Desafios

Endpoint `POST /api/gamification/challenges` com `claimChallenge()`:
- Valida que `completedAt` existe e `claimedAt` é null
- Concede `rewardXP` + bônus de streak
- Cria entrada em `ChallengeCompletion`
- Marca `claimedAt`
- Emite toast de sucesso

---

## 6. Sistema de Metas Pessoais (Personal Goals)

### 6.1 Tipos de Metas (GoalType)

Cada tipo tem nome de deidade grega associado:

1. **episodes** (Hermes, Psicopompo)
   - Meta: X episódios assistidos
   - Exemplo: "Maratona Stranger Things" — 40 episódios
   - Progress tracking automático

2. **series_completed** (Ares, Enialio)
   - Meta: X séries completadas
   - Exemplo: "Completar 5 séries este trimestre"

3. **movies_completed** (Odisseu, Polimetis)
   - Meta: X filmes completados
   - Exemplo: "Maratona de clássicos — 10 filmes antigos"

4. **paused_cleared** (Caronte, Barqueiro do Estige)
   - Meta: Limpar X títulos pausados
   - Contexto: "o que foi pausado aguarda na margem"

5. **streak_days** (Sísifo, Authos)
   - Meta: X dias de streak consecutivo
   - Contexto: "diferente de Sísifo, você pode vencer"

6. **score_avg** (Atena, julgamento)
   - Meta: Manter score médio acima de Y%
   - Exemplo: "Manter todas avaliadas com 7.5+"

7. **titles_genre** (Apolo, domínio de arte)
   - Meta: X títulos de gênero específico
   - Exemplo: "Explorar 20 obras de ficção científica"

8. **watchlist_cleared** (Moiras, destino)
   - Meta: Limpar X títulos da watchlist
   - Contexto: "o que foi tecido deve ser visto"

9. **custom**
   - Tipo livre para qualquer objetivo

### 6.2 Dificuldade de Metas

- **mortal**: 1x XP sugerido (ex: 100 XP)
- **heroi**: 1.5x XP (150 XP)
- **titan**: 2x XP (200 XP)
- **deus**: 3x XP (300 XP)

### 6.3 Cálculo de XP Sugerido

```typescript
suggestXPForGoal(type: GoalType, target: number, difficulty): number
```

Regras:
- Base por tipo: `episódios` = target * 10, `séries` = target * 100, etc.
- Multiplica pela dificuldade
- Bonus de deadline: -X dias = +% XP

### 6.4 Atualização de Progresso

Função `syncGoalProgress()`:
- Para `episodes`: soma `totalEpisodes` das entries COMPLETED
- Para `series_completed`: conta entries com status COMPLETED
- Para `movies_completed`: conta movies com status COMPLETED
- Para `streak_days`: copia de `StreakData.currentStreak`
- Para `score_avg`: calcula média de scores
- Para `paused_cleared`: conta entries moveidas de PAUSED

**Importante**: NÃO completa meta automaticamente, apenas sincroniza `current`. Usuário marca manualmente como `completed` se atingiu.

### 6.5 Recompensas de Meta

Ao marcar meta como `completed`:
- Concede `rewardXP` definido
- Bônus extra se dentro de deadline: +20% XP
- Bônus extra se difficulty >= "titan": +50 XP fixo
- Registra em `GamificationActivityLog`
- Emite toast/notification

---

## 7. Estrutura de Páginas (App Router)

### 7.1 `src/app/page.tsx` — Home (Server Component)

**Propósito**: Dashboard principal com conteúdo agregado.

**Fluxo de Dados**:
1. **Minha Watchlist em Andamento**
   - Query: `prisma.entry.findMany({ status: 'WATCHING', type: 'TV_SEASON' })`
   - Limite: 6 items
   - Includes: `seasons` com `episodes`
   - Busca TMDB para `next_episode_to_air` e backdrop

2. **Trending This Week**
   - API TMDB: `/trending/tv/week`
   - Busca detalhes de cada item
   - Extrai última temporada + episódios
   - Calcula status de exibição por episódio

3. **Notícias de Entretenimento**
   - 3 fontes RSS: Deadline, Variety, Hollywood Reporter
   - Filtro por keywords: movie, film, series, tv, episode, etc.
   - Exclui gaming, PlayStation, Xbox, etc.
   - Limite: 3 notícias/fonte

4. **Recently Added to TMDB**
   - Endpoints: `/movie/changes` e `/tv/changes`
   - Busca últimos 10 modificados
   - Para TV: obtém season 1 e episódios
   - Calcula status de exibição

**Componentes Renderizados**:
- `AiringProgressCard`: Cards da watchlist com progresso
- `NextUpCard`: Recomendações de próximos itens
- `ChallengeWidget`: Desafios diários em destaque
- `StatusBubble`: Status visual de exibição (Airing, Not Yet Aired, etc.)

**Performance**:
- Suspense boundaries para skeleton loaders
- ISR (Incremental Static Regeneration) com `revalidate`
- Cache de requisições TMDB: 3600s
- Cache de RSS: 3600s
- Cache de changes: 1800s

### 7.2 `src/app/profile/page.tsx` — Perfil (Client Component)

**Propósito**: Central de gerenciamento de lista de mídia e metas pessoais.

**State Management**:
- `entries`: Lista completa de entries do usuário
- `filteredEntries`: Baseado em aba selecionada (overview, series, films, etc.)
- `searchTerm`: Busca em tempo real
- `selectedStatus`: Filtro por status

**Abas Disponíveis**:
1. **Overview**: Estatísticas gerais + cards de favoritos
2. **Series**: Todas as séries (filtered by type = TV_SEASON)
3. **Films**: Todos os filmes (filtered by type = MOVIE)
4. **Favorites**: Apenas com `isFavorite = true`, ordenados por `favoriteRank`
5. **Stats**: Análise detalhada (média de score, generos populares, etc.)
6. **Search**: Busca TMDB para adicionar novos títulos
7. **Goals**: Seção de metas pessoais (integrada)

**Componentes Principais**:
- `ListEditor`: Editor inline de entries
  - Edição de status, score, progress, notas
  - Favoritar, hidden, pin
  - Delete e duplicate
  - Batch operations
  
- `PersonalGoalsSection`: Container de metas
  - Exibição de metas ativas, concluídas
  - Filtros por tipo
  - Abre `PersonalGoalModal` para criar/editar
  - Delete e complete actions
  
- `StatusBubble`: Visual de status de exibição

**Fluxo de Edição**:
1. Usuário clica em entry
2. Modal/inline editor abre
3. Alterações são enviadas para `/api/update-entry` via PATCH
4. Response contém `gamification` (XP ganho, achievements, etc.)
5. `emitXPNotification()` mostra toast
6. Lista revalida via `revalidatePath('/profile')`

### 7.3 `src/app/search/page.tsx` — Busca/Browse

**Propósito**: Descobrir e adicionar novos títulos.

**Features**:
- Busca em tempo real via TMDB `/search/tv` e `/search/movie`
- Filtros por tipo (série, filme), ano, genero, nota
- Pagination
- Integração com modal de adicionar à lista

### 7.4 `src/app/gamification/page.tsx` — Painel de Gamificação

**Propósito**: Visualizar progresso, badges, desafios e achievements.

**Seções**:
1. **XP Bar + Level Info**
   - Level atual + nome temático
   - XP até próximo level (%) e absoluto
   - Multiplicador de nível
   - Recompensa do próximo nível

2. **Streak Display**
   - Streak atual
   - Longest streak
   - Última atividade

3. **Achievements Showcase**
   - Grid de achievements desbloqueados
   - Raridade por cor (common, rare, epic, legendary)
   - Tooltip com "how to unlock" dos próximos

4. **Active Challenges** (Nova fase 3)
   - Cards de desafios do dia/semana
   - Progresso visual (progress bar)
   - Recompensa XP e badge

5. **Challenge History**
   - Últimos 10 desafios completados
   - XP total ganho hoje/semana/mês

### 7.5 `src/app/staff/page.tsx` e `src/app/staff/[id]/page.tsx` — Staff

**Propósito**: Consultar e navegar por atores, diretores, roteiristas, etc.

**Dados Armazenados**:
- Integração com `entry.staff` (JSON armazenado)
- Busca via TMDB `/search/person`

**Página de Detalhe**:
- Bio e foto
- Filmografia (séries e filmes onde apareceu)
- Papéis (ator, diretor, roteirista, etc.)
- Favoritar pessoa

### 7.6 `src/app/titles/[id]/page.tsx` — Detalhes de Título

**Propósito**: Página completa de uma entrada de mídia.

**Dados Exibidos**:
- Sinopse, avaliação, generos
- Progresso (episódios/porcentagem)
- Temporadas e episódios (com status de exibição)
- Elenco e staff relacionado
- Relações (prequelas, sequências, adaptações)
- Notas do usuário
- Histórico de atividades

---

## 8. Componentes (React)

### 8.1 **AiringProgressCard.tsx**
Cards de séries em andamento com progresso visual.

```tsx
Props:
  entry: Entry
  season?: Season
  nextEpisode?: any (TMDB data)
  
Visual:
  - Poster + overlay
  - Episódio atual / Total
  - Progress bar
  - Data do próximo episódio
  - Status badge
```

### 8.2 **NextUpCard.tsx**
Recomendações do que assistir a seguir.

```tsx
Props:
  item: NextUpItem
  onClick?: () => void
  
Visual:
  - Poster
  - Título + tipo
  - Badge de prioridade (1-3)
  - Motivo da recomendação (next_episode, quick_movie, etc.)
```

### 8.3 **ChallengeWidget.tsx**
Mostra desafios ativos em destaque (home e gamification).

```tsx
Props:
  challenges: UserChallenge[]
  onClaimChallenge?: (id: string) => void
  
Visual:
  - Card por desafio
  - Progress bar 
  - Recompensa XP
  - Botão "Reclamar"
```

### 8.4 **PersonalGoalModal.tsx**
Modal avançado para criar/editar metas com sugestão de IA.

```tsx
Props:
  goal: PersonalGoal | null
  onClose: () => void
  onSaved: (goal, isNew) => void

Features:
  - Passo 1: Selecionar tipo de meta (com templates)
  - Passo 2: Formulário completo (title, target, difficulty, deadline, notes, emoji, XP)
  - Passo 3: Assistente IA (Claude API) para sugerir metas
  
  - Dificuldade com sugestão automática de XP
  - Seleção visual de emoji
  - Data picker para deadline
  - Preview de recompensa XP
```

### 8.5 **PersonalGoalsSection.tsx**
Container de metas no perfil.

```tsx
Features:
  - Lista de metas com filtros (ativas, concluídas)
  - Botão "Nova meta"
  - Cards com progresso visual
  - Ações: delete, pin, complete
  - Cálculo de dias até deadline
  - Status visual (% de progresso)
```

### 8.6 **XPProgressBar.tsx**
Barra de XP global na navbar.

```tsx
Visual:
  - Level atual
  - XP progressivo até próximo level
  - Nome do level
  - Tooltip com detalhes
  - Animações de level-up
```

### 8.7 **AchievementToast.tsx** e **ChallengeToast.tsx**
Notificações flutuantes de conquistas e desafios completados.

```tsx
Visual:
  - Ícone + título
  - Descrição
  - XP ganho
  - Auto-dismiss após 5s ou clique
  - Animações slide-in/fade-out
```

### 8.8 **NotificationPanel.tsx**
Painel flutuante de notificações do sistema.

```tsx
Features:
  - Toggle na navbar
  - Lista de notificações recentes
  - Categorias (XP, achievement, challenge, system)
  - Limpeza de notificações
```

### 8.9 **ListEditor.tsx**
Editor inline de entries na lista.

```tsx
Features:
  - Editar status, score, progress, notas inline
  - Favoritar/desfavoritar
  - Hide/unhide
  - Delete com confirmação
  - Batch rename
  - Reordenação por rank de favorito
```

### 8.10 **StaffComponents/**
- **StaffHeader.tsx**: Cabeçalho com foto, bio e metadados
- **StaffRolesSection.tsx**: Filmografia organizada por papel
- **StaffFavoriteButton.tsx**: Botão para favoritar pessoa

---

## 9. Biblioteca de Lógica (`src/lib`)

### 9.1 **gamification.ts**
Core do sistema de XP.

```typescript
// Função principal
awardXP(input: AwardXPInput): Promise<AwardXPResult>
  
Fluxo:
  1. Valida ação
  2. Verifica daily limit
  3. Calcula XP via calculateXPForAction()
  4. Atualiza UserGamification
  5. Registra em GamificationActivityLog
  6. Atualiza streak via updateStreak()
  7. Verifica achievements via checkAchievements()
  8. Rastreia desafios via trackChallengesForAction()
  9. Retorna resultado completo com notifications
  
Returns: {
  xpGained, actionXP, streakBonusXP, newTotal,
  leveledUp, gainedLevels, level, levelName,
  newAchievements, challengeProgress, completedChallenges,
  streak, message
}
```

### 9.2 **xp-calculator.ts**
Cálculo granular de XP.

```typescript
calculateXPForAction(action: XPAction, metadata?: XPCalculationMetadata): XPCalculationResult

Fatores:
  - Action base XP
  - Score multiplier (8.5+ = 1.35x para complete_episode)
  - Level multiplier (level 20 = 1.2x)
  - Bonus XP customizado (manual adjustments)
  - Episode count (movie_marathon detects)
  - Weekend bonus (sábado/domingo)
  
Returns: { baseXP, multiplier, bonusXP, xpGained, label, description }
```

### 9.3 **level-system.ts**
Progressão de níveis.

```typescript
getLevelFromXP(totalXP: number): LevelThreshold
getLevelProgress(totalXP: number): {
  currentLevel, nextLevel, currentXP, xpToNext, xpPercent, xpRemaining
}
getLevelUpRange(previousXP, nextXP): {
  leveledUp, previousLevel, currentLevel, gainedLevels
}

LEVEL_TITLES: 100+ nomes temáticos de level
LEVEL_THRESHOLDS: array completo de progressão com XP e recompensas
```

### 9.4 **achievements.ts**
Définition de achievements.

```typescript
ACHIEVEMENTS: Achievement[] (30+)

Cada achievement:
  - id, name, icon (emoji)
  - description, howToUnlock
  - rarity (common|rare|epic|legendary)
  - xpReward
  - trigger (total_episodes, level_reach, score_10_count, etc.)

checkAchievements(stats): Achievement[]
  - Avalia cada achievement contra stats do usuário
  - Retorna novas achievements desbloqueadas
```

### 9.5 **challenge-generator.ts**
Geração e gestão de desafios.

```typescript
// Templates
DAILY_CHALLENGES: ChallengeDefinition[] (10+)
WEEKLY_CHALLENGES: ChallengeDefinition[] (8+)

ensureChallengesForUser(userId): Promise<UserChallenge[]>
  - Cria desafios do dia se não existem
  - Auto-reseta desafios expirados
  - Retorna desafios ativos

getChallengeDashboard(userId): Promise<{
  active: UserChallenge[]
  completed: ChallengeCompletion[]
  stats: { totalCompleted, xpEarned, ... }
}>
```

### 9.6 **challenge-tracker.ts**
Sincronização de desafios com ações.

```typescript
trackChallengesForAction(input: TrackChallengesInput): Promise<ChallengeProgressResult[]>

Fluxo:
  1. Busca desafios ativos do usuário
  2. Filtra por tipo de ação
  3. Avalia metadados (genre, score range, etc.)
  4. Incrementa progresso
  5. Detecta completões
  6. Retorna updates

ChallengeProgressResult {
  challengeId, title, category, previous, current, goal,
  progressPercent, completed, rewardXP, badge, message
}
```

### 9.7 **personal-goals.ts**
CRUD e sincronização de metas pessoais.

```typescript
// Tipos
type GoalType = 'episodes' | 'series_completed' | 'movies_completed' | ...
GOAL_TYPE_MYTHS: Metadados de mitologia para cada tipo
GOAL_TEMPLATES: Templates pré-configurados

// Funções
getGoals(userId, filter?: Partial<PersonalGoal>): Promise<PersonalGoal[]>
createGoal(userId, input: CreateGoalInput): Promise<PersonalGoal>
updateGoal(goalId, input: UpdateGoalInput): Promise<PersonalGoal>
deleteGoal(goalId): Promise<void>
markGoalComplete(goalId): Promise<{ goal, xpAwarded, leveledUp, message }>

syncGoalProgress(goal, currentEntries): void
  - Atualiza `goal.current` baseado em entries
  - Não marca como completa automaticamente

suggestXPForGoal(type, target, difficulty): number
  - Base por tipo × multiplicador de dificuldade
  - Bônus se deadline está próximo
```

### 9.8 **next-up.ts**
Algoritmo de "próximos para assistir".

```typescript
getNextUpItems(limit, filters): Promise<NextUpItem[]>

Lógica:
  1. Séries WATCHING com progresso incompleto (prioridade 1)
  2. Filmes PLANNING rápidos (< 150 min, prioridade 2)
  3. TV paused / quase terminando (prioridade 2)
  4. Outros em andamento (prioridade 3)

Ordenação:
  - calculateUrgency(): score baseado em dias parado, progresso, status
  - Paused = +30 urgência
  - Quase terminando = +20 urgência
  - Score alto = +10 urgência
```

### 9.9 **tmdb.ts** e **tmdb-*.ts**
Integração TMDB.

```typescript
fetchWithRetry(url, options): Promise<Response>
  - Retry automático com backoff exponencial
  - Timeout configurável
  - Fallback de linguagem

getDetailedMedia(tmdbId, type): Promise<any>
  - append_to_response: credits, images, videos, recommendations

getTVSeasonDetails(tvId, seasonNumber): Promise<Season>
getTVEpisodeDetails(tvId, seasonNumber, episodeNumber): Promise<Episode>

Sincronização: lastSyncedAt em cada entry
```

### 9.10 **activity.ts**
Registro de mudanças.

```typescript
trackActivity(entryId, title, statusChange, progressChange, score)
  - Cria ActivityLog
  - Registra antes/depois de status e progresso
```

### 9.11 **relations-manager.ts**
Gerencia prequelas, sequências, adaptações.

```typescript
createRelation(source, target, relationType)
deleteRelation(relationId)
getRelationsFor(entryId): Relation[]
```

### 9.12 **utils.ts**
Helpers gerais.

```typescript
formatScore(score: number): string
scoreColor(score: number): string (tailwind color)
imgUrl(tmdbPath: string): string (URL completo TMDB)
entrySlug(entry: Entry): string (SEO-friendly)
```

### 9.13 **notifications.ts**
Sistema de notificações.

```typescript
emitNotification(type, title, message, data?)
getRecentNotifications(userId, limit)
```

### 9.14 **production-status.ts**, **series-status.ts**, **status-sync.ts**
Mapeamento de status TMDB → UI.

```typescript
productionStatusToDisplayStatus(status): string (Released, In Production, etc.)
entryStatusToBubbleStatus(entry): string
titlePageSeasonStatus(episodes): string
```

---

## 10. Hooks

### 10.1 **useXPNotification.ts**
Gerencia notificações de XP.

```typescript
emitXPNotification(data: XPNotificationAward)
useXPNotification(): {
  notifications: XPNotificationAward[]
  dispatch: (award) => void
}

Usado em:
  - Profile ao editar entry
  - Gamification ao reclamar challenge
  - Home ao completar ação via bot
```

---

## 11. API Routes (`src/app/api`)

### 11.1 **Entries Management**
- `GET /api/entries`: Lista todas as entries
- `POST /api/entries`: Criar nova entry
- `PATCH /api/entries/[id]`: Editar entry
- `DELETE /api/entries/[id]`: Deletar entry
- `POST /api/entries/import`: Bulk import de entries

### 11.2 **Update Entry**
- `PATCH /api/update-entry`: Atualizar status, score, progress de uma entry
  - Triggers XP award, achievement check, challenge tracking
  - Retorna resultado gamificação completo

### 11.3 **Gamification**
- `GET /api/gamification/user-stats`: Obter stats completas (level, XP, streak, achievements)
- `POST /api/gamification/award-xp`: Conceder XP manualmente
- `POST /api/gamification/bootstrap-xp`: Inicializar XP do usuário
- `GET /api/gamification/challenges`: Obter desafios ativos e completados
- `POST /api/gamification/challenges/claim`: Reclamar desafio completado
- `POST /api/gamification/reset-daily-challenges`: Reset dos desafios do dia

### 11.4 **Personal Goals**
- `GET /api/gamification/personal-goals`: Listar metas
- `POST /api/gamification/personal-goals`: Criar meta
- `PATCH /api/gamification/personal-goals/[id]`: Editar meta
- `POST /api/gamification/personal-goals/[id]/complete`: Marcar como completa
- `DELETE /api/gamification/personal-goals/[id]`: Deletar meta

### 11.5 **Next Up**
- `GET /api/next-up`: Obter itens recomendados para assistir (com filtros)

### 11.6 **Activity**
- `GET /api/activity`: Listar atividades recentes
- `POST /api/activity/import`: Importar histórico de atividades
- `GET /api/activity/export`: Exportar atividades

### 11.7 **Profile**
- `GET /api/profile`: Dados de perfil do usuário
- `PATCH /api/profile`: Atualizar avatar, bio, banner
- `POST /api/profile/export`: Exportar perfil
- `POST /api/profile/import`: Importar perfil

### 11.8 **Backup**
- `POST /api/backup/full-export`: Exportar todo o banco em JSON
- `POST /api/backup/full-import`: Importar backup completo

### 11.9 **Refresh & Sync**
- `POST /api/refresh-all`: Sincronizar toda a biblioteca com TMDB
- `POST /api/sync`: Sincronização customizada

### 11.10 **Search & Discovery**
- `GET /api/search`: Buscar títulos em TMDB
- `GET /api/staff/search`: Buscar atores, diretores, etc.
- `GET /api/staff/[id]`: Detalhes de staff

---

## 12. Fluxo de Dados Completo (End-to-End)

### Exemplo: Usuário marca episódio como assistido

```
1. Cliente (Profile page)
   → Clica checkbox de episódio completado
   → UI atualiza `entry.progress += 1`
   → POST /api/update-entry com nova progress

2. Backend (API Route)
   → Recebe: { entryId, progress: 5/8, ... }
   → Atualiza prisma.entry.update()
   → Chama awardXP({
       action: 'complete_episode',
       metadata: { score: 8.5, episodeCount: 1 }
     })

3. Gamification Engine
   → calculateXPForAction() = 100 * 1.35 (score 8.5) = 135 XP
   → updateStreak() = streak avança para +1
   → checkAchievements() = detecta "episodes_10" completo
   → trackChallengesForAction() = incrementa daily_watcher (1/2)
   → updateUserGamification(currentXP + 135)
   → Retorna AwardXPResult completo

4. Client
   → Recebe response com { xpGained: 135, leveledUp: false, newAchievements: [...] }
   → emitXPNotification() dispara toast "🎖️ +135 XP!"
   → Emite achievement toast se aplicável
   → Atualiza XPProgressBar na navbar
   → Revalida profile via revalidatePath()

5. Banco de Dados
   → UserGamification.currentXP += 135
   → GamificationActivityLog INSERT
   → StreakData.currentStreak = 2
   → Possível LevelUp registrado em log
```

---

## 13. Padrões de Design e Arquitetura

### 13.1 **Server Components vs Client Components**

**Server Components** (renderização no servidor):
- `page.tsx` em `/app` (layout, home, etc.)
- Acesso direto ao banco via `prisma`
- Fetch de dados TMDB via API
- Suspense para streaming

**Client Components** (`'use client'`):
- `profile/page.tsx`: lista e filtragem local
- Componentes de UI interativos (modais, inputs, buttons)
- Hooks customizados (`useXPNotification`)
- Event handlers e estado local

### 13.2 **Data Fetching Patterns**

**Revalidation Strategy**:
```typescript
// ISR — Next.js cache + revalidate
fetch(url, { next: { revalidate: 3600 } })  // 1 hora

// On-Demand Revalidation
revalidatePath('/profile')  // após editar entry

// Streaming Suspense
<Suspense fallback={<Skeleton />}>
  <AsyncComponent />
</Suspense>
```

### 13.3 **Error Handling**

**Try-Catch + Fallback**:
```typescript
try {
  const data = await fetchTmdbWithRetry(url)
} catch (error) {
  return fallbackData || null
}
```

**Daily Limits Anti-Farm**:
```typescript
const reachedLimit = await hasReachedDailyLimit(userId, action)
if (reachedLimit) return { skipped: true, skipReason: 'Daily limit reached' }
```

### 13.4 **Type Safety**

Toda função recebe tipos explícitos:
```typescript
awardXP(input: AwardXPInput): Promise<AwardXPResult>
getGoals(userId: string, filter?: Partial<PersonalGoal>): Promise<PersonalGoal[]>
createRelation(source: Entry, target: Entry, type: RelationType): Promise<Relation>
```

### 13.5 **Performance Optimizations**

- **Índices de BD**: Status, type, isFavorite, timestamps
- **Pagination**: Limit 6-10 items por query
- **Caching**: TMDB 1h, RSS 1h, TMDB Changes 30min
- **Retry Logic**: 3 tentativas com backoff exponencial
- **Rate Limiting**: p-queue para concorrência controlada

---

## 14. Fluxos de Negócio Principais

### 14.1 **Onboarding & Bootstrap**
1. Usuário acessa app pela primeira vez
2. Auto-creates Profile (default "main")
3. Auto-creates UserGamification (level 1, 0 XP)
4. Auto-creates StreakData (0 streak)
5. Primeiro `awardXP({action: 'first_entry'})` concede 150 XP + achievement

### 14.2 **Daily Challenge Cycle**
- **00:00 UTC**: Sistema reseta desafios do dia
- `ensureChallengesForUser()` cria 3-5 desafios novos
- **Durante o dia**: Usuário ganha XP, challenges rastreiam progresso
- **Ao completar**: User vê toast, pode reclamar via endpoint
- **Reivindicação**: Concede XP + bônus streak se aplicável

### 14.3 **Streak Maintenance**
- Qualquer XP concedido no dia avança/inicia streak
- Intervalo > 48h reseta streak mas preserva `longestStreak`
- Milestones (7, 14, 30 dias) concedem XP extra automático
- Streak display na navbar e gamification page

### 14.4 **TMDB Synchronization**
- `POST /api/refresh-all` dispara sync
- Para cada entry: busca dados atualizados
- Se season > conhecida: adiciona novas seasons/episodes
- Registra em SyncLog com status e items updates
- Atualiza `lastSyncedAt`

### 14.5 **Backup & Import/Export**
- `GET /api/backup/full-export`: JSON com todas as entries, goals, activity, profile
- `POST /api/backup/full-import`: Restaura backup
- Preserva histórico de gamificação

---

## 15. Features Avançadas e Estrutura Estendida

### 15.1 **Mitologia Grega Como Tema**

Cada sistema usa nomes e metáforas gregas:
- **Levels**: 100+ nomes de deidades e heróis
- **Metas**: Cada tipo tem deidade associada (Hermes para episódios, Ares para batalhas, etc.)
- **Achievements**: Referências a mitos (Filho de Hypnos para 2000 episódios, etc.)
- **Streaks**: Comparação com Sísifo
- **Layout**: Cores rosa/dourado dos Underworld Hades

### 15.2 **AI Integration Potencial**

Modal de metas pode integrar Claude API:
- Sugerir metas baseado em histórico do usuário
- Gerar descrições criativas
- Recomendar difficulty e XP

### 15.3 **Notificações Push (Futuro)**

- Notificação quando novo episódio aired
- Reminder de streak em risco
- Challenge expirando em breve

### 15.4 **Social Features (Futuro)**

- Compartilhar metas/achievements
- Comparar stats com outros usuários
- Rankings de level, streak, XP

---

## 16. Observações Técnicas

### 16.1 **Migrations Prisma**

Histórico de migrations:
- `20260425014957_init_hades_schema`: Schema inicial (Entry, Profile, Gamification)
- `20260425035227_add_new_fields`: Campos adicionais (staff, networks, etc.)
- `20260425170952_add_profile`: Profile model
- `20260426235233_relation_target_optional`: Relações opcionais
- `20260429133647_add_activity_log`: ActivityLog model
- `20260430205105_add_gamification_phase_1`: UserChallenge, ChallengeCompletion
- `20260501030000_add_challenges_phase_3`: Desafios completos
- `20260501134716_add_personal_goals`: PersonalGoal model
- `20260512120000_master_documentation_features`: Documentação e features finais

### 16.2 **Segurança**

- Todas as queries usam prepared statements (Prisma)
- Validação de entrada em endpoints
- CORS configured (implícito Next.js)
- Rate limiting via p-queue
- No hardcoded secrets (use .env)

### 16.3 **Logging & Debugging**

- `src/instrumentation.ts`: Configuração de logging global
- Prisma logs queryies em dev: `log: ['query']`
- Try-catch com console.error em rotas críticas
- ActivityLog e GamificationActivityLog para auditoria

---

## 17. Recomendações para Desenvolvimento Futuro

### Curto Prazo (Feature Completeness)
- [ ] Finalize modal de Personal Goals (AI integration Claude)
- [ ] Componente de estatísticas avançadas (gráficos de progresso por genero, ritmo temporal)
- [ ] Sistema de relatório (export de badges, conquistas em PDF)
- [ ] Temas customizáveis (modo claro, outros paletas de cores)

### Médio Prazo (Polish & Performance)
- [ ] Otimizar queries com mais índices e pagination automática
- [ ] Implementar service worker para offline support
- [ ] Cachear avatares TMDB localmente
- [ ] Compressão de imagens via next/image otimizado

### Longo Prazo (Expansão)
- [ ] Social features (leaderboards, compartilhamento)
- [ ] Mobile app via React Native ou PWA
- [ ] Recomendações ML (baseado em score, genero, similar users)
- [ ] Integração com other platforms (IMDb, MyAnimeList)
- [ ] Websocket live updates (quando amigos completam, desafios globais)

---

## 18. Estrutura de Pastas Completa

---

## Banco de Dados e Prisma

### `prisma/schema.prisma`
O modelo de dados principal contém:

- **Entry**: Lista de títulos monitorados com campos de TMDB, status, score, progresso, imagens e preferências.
- **Relation**: Relações entre entries, por exemplo prequelas, spinoffs e adaptações.
- **Profile**: Dados do perfil do usuário, avatar, banner e bio.
- **UserGamification**: XP do usuário, nível atual, badges e progresso.
- **GamificationActivityLog**: Histórico de ações gamificadas.
- **StreakData**: Streak diário do usuário.
- **UserChallenge**: Desafios ativos com metas, status e prêmios.
- **ChallengeCompletion**: Desafios concluídos gravados.
- **ActivityLog**: Log de atividade de mídia e atualizações.
- **PersonalGoal**: Metas pessoais do usuário com tipo, target, progresso e conclusão.

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
- `ListEditor`: Exibe e edita a lista de entries do usuário.
- `PersonalGoalsSection`: Exibe metas pessoais e abre `PersonalGoalModal`.
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
- `staff/page.tsx`: Lista de staff ou busca de pessoas.
- `staff/[id]/page.tsx`: Página dinâmica para detalhe de staff.
- Usa `src/lib/staff.ts` para consultar e transformar dados de staff.

### `src/app/titles/[id]/page.tsx` — Detalhes do título

Página dinâmica de título que exibe informações completas do entry:
- Dados de título, sinopse, progresso, status, notas e staff relacionados.
- Carrega dados de uma entry específica e possivelmente informações do TMDB.

---

## API Routes

A pasta `src/app/api` contém rotas do App Router que expõem a camada backend:

### `activity/`
- `route.ts`: Lista de atividades recentes.
- `[id]/route.ts`: Operação em item de atividade único.
- `export/route.ts`, `import/route.ts`: Exportar/importar logs de atividade.

### `add-media/route.ts`
- Rota para adicionar novos títulos diretamente ao banco de dados.

### `backup/`
- `full-export/route.ts`: Exporta backup completo do banco.
- `full-import/route.ts`: Importa backup completo.

### `entries/`
- `route.ts`: CRUD e listagem de entries.
- `[id]/route.ts`: Operação para entry específica.
- `import/route.ts`: Importar entries em lote.

### `entry/`
- `[id]/route.ts`: Route para entry por ID.
- `by-slug/[slug]/route.ts`: Consulta de entry pelo slug.

### `gamification/`
- `award-xp/route.ts`: Concede XP por ação.
- `bootstrap-xp/route.ts`: Inicializa XP do usuário.
- `challenges/route.ts`: Expõe desafios e atualizações.
- `personal-goals/route.ts`: CRUD de metas pessoais.
- `reset-daily-challenges/route.ts`: Reseta desafios diários.
- `user-stats/route.ts`: Retorna estatísticas de usuário.

### `next-up/route.ts`
- Retorna itens "próximos" para assistir, com base em regras de prioridade.

### `notifications/route.ts`
- Rota de notificações para o painel de UI.

### `profile/`
- `route.ts`: Retorna dados de perfil.
- `export/route.ts`: Exporta perfil.
- `import/route.ts`: Importa perfil.

### `refresh-all/route.ts`
- Gatilha recarga de dados, provavelmente para sincronizar TMDB, gamificação e cache.

### `relations/`
- `route.ts`: Gerencia relações de mídia.
- `export/route.ts` e `import/route.ts`: Exportar/importar relações.

### `staff/`
- `search/route.ts`: Busca staff.
- `[id]/route.ts`: Detalhes de staff.

### `update-entry/route.ts`
- Atualiza progresso, status ou score de uma entrada existente.

---

## Components e UI

### `src/components/PersonalGoalsSection.tsx`
Exibe lista de metas pessoais e controla:
- Busca de metas via API
- Filtros (ativas, concluídas, todas)
- Ações de delete, pin e concluir
- Abertura do modal de criação/edição

### `src/components/PersonalGoalModal.tsx`
Modal de criação/edição de metas com:
- Seleção de templates de metas
- Assistente de IA (Claude) para sugerir metas
- Formulário de título, target, unidade, deadline, XP e pin
- Validação e chamadas POST/PATCH
- Header fixo, conteúdo rolável e footer fixo

### `src/components/AiringProgressCard.tsx`
Mostra cards de títulos em exibição com:
- Status de progresso
- Indicador de episódios e tempo restante
- Hover overlay com detalhes adicionais

### `src/components/NextUpCard.tsx`
Renderiza cards de próximos itens a assistir:
- Título, status e progresso
- Badge de prioridade e overlay no hover

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
- `StaffHeader.tsx`: Cabeçalho da página de staff com foto, biografia e metadados.
- `StaffRolesSection.tsx`: Exibe papeis de staff por título.
- `StaffFavoriteButton.tsx`: Botão de favoritar membro staff.

---

## Biblioteca de Lógica (`src/lib`)

### `src/lib/utils.ts`
Funções utilitárias comuns:
- Formatação de score
- Geração de slugs para entries e títulos
- URLs de imagem do TMDB
- Helpers de data

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
- `syncGoalProgress`: Atualiza `current` com dados reais, mas não completa automaticamente
- Helpers de apresentação como `%` e dias restantes

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
- `app/page.tsx`: Home estática com conteúdo dinâmico via fetch de TMDB.
- `app/profile/page.tsx`: Área de usuário e metas.
- `app/search/page.tsx`: Busca de mídia.
- `app/gamification/page.tsx`: Painel de gamificação.
- `app/staff/page.tsx` e `app/staff/[id]/page.tsx`: Staff e detalhes.
- `app/titles/[id]/page.tsx`: Detalhe de título dinâmico.

### Gamificação e metas
- `UserGamification` e `PersonalGoal` são os pilares de progresso.
- Desafios são gerados, rastreados e completados via `UserChallenge`.
- Metas pessoais podem ser criadas, editadas, concluídas e removidas.
- O app tem rotas específicas para award XP, reset de desafios e bootstrap de gamificação.

---

## Observações Extras

- `test-db.js`: Possivelmente utilizado para testes rápidos de banco ou execução local.
- Documentos auxiliares como `BUGFIX_PERSONAL_GOALS.md`, `SOLUÇÕES_ANÁLISE.md`, `BACKUP_SYSTEM_GUIDE.md` e `AUDIT_EXPORT_IMPORT.md` são guias e registros de trabalho.
- `public/` contém ícones SVG de suporte, mas nenhuma imagem de mídia principal.

---

## Recomendações para leitura rápida

1. `src/app/layout.tsx`: Estrutura de navegação global.
2. `src/app/page.tsx`: Principal lógica de home e integração TMDB.
3. `src/app/profile/page.tsx`: Workflow de perfil e metas.
4. `src/app/api/gamification/personal-goals/route.ts`: API de metas pessoais.
5. `src/lib/personal-goals.ts`: Regras de negócio de metas.
6. `prisma/schema.prisma`: Modelo de dados completo.

---

Este documento cobre a arquitetura principal, o propósito dos arquivos mais importantes e a forma como cada camada do aplicativo se conecta.
