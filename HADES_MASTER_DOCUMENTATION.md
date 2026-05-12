# HADES - Documentacao Master

**Versao:** 5.0
**Status:** Em desenvolvimento ativo
**Ultima atualizacao:** 12 de maio de 2026
**Projeto:** Next.js + Prisma + PostgreSQL para rastreamento de filmes, series/temporadas, gamificacao pessoal e sincronizacao com TMDB.

---

## Sumario Executivo

Hades e um aplicativo Next.js inspirado em interfaces como AniList para acompanhar filmes, series e temporadas, registrar progresso, pontuacoes, favoritos, relacoes entre titulos, atividade, metas pessoais, desafios e conquistas. O estado atual do codigo mostra que o sistema de bolinhas de status foi refatorado de forma ampla: ele nao e mais uma simples bolinha de `productionStatus`, e sim um sistema visual unificado baseado em `seasonStatus`, episodios com data de exibicao, `productionStatus` normalizado e snapshots ao vivo do TMDB.

O sistema agora separa dois conceitos:

- **Status de watch do usuario:** `WATCHING`, `COMPLETED`, `PAUSED`, `DROPPED`, `PLANNING`, `REWATCHING`, `UPCOMING`. Esse status continua aparecendo como barra/cor/acoes de lista.
- **Status visual de exibicao/producao:** `Airing`, `Not Yet Aired`, `Finished`, `Returning Series`, `In Production`, `Planned`, `Post Production`, `Rumored`, `Canceled`, `Pilot`, `Ended`, `Released`. Esse status alimenta a `StatusBubble`.

Regra principal da bolinha:

- `Airing` mostra bolinha verde pulsante.
- `Not Yet Aired`/`Planned`, `Returning Series`, `In Production`, `Post Production`, `Rumored`, `Canceled` e `Pilot` mostram bolinhas coloridas.
- `Finished`, `Ended` e `Released` nao mostram bolinha.

---

## Indice

1. [Estado Atual](#estado-atual)
2. [Concluido vs Pendente](#concluido-vs-pendente)
3. [Arquitetura](#arquitetura)
4. [Banco de Dados](#banco-de-dados)
5. [Sistema de Bolinhas de Status](#sistema-de-bolinhas-de-status)
6. [Sincronizacao TMDB](#sincronizacao-tmdb)
7. [Browser e Filtros](#browser-e-filtros)
8. [Temporadas e Relacoes](#temporadas-e-relacoes)
9. [Gamificacao, Conquistas e Metas](#gamificacao-conquistas-e-metas)
10. [Rotas de API](#rotas-de-api)
11. [Checklist Atualizado](#checklist-atualizado)
12. [Pendencias Reais](#pendencias-reais)
13. [Como Rodar](#como-rodar)

---

## Estado Atual

### Fases concluidas

- **Fase 1 - Sincronizacao TMDB:** concluida. `src/lib/tmdb-sync.ts` sincroniza entradas individuais e todas as entradas, usa fila com concorrencia 5, grava `SyncLog`, atualiza metadados e chama `syncEntrySeasonEpisodes()` para series.
- **Fase 2 - Bolinhas de status:** concluida e refatorada. `StatusBubble.tsx` virou uma casca visual simples; a regra real vive em `src/lib/series-status.ts`, `src/lib/tmdb-status.ts` e `src/lib/status-sync.ts`.
- **Fase 3 - Filtros por production status:** concluida. `ProductionFilterBar.tsx`, `production-status.ts` e `browser-filter.ts` estao implementados e integrados no browser dinamico.
- **Fase 4 - Sistema de temporadas:** concluida para o escopo atual. Temporadas/episodios existem na camada de dados e aparecem principalmente na pagina de titulo; cards/listagens usam apenas o status visual necessario.
- **Fase 5 - 100+ conquistas:** concluida. `src/lib/achievements.ts` esta expandido e a UI tem `AchievementToast`.
- **Fase 6 - Browser aprimorado:** concluida. `/browser` exibe secoes por padrao e `/browser/[filter]` aceita filtros via query string.
- **Personal Goals - bug de conclusao automatica:** corrigido. `syncGoalProgress()` atualiza somente `current`; concluir meta depende da acao explicita `action: 'complete'`.

### Parcialmente concluido

- **Fase 7 - Melhorias visuais:** parcialmente concluida. `MediaCard`, `AiringProgressCard` e `NextUpCard` ja usam o novo `StatusBubble` e layouts com overlay/progresso. Ainda falta uma rodada dedicada de QA visual em breakpoints e padronizacao de estilos.

### Pendente

- **Fase 8 - QA & otimizacao:** pendente. Falta rodar uma validacao completa atualizada, incluindo build/lint, navegacao manual, testes em mobile/desktop e verificacao de performance das chamadas TMDB.

---

## Concluido vs Pendente

### Concluido

- `StatusDot` nao aparece mais como componente usado nos cards. O nome ainda existe apenas como tipo/interface (`StatusDotConfig`) dentro da logica de status.
- `StatusBubble` esta integrado em:
  - `src/app/page.tsx`
  - `src/app/profile/page.tsx`
  - `src/app/search/page.tsx`
  - `src/app/titles/[id]/page.tsx`
  - `src/components/MediaCard.tsx`
  - `src/components/AiringProgressCard.tsx`
  - `src/components/NextUpCard.tsx`
  - `src/components/StaffComponents/StaffRolesSection.tsx`
- `Released`, `Ended` e `Finished` nao renderizam bolinha.
- Series usam status real da temporada quando possivel (`Airing`, `Finished`, `Not Yet Aired`), calculado por datas de episodios.
- Filmes usam `productionStatus` normalizado do TMDB.
- Browser e filtros de producao estao implementados.
- `/api/status-analysis` existe para diagnostico do sistema visual.
- `/api/sync/manual` existe para sincronizacao manual e consulta de logs.
- O `profile` chama `/api/entries` no carregamento inicial/F5 e nao bloqueia a tela com chamadas ao TMDB. Os cards usam dados locais e calculo local de bolinha para abrir rapido.
- A pagina `titles/[id]` busca `/api/entry/{slug}` com `cache: 'no-store'`; essa rota sincroniza a entrada individual com TMDB antes de responder.
- Scheduler TMDB roda via `src/instrumentation.ts`, chamando `startTmdbSyncScheduler()` no runtime Node.js.
- Metas pessoais nao sao mais concluidas automaticamente por sincronizacao.

### Falta validar ou melhorar

- Rodar `npm run build` e `npm run lint` apos esta atualizacao de documentacao.
- Verificar visualmente a `StatusBubble` em `/`, `/profile`, `/search`, `/browser`, `/browser/[filter]`, `/titles/[id]` e paginas de staff.
- Confirmar em dados reais do banco se entradas antigas receberam `productionStatus` correto apos sync.
- Avaliar cache/rate limit do TMDB em `browser-filter.ts`, porque cada secao hidrata detalhes de varios titulos.
- Padronizar textos/idioma da UI, que mistura ingles e portugues em alguns pontos.
- Corrigir mojibake/caracteres quebrados que aparecem em alguns arquivos-fonte e textos renderizados.

---

## Arquitetura

### Stack

- **Next.js:** 16.2.4 com App Router
- **React:** 19.2.4
- **TypeScript:** 6
- **Prisma:** 6.19.3
- **Banco:** PostgreSQL
- **Estilo:** Tailwind CSS 4/PostCSS + CSS global + CSS-in-JS em componentes
- **Icones:** `lucide-react`
- **Sync:** `node-cron` + `p-queue`
- **Dados externos:** TMDB API

### Estrutura principal

```txt
hades/
  prisma/
    schema.prisma
    migrations/
  public/
  src/
    app/
      api/
      browser/
      browser/[filter]/
      gamification/
      profile/
      search/
      staff/
      staff/[id]/
      titles/[id]/
      layout.tsx
      page.tsx
      globals.css
    components/
      AchievementToast.tsx
      AiringProgressCard.tsx
      ChallengeToast.tsx
      ChallengeWidget.tsx
      EpisodeGrid.tsx
      ListEditor.tsx
      MediaCard.tsx
      NextUpCard.tsx
      NotificationPanel.tsx
      PersonalGoalModal.tsx
      PersonalGoalsSection.tsx
      ProductionFilterBar.tsx
      SeasonSelector.tsx
      StatusBubble.tsx
      TvSeasonNavClient.tsx
      XPProgressBar.tsx
      XPToastHost.tsx
      StaffComponents/
    hooks/
      useXPNotification.ts
    lib/
      achievements.ts
      activity.ts
      browser-filter.ts
      challenge-generator.ts
      challenge-tracker.ts
      entry-poster-sync.ts
      gamification.ts
      level-system.ts
      next-up.ts
      notifications.ts
      personal-goals.ts
      prisma.ts
      production-status.ts
      relations-manager.ts
      seasons.ts
      series-status.ts
      staff.ts
      status-sync.ts
      tmdb-airing.ts
      tmdb-status.ts
      tmdb-sync.ts
      tmdb-titles.ts
      tmdb.ts
      utils.ts
      xp-calculator.ts
    instrumentation.ts
```

---

## Banco de Dados

### Modelos principais

O `schema.prisma` atual contem:

- `Entry`: titulo/temporada/filme salvo na lista.
- `Relation`: relacoes entre entradas e titulos TMDB.
- `Profile`: perfil principal.
- `UserGamification`: XP e nivel.
- `GamificationActivityLog`: historico de XP.
- `StreakData`: sequencia de atividade.
- `UserChallenge`: desafios ativos.
- `ChallengeCompletion`: conclusoes de desafios.
- `ActivityLog`: timeline de alteracoes de media.
- `PersonalGoal`: metas pessoais.
- `Season`: dados de temporadas.
- `Episode`: episodios.
- `SyncLog`: logs da sincronizacao TMDB.

### Campos importantes em `Entry`

```prisma
model Entry {
  id               String      @id @default(cuid())
  tmdbId           Int         @unique
  parentTmdbId     Int?
  seasonNumber     Int?
  title            String
  type             MediaType
  status           MediaStatus @default(PLANNING)
  score            Float       @default(0)
  progress         Int         @default(0)
  totalEpisodes    Int?
  totalSeasons     Int?
  episodeRuntime   Int?
  productionStatus String      @default("Released")
  lastSyncedAt     DateTime?
  hasNewEpisodes   Boolean     @default(false)
  isFavorite       Boolean     @default(false)
  favoriteRank     Int?

  seasons          Season[]
  episodes         Episode[]
  syncLogs         SyncLog[]
}
```

### Indices relevantes

- `Entry.status`
- `Entry.type`
- `Entry.tmdbId`
- `Entry.parentTmdbId`
- `Entry.productionStatus`
- `Entry.lastSyncedAt`
- `Season.status`
- `SyncLog.status`

---

## Sistema de Bolinhas de Status

### Arquivos responsaveis

- `src/components/StatusBubble.tsx`: renderiza a bolinha no canto escolhido.
- `src/lib/series-status.ts`: regra central de conversao entre status e bolinha.
- `src/lib/tmdb-status.ts`: busca snapshot ao vivo no TMDB e calcula status de temporada.
- `src/lib/status-sync.ts`: sincroniza `productionStatus` e dados de `Season` com base no snapshot ao vivo.
- `src/lib/production-status.ts`: normaliza statuses oficiais do TMDB para filmes e series.

### Regra visual atual

| Status de entrada | Bolinha | Cor | Observacao |
| --- | --- | --- | --- |
| `Airing` | Sim | `#2ecc71` | Pulsante |
| `Not Yet Aired` | Sim | `#f39c12` | Temporada ainda nao estreou |
| `Planned` | Sim | `#f39c12` | Planejado |
| `Rumored` | Sim | `#ef4444` | Filme em rumor |
| `Returning Series` | Sim | `#3db4f2` | Serie em retorno |
| `In Production` | Sim | `#a855f7` | Em producao |
| `Post Production` | Sim | `#8b5cf6` | Pos-producao |
| `Canceled`/`Cancelled` | Sim | `#6b7280` | Cancelado |
| `Pilot` | Sim | `#3b82f6` | Piloto |
| `Finished` | Nao | - | Estado normal/finalizado |
| `Ended` | Nao | - | Estado normal/finalizado |
| `Released` | Nao | - | Estado normal/finalizado |

### Como o status e escolhido

`entryStatusToBubbleStatus(entry)` segue esta prioridade:

1. Usa `entry.seasonStatus`, se existir.
2. Para `TV_SEASON`, tenta achar a temporada correspondente em `entry.seasons`.
3. Calcula status por episodios:
   - nenhum episodio exibido: `Not Yet Aired`
   - todos exibidos: `Finished`
   - parte exibida: `Airing`
4. Usa status salvo da temporada (`Season.status`) com correcao por `airDate`.
5. Cai para `productionStatusToDisplayStatus(entry.productionStatus)`.

### Snapshot ao vivo do TMDB

`getLiveBubbleStatusSnapshot(entry)` faz:

- Para series:
  - busca `/tv/{showId}`
  - busca `/tv/{showId}/season/{seasonNumber}`
  - normaliza `productionStatus`
  - calcula `bubbleStatus` a partir dos episodios
- Para filmes:
  - busca `/movie/{tmdbId}`
  - normaliza `productionStatus`
  - converte para status visual

### Uso por tela

- **Home (`src/app/page.tsx`):** usa bolinhas em cards de recentes/listas.
- **Profile (`src/app/profile/page.tsx`):** cards usam `StatusBubble` para status visual; status de watch continua separado.
- **Search (`src/app/search/page.tsx`):** resultados mostram bolinha baseada em TMDB/status calculado.
- **Titles (`src/app/titles/[id]/page.tsx`):** poster principal mostra bolinha baseada em `seasonStatus` ou `productionStatus`.
- **Browser:** `MediaCard` usa `seasonStatus ?? productionStatus`.
- **Next Up/Airing:** usam `seasonStatus ?? productionStatus`.
- **Staff roles:** mostra bolinha nos cards de obras.

---

## Sincronizacao TMDB

### Arquivos

- `src/lib/tmdb-sync.ts`
- `src/lib/seasons.ts`
- `src/lib/status-sync.ts`
- `src/lib/tmdb-status.ts`
- `src/instrumentation.ts`
- `src/app/api/sync/manual/route.ts`

### Comportamento

`syncEntryWithTmdb(entryId)`:

- busca a entrada no banco;
- valida `NEXT_PUBLIC_TMDB_API_KEY`;
- consulta TMDB de filme ou serie;
- para TV, consulta tambem a temporada;
- normaliza `productionStatus`;
- atualiza titulo, poster, banner, sinopse, datas, episodios, runtime, generos, estudio, redes, idiomas, popularidade, rating e `hasNewEpisodes`;
- chama `syncEntrySeasonEpisodes(entry.id)` para TV;
- grava `SyncLog` com `changedFields`.

`syncAllEntriesWithTmdb()`:

- busca entradas ordenadas por `lastSyncedAt` e `updatedAt`;
- usa `PQueue` com concorrencia 5;
- retorna total, sincronizadas e falhas.

Uso em tempo real/F5:

- `/api/entries` e leve por padrao: consulta o banco, inclui temporadas/episodios salvos e calcula `seasonStatus` localmente com `entryStatusToBubbleStatus()`, sem chamar TMDB.
- `/api/entries?refresh=tmdb` ainda existe para sync completo sob demanda, mas nao deve ser usado no carregamento automatico do profile porque pode ficar pesado em bibliotecas grandes.
- `/api/entry/[id]` e `/api/entry/by-slug/[slug]` executam `syncEntryWithTmdb(entry.id)` antes de responder, com fallback para dados locais se o TMDB falhar. Isso mantem `titles/[id]` atualizado ao dar F5.
- Capas customizadas fora do TMDB sao preservadas por `isCustomNonTmdbPoster()`; capas TMDB antigas podem ser substituidas pelo poster atual do TMDB.

`startTmdbSyncScheduler()`:

- evita dupla inicializacao com `globalThis.__hadesTmdbSyncStarted`;
- agenda sync a cada 6 horas: `0 */6 * * *`.

### Inicializacao

O scheduler nao e mais iniciado no `layout.tsx`. Ele roda por `src/instrumentation.ts`:

```ts
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startTmdbSyncScheduler } = await import('@/lib/tmdb-sync');
    startTmdbSyncScheduler();
  }
}
```

---

## Browser e Filtros

### Estado atual

O browser aprimorado esta implementado.

- `/browser`: renderiza secoes iniciais:
  - Trending Movies
  - Popular Movies
  - Trending Series
  - Upcoming Movies
  - Popular Series
- `/browser/[filter]`: renderiza resultados filtraveis com `ProductionFilterBar`.
- Query string aceita:
  - `type=movie` ou `type=tv`
  - `filter=All` ou lista separada por virgula, como `In%20Production,Post%20Production,Planned`

### Arquivos

- `src/app/browser/page.tsx`
- `src/app/browser/[filter]/page.tsx`
- `src/app/browser/[filter]/FilteredBrowserClient.tsx`
- `src/components/ProductionFilterBar.tsx`
- `src/lib/browser-filter.ts`
- `src/lib/production-status.ts`

### Statuses filtraveis

Filmes:

- `Rumored`
- `Planned`
- `In Production`
- `Post Production`
- `Released`
- `Canceled`

Series:

- `Planned`
- `In Production`
- `Returning Series`
- `Pilot`
- `Ended`
- `Canceled`

---

## Temporadas e Relacoes

### Temporadas

O banco suporta temporadas e episodios com os modelos `Season` e `Episode`. A UI de detalhe de titulo (`src/app/titles/[id]/page.tsx`) e a fonte principal para:

- abas de episodios;
- progresso por episodio;
- poster/titulo/sinopse da temporada;
- calculo de `seasonStatus`;
- criacao/edicao de entrada da temporada.

### ListEditor

`src/components/ListEditor.tsx` ainda mostra:

- `Season {seasonNumber}` para entradas `TV_SEASON`;
- `Episode Progress / totalEpisodes`.

Isso e esperado para o editor de lista. Nao ha mais evidencia de "season pills" residuais nos cards de listagem. O antigo Bug #3 deixa de ser bug aberto e vira apenas ponto de QA visual.

### Relacoes

Relacoes sao carregadas e exibidas em `src/app/titles/[id]/page.tsx`. O codigo combina:

- relacoes automaticas;
- relacoes manuais salvas;
- prequelas/sequels/colecoes;
- temporadas anterior/proxima para TV.

O profile apenas mostra resumo/restauracao em fluxos de backup/importacao, nao cards de relacoes como superficie principal.

---

## Gamificacao, Conquistas e Metas

### Gamificacao

Componentes e libs relevantes:

- `src/lib/gamification.ts`
- `src/lib/xp-calculator.ts`
- `src/lib/level-system.ts`
- `src/lib/challenge-generator.ts`
- `src/lib/challenge-tracker.ts`
- `src/components/XPProgressBar.tsx`
- `src/components/XPToastHost.tsx`
- `src/components/ChallengeWidget.tsx`
- `src/components/ChallengeToast.tsx`

### Conquistas

- Definidas em `src/lib/achievements.ts`.
- Toast visual em `src/components/AchievementToast.tsx`.
- O arquivo contem 100+ definicoes/entradas de conquistas.

### Metas pessoais

Arquivos:

- `src/lib/personal-goals.ts`
- `src/components/PersonalGoalsSection.tsx`
- `src/components/PersonalGoalModal.tsx`
- `src/app/api/gamification/personal-goals/route.ts`

Estado atual:

- `syncGoalProgress('main')` roda no GET da API de metas.
- Ele atualiza somente o campo `current`.
- Ele nao marca `completed`.
- A conclusao usa `markGoalComplete(id)` apenas quando a API recebe `action: 'complete'`.

Status do antigo bug de auto-conclusao:

- **Corrigido no codigo.**
- Ainda recomendado validar manualmente no app com uma meta cujo progresso real ja passou do target.

---

## Rotas de API

Principais rotas atuais:

- `/api/activity`
- `/api/activity/[id]`
- `/api/activity/export`
- `/api/activity/import`
- `/api/add-media`
- `/api/backup/full-export`
- `/api/backup/full-import`
- `/api/entries`
- `/api/entries/[id]`
- `/api/entries/import`
- `/api/entry/[id]`
- `/api/entry/by-slug/[slug]`
- `/api/gamification/award-xp`
- `/api/gamification/bootstrap-xp`
- `/api/gamification/challenges`
- `/api/gamification/personal-goals`
- `/api/gamification/reset-daily-challenges`
- `/api/gamification/user-stats`
- `/api/next-up`
- `/api/notifications`
- `/api/profile`
- `/api/profile/export`
- `/api/profile/import`
- `/api/refresh-all`
- `/api/relations`
- `/api/relations/export`
- `/api/relations/import`
- `/api/seasons/[entryId]`
- `/api/staff/[id]`
- `/api/staff/search`
- `/api/status-analysis`
- `/api/sync/manual`
- `/api/update-entry`

---

## Checklist Atualizado

### Fase 1 - Sincronizacao TMDB

- [x] Criar `src/lib/tmdb-sync.ts`
- [x] Usar fila com concorrencia 5
- [x] Criar/usar `SyncLog`
- [x] Atualizar metadados de filmes e series
- [x] Sincronizar episodios de temporada
- [x] Criar sync manual em `/api/sync/manual`
- [x] Iniciar scheduler por `src/instrumentation.ts`

### Fase 2 - Bolinhas de status

- [x] Criar `StatusBubble.tsx`
- [x] Remover dependencia de `StatusDot` visual antigo
- [x] Centralizar regra em `series-status.ts`
- [x] Criar status ao vivo em `tmdb-status.ts`
- [x] Criar sincronizacao visual em `status-sync.ts`
- [x] Nao renderizar para `Finished`, `Ended`, `Released`
- [x] Renderizar `Airing` com pulso
- [x] Integrar Home/Profile/Search/Titles/Browser/NextUp/Airing/Staff

### Fase 3 - Filtros por production status

- [x] Criar `ProductionFilterBar.tsx`
- [x] Criar `production-status.ts`
- [x] Implementar `browser-filter.ts`
- [x] Integrar filtros em `/browser/[filter]`
- [x] Suportar query string de filtros

### Fase 4 - Temporadas

- [x] Manter `Season` e `Episode` no banco
- [x] Exibir episodios na pagina de titulo
- [x] Calcular status real por episodios
- [x] Remover bolinhas/pills de temporada que poluiam cards
- [x] Manter `ListEditor` com progresso de episodio para TV

### Fase 5 - Conquistas

- [x] Expandir `achievements.ts`
- [x] Integrar toast de conquista
- [x] Manter XP, desafios e logs

### Fase 6 - Browser

- [x] `/browser` com secoes iniciais
- [x] `/browser/[filter]` dinamico
- [x] Cards com `StatusBubble`
- [x] Filtros por status de producao

### Fase 7 - Visual

- [x] Atualizar `MediaCard`
- [x] Atualizar `AiringProgressCard`
- [x] Atualizar `NextUpCard`
- [x] Adicionar overlay hover em cards principais
- [ ] QA visual em desktop/mobile
- [ ] Padronizar idioma/textos quebrados
- [ ] Avaliar extracao de estilos repetidos para CSS/module compartilhado

### Fase 8 - QA & otimizacao

- [ ] Rodar `npm run lint`
- [ ] Rodar `npm run build`
- [ ] Testar rotas principais manualmente
- [ ] Testar `StatusBubble` com exemplos reais de cada status
- [ ] Testar sync manual para uma entrada e para todas
- [ ] Validar cache/rate limit do browser
- [ ] Revisar performance das chamadas em `browser-filter.ts`
- [ ] Corrigir caracteres quebrados/mojibake remanescentes

---

## Pendencias Reais

### Alta prioridade

- **QA de build/lint:** rodar `npm run build` e `npm run lint` depois das ultimas mudancas.
- **Validacao visual das bolinhas:** garantir que cada tela mostra bolinha apenas quando deveria.
- **Dados antigos:** rodar `/api/sync/manual` ou sync geral para atualizar `productionStatus` legado.

### Media prioridade

- **Performance do browser:** `getFilteredEntriesByBrowser()` hidrata ate 30 itens e busca detalhe individual no TMDB; isso pode ficar caro.
- **Cache e revalidacao:** revisar `revalidate` e estrategia de `fetch` para reduzir chamadas externas.
- **Padronizacao visual:** alguns cards usam estilos inline/CSS-in-JS repetidos.

### Baixa prioridade

- **Idioma da interface:** ha mistura de ingles/portugues (`Browse`, `Film`, `Season`, `Episode Progress`, etc.).
- **Mojibake:** alguns textos/comentarios aparecem com caracteres quebrados em arquivos-fonte.
- **Testes automatizados:** ainda nao ha suite dedicada para status visual, filtros e sync.

---

## Como Rodar

### Variaveis

```bash
NEXT_PUBLIC_TMDB_API_KEY=your_api_key_here
NEXT_PUBLIC_TMDB_BASE_URL=https://api.themoviedb.org/3
DATABASE_URL=postgresql://user:password@localhost:5432/hades
```

### Comandos

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

### Validacao recomendada

```bash
npm run lint
npm run build
```

### Rotas para verificar manualmente

- `http://localhost:3000/`
- `http://localhost:3000/profile`
- `http://localhost:3000/search`
- `http://localhost:3000/browser`
- `http://localhost:3000/browser/trending-tv?type=tv&filter=All`
- `http://localhost:3000/browser/upcoming-movies?type=movie&filter=In%20Production,Post%20Production,Planned`
- `http://localhost:3000/gamification`

---

## Notas Importantes

1. `StatusBubble` nao decide sozinha o significado do status; ela delega para `resolveSeriesStatusDot()`.
2. `Finished`, `Ended` e `Released` sao silenciosos por design.
3. O status de watch do usuario nao deve ser confundido com status visual de exibicao/producao.
4. `StatusDot` nao deve ser reintroduzido nos cards. Se for necessario um indicador visual, usar `StatusBubble`.
5. Series devem preferir status de temporada/episodios antes do status geral da serie.
6. Filmes devem usar `productionStatus` normalizado do TMDB.
7. Metas pessoais so devem ser concluidas por acao explicita do usuario.
8. A sincronizacao automatica e iniciada por instrumentation, nao pelo layout.

---

**Versao:** 5.0
**Ultima atualizacao:** 12 de maio de 2026
**Resumo:** Fases 1, 2, 3, 4, 5 e 6 concluidas; Fase 7 parcialmente concluida; Fase 8 pendente.
