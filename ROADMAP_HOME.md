# HADES — Roadmap HOME (`app/page.tsx`)

> **Última atualização:** Maio 2026  
> **Status:** Em desenvolvimento contínuo  
> **Arquivos associados:** `src/app/page.tsx`, componentes em `src/components/`, libs em `src/lib/`

---

## 📊 Índice

1. [Análise Atual do Estado](#análise-atual-do-estado)
2. [Implementações Já Existentes](#implementações-já-existentes)
3. [Features a Implementar/Expandir](#features-a-implementarimplementarexpandir)
4. [Arquitetura Técnica](#arquitetura-técnica)
5. [Plano de Implementação](#plano-de-implementação)
6. [Recomendações Práticas](#recomendações-práticas)

---

## Análise Atual do Estado

### 🎯 O que a Home já é

A página Home (`src/app/page.tsx`) é um **Server Component assíncrono** que funciona como dashboard principal do Hades. Características atuais:

- **Arquitetura**: Server-side rendering com Suspense boundaries
- **Revalidação**: ISR com cache TMDB (3600s), RSS (3600s), changes (1800s)
- **Padrão de layout**: Grid 2 colunas — conteúdo principal (esq) + side panel (dir)
- **Componentes renderizados**: `AiringProgressCard`, `NextUpCard`, `ChallengeWidget`, `StatusBubble`, `ReleaseCalendar`, `SpinTheWheel`, `WeeklyStats`, `AchievementShowcase`

### ✅ O que já funciona

#### 1.1 **Sessão de Hoje** (JÁ IMPLEMENTADO)
- Componente: `src/components/TodaySession.tsx`
- Fluxo: Busca próximo episódio (`getNextUpItems`) + stats de gamificação (`getGamificationStats`)
- Dados: `/api/next-up` + `UserGamification` + streak do usuário
- Renderização: Card destacado com título + episódio + incentivo contextual
- **Status**: ✅ Ativo e funcional

#### 1.2 **Roleta do Destino** (JÁ IMPLEMENTADO)
- Componente: `src/components/SpinTheWheel.tsx`
- Fluxo: Busca entries com `status: PLANNING` → seleciona aleatoriamente
- Dados: `Entry[]` filtrados por status
- Renderização: Card com poster, sinopse, botão de ação
- **Posicionamento**: Recomendação do roadmap: mover para baixo de "Series & Films List" ✓
- **Status**: ✅ Ativo, apenas ajuste de posição no layout

#### 1.3 **Newly Added — Expansão Robusto** (PARCIALMENTE IMPLEMENTADO)
- Componente: Renderizado via `MediaCard` + grid no Home
- Dados: TMDB `/movie/changes` + `/tv/changes` (últimas 10 modificações)
- Atual: Pega últimos títulos adicionados ao TMDB
- **Limitações atuais**:
  - Exibe até ~6-8 itens antes de quebra de linha
  - Filtra apenas novos + séries/filmes
  - Poderia aceitar mais (até 12-20 itens com scroll)
- **Recomendação**: Ampliar para 12-20 itens com paginação horizontal

#### 1.4 **Calendário de Lançamentos** (JÁ IMPLEMENTADO)
- Componente: `src/components/ReleaseCalendar.tsx`
- Dados: Próximos 7 dias de episódios das séries em `WATCHING`
- Fluxo: Busca todas as entries com `status: WATCHING` + chama TMDB para próximos episódios
- Renderização: Grid horizontal com badges por série, horários e status
- **Performance**: Deve estar cacheada para não fazer 1000 chamadas TMDB
- **Status**: ✅ Ativo

#### 1.5 **Vitrine de Conquistas Recentes** (JÁ IMPLEMENTADO)
- Componente: `src/components/AchievementShowcase.tsx`
- Dados: `GamificationActivityLog` + `badges[]` do `UserGamification`
- Renderização: Carrossel compacto com últimos badges + XP
- Integração: Usa `src/lib/achievements.ts` para regras
- **Status**: ✅ Ativo

#### 1.6 **Números da Semana (Weekly Stats)** (JÁ IMPLEMENTADO)
- Componente: `src/components/WeeklyStats.tsx`
- Dados: `ActivityLog` últimos 7 dias + comparação período anterior
- Lib: `src/lib/weekly-stats.ts` para cálculos
- Renderização: 4 métricas principais (episódios, filmes, horas, XP)
- Comparação: "↑ 3 ep a mais que semana passada"
- **Status**: ✅ Ativo

#### 1.7 **Notícias em PT-BR** (PARCIALMENTE IMPLEMENTADO)
- Dados: 3 fontes RSS (Deadline, Variety, Hollywood Reporter)
- Filtro: Keywords movie/film/series/tv/episode
- Limite: Até 3 notícias/fonte (recomendação: expandir para 20 total em PT-BR)
- **Recomendação**: Implementar agregador em `src/lib/news-aggregator.ts` com cache TTL
- **Status**: ⏳ Funcionando mas pode melhorar

#### 1.8 **Trending This Week** (JÁ IMPLEMENTADO)
- Dados: TMDB `/trending/tv/week`
- Renderização: Cards com próximos episódios e status
- **Status**: ✅ Ativo

#### 1.9 **Next Up / Recomendações** (JÁ IMPLEMENTADO via TodaySession)
- Componente: `src/components/NextUpCard.tsx`
- Dados: Lógica de `src/lib/next-up.ts`
- Status: ✅ Integrado na "Sessão de Hoje"

#### 1.10 **Side Panel — Favoritos & Recently Updated** (JÁ IMPLEMENTADO)
- Dados: Entries com `isFavorite: true` + ordenação por `favoriteRank`
- Renderização: Grid 2 colunas (ou 3/5 responsivo)
- **Status**: ✅ Ativo

---

## Implementações Já Existentes

### Componentes Disponíveis

| Componente | Caminho | Propósito | Status |
|---|---|---|---|
| `TodaySession` | `src/components/TodaySession.tsx` | Sessão de hoje / O que assistir | ✅ |
| `ReleaseCalendar` | `src/components/ReleaseCalendar.tsx` | Calendário 7 dias próximas estreias | ✅ |
| `SpinTheWheel` | `src/components/SpinTheWheel.tsx` | Roleta de títulos PLANNING | ✅ |
| `WeeklyStats` | `src/components/WeeklyStats.tsx` | Stats semanais com comparação | ✅ |
| `AchievementShowcase` | `src/components/AchievementShowcase.tsx` | Carrossel de conquistas recentes | ✅ |
| `AiringProgressCard` | `src/components/AiringProgressCard.tsx` | Cards de série em andamento | ✅ |
| `ChallengeWidget` | `src/components/ChallengeWidget.tsx` | Desafios em destaque | ✅ |
| `MediaCard` | `src/components/MediaCard.tsx` | Card genérico título (poster, título, info) | ✅ |

### Libs Utilizadas

| Lib | Caminho | Responsabilidade | Última atualização |
|---|---|---|---|
| `next-up` | `src/lib/next-up.ts` | Lógica de próximo episódio + recommender | ✅ |
| `gamification` | `src/lib/gamification.ts` | Cálculos de XP, streak, badges | ✅ |
| `weekly-stats` | `src/lib/weekly-stats.ts` | Agregação de stats por semana | ✅ |
| `activity` | `src/lib/activity.ts` | Log de atividade + filtros | ✅ |
| `achievements` | `src/lib/achievements.ts` | Regras de achievements | ✅ |
| `tmdb-airing` | `src/lib/tmdb-airing.ts` | TMDB air dates + próximos episódios | ✅ |
| `tmdb-titles` | `src/lib/tmdb-titles.ts` | TMDB search + detalhes | ✅ |

### APIs Disponíveis

| Rota | Método | Propósito |
|---|---|---|
| `/api/next-up` | GET | Retorna próximos episódios + recomendações |
| `/api/gamification/user-stats` | GET | Stats de XP, streak, badges do usuário |
| `/api/activity` | GET | Logs de atividade filtrados |
| `/api/entries?status=WATCHING` | GET | Todas as entries com filtro |

---

## Features a Implementar/Expandir

### 📌 Prioridade 1: Manutenção & Polimento

#### Feature 1.1: Notícias em PT-BR (20 itens)
**Problema**: Apenas 3 fontes RSS em inglês, limite de 3 notícias/fonte = 9 notícias total, focadas em críticas, não anúncios.

**Solução recomendada**:
```
Criar: src/lib/news-aggregator.ts
├─ Fonte 1: https://www.omelete.com.br/ (RSS feed)
├─ Fonte 2: https://www.adorocinema.com/ (RSS ou scrape)
├─ Fonte 3: https://cinepop.com.br/ (RSS)
├─ Fonte 4: https://www.tecmundo.com.br/minha-serie
├─ Fonte 5: https://x.com/SeriesTWBZ (Twitter API)
└─ Fonte 6: https://x.com/tuaseriebr (Twitter API)

Filtro: Apenas anúncios (continuações, renovações, cancelamentos)
Cache: TTL 3600s (cache local ou Redis)
Total: 20 notícias máximo
```

**Implementação**:
1. Criar `src/lib/news-aggregator.ts` com funções:
   - `fetchNewsFromSources()` — fetch paralelo de todas as 6 fontes
   - `parseAndNormalize()` — converte diferentes formatos para `NewsItem[]`
   - `filterByKeywords()` — apenas "renewal", "cancel", "season", "announced", etc.
   - `sortByDate()` + limita a 20 itens

2. Criar API route `src/app/api/news/route.ts`:
   ```typescript
   export async function GET() {
     const news = await fetchNewsFromSources();
     return NextResponse.json(news, { 
       headers: { 'Cache-Control': 'public, s-maxage=3600' } 
     });
   }
   ```

3. No Home (`src/app/page.tsx`):
   ```typescript
   const news = await fetch('/api/news').then(r => r.json());
   // Renderizar até 20 itens
   ```

**Estimativa**: 2-3 horas

---

#### Feature 1.2: Newly Added — Expansão de 8 para 20 itens com scroll
**Problema**: Atualmente exibe ~6-8 itens, quebra a linha.

**Solução recomendada**:
1. Ampliar fetch de changes: de `limit=10` para `limit=50` em ambos endpoints (`/movie/changes` + `/tv/changes`)
2. Adicionar scroll horizontal com overflow visível:
   ```typescript
   <div className="newly-added-carousel" style={{ overflowX: 'auto', scrollBehavior: 'smooth' }}>
     {newlyAddedItems.slice(0, 20).map(item => (
       <MediaCard key={item.id} item={item} />
     ))}
   </div>
   ```
3. Adicionar CSS para scrollbar customizada (estilo Hades)

**Estimativa**: 1-2 horas

---

### 📌 Prioridade 2: Novas Features (Médio Prazo)

#### Feature 2.1: Seção "Seu Gênero Favorito da Semana"
**Objetivo**: Mostrar qual gênero o usuário mais consumiu na semana.

**Dados necessários**:
- `ActivityLog[]` últimos 7 dias
- Para cada entry, pegar `genres` da tabela `Entry`
- Contar frequência e retornar top 3 gêneros + % consumido

**Implementação**:
1. Estender `src/lib/weekly-stats.ts`:
   ```typescript
   export async function getTopGenresThisWeek() {
     const logs = await getActivityLogLastNDays(7);
     const entries = await prisma.entry.findMany({ 
       where: { id: { in: logs.map(l => l.entryId) } }
     });
     // Agregar e contar gêneros...
     return topGenres; // [{ genre: 'Drama', count: 5, percentage: 45 }, ...]
   }
   ```

2. Criar componente `src/components/FavoriteGenreCard.tsx`:
   ```typescript
   export default function FavoriteGenreCard({ genres }) {
     return (
       <section className="favorite-genre-card">
         <h3>Seu Gênero da Semana</h3>
         {genres.map(g => (
           <div key={g.genre}>
             <span>{g.genre}</span>
             <div className="progress-bar" style={{width: `${g.percentage}%`}} />
           </div>
         ))}
       </section>
     );
   }
   ```

3. Adicionar ao Home abaixo de "Weekly Stats"

**Estimativa**: 2 horas

---

#### Feature 2.2: "Continue Watching" — Cards de Série em Progresso com Badge de Episódio Atual
**Objetivo**: Mostrar quais séries estão em andamento COM o episódio atual destacado.

**Dados necessários**:
- Entries com `status: WATCHING` + `progress` (episódio atual)
- Para cada série, buscar episódio atual no TMDB e exibir thumbnail + nome

**Implementação**:
1. Estender `src/components/AiringProgressCard.tsx` para incluir episódio atual visual
2. Ou criar componente `src/components/ContinueWatchingCard.tsx` separado
3. Adicionar ao Home em posição de destaque (top, logo após TodaySession)

**Estimativa**: 3 horas

---

#### Feature 2.3: "Mini-Reviews" — Últimos Comentários/Notas Adicionadas
**Objetivo**: Mostrar um carrossel com as últimas notas que o usuário adicionou a títulos.

**Dados necessários**:
- `Entry[]` onde `notes` NOT NULL, ordenado por `updatedAt DESC`, limitado a últimos 10

**Implementação**:
1. Criar componente `src/components/RecentNotes.tsx`
2. Exibir cards pequenos com: poster, título, trecho da nota (truncado a 100 chars), data
3. Ao clicar, navegar para `title/[id]`

**Estimativa**: 2 horas

---

### 📌 Prioridade 3: Futuro (Nice-to-have)

#### Feature 3.1: "Milestone Alert" — Quando o usuário atinge 100 episódios, 50 filmes, etc.
- Renderizar toasty com confete CSS + som (opcional)
- Armazenar milestone em `UserGamification.milestones` (JSON array)
- Não mostrar novamente o mesmo milestone

**Estimativa**: 4 horas

---

#### Feature 3.2: "Previsão de Fim" — Quando você termina a série atual (by velocity)
- Calcular: `(completedEpisodes / daysWatching) = velocity`
- Multiplicar pela `remainingEpisodes` para estimar data de conclusão
- Exibir: "Em ritmo, você termina em X dias"

**Estimativa**: 3 horas

---

#### Feature 3.3: "Curadoria Temática Semanal" — Seção "Por que não..." de títulos aleatórios relevantes
- Buscar trending + próximos lançamentos
- Filtra por: gêneros favoritos do usuário + que NÃO estão na lista
- Exibir 3-4 cards com "Que tal ver..."

**Estimativa**: 4 horas

---

## Arquitetura Técnica

### 📐 Layout Grid Atual

```
┌──────────────────────────────┐
│     HEADER / TITLE           │
├─────────────────────┬────────┤
│                     │        │
│  MAIN CONTENT       │ SIDE   │
│                     │ PANEL  │
│  • Today Session    │ • Fav  │
│  • Trending         │ • Next │
│  • News (20)        │ • Mgmt │
│  • Calendar         │        │
│  • Newly Added      │        │
│  • Spin Wheel       │        │
│  • Weekly Stats     │        │
│  • Achievements     │        │
│                     │        │
└─────────────────────┴────────┘
```

**Grid CSS**:
```css
display: grid;
grid-template-columns: 1fr 300px;
gap: 32px;

/* Mobile breakpoint */
@media (max-width: 1024px) {
  grid-template-columns: 1fr;
  gap: 20px;
}
```

### 🔄 Fluxo de Dados (SSR)

```
HomePage (async)
├─ getHomeData()
│  ├─ prisma.entry.findMany({ status: WATCHING })
│  ├─ fetch TMDB trending
│  ├─ fetch RSS news
│  ├─ fetch weekly stats
│  ├─ fetch gamification stats
│  └─ apply poster choices (sistema global)
└─ Render → HTML (Suspense + Skeleton loaders)
```

### 🚀 Performance Atual

| Métrica | Valor | Cache |
|---|---|---|
| Home render | ~2-3s | ISR 1800s |
| TMDB API calls | ~5-8 chamadas | 3600s |
| RSS fetch | ~1s | 3600s |
| DB queries | ~3-4 queries | None (live) |
| TTL total | ~1.8MB | 1800s revalidate |

**Recomendação**: Aplicar `Promise.all()` para parallelizar fetches não-dependentes.

---

## Plano de Implementação

### 🗓 Sugestão de Sequência

**Sprint 1 (Semana 1)** — Manutenção & Fixes
- [ ] Expandir Newly Added de 8 para 20 itens com scroll
- [ ] Mover Roleta do Destino para baixo da Section
- [ ] Otimizar TMDB calls em `getHomeData()` (Promise.all)

**Sprint 2 (Semana 2)** — Notícias Expandidas
- [ ] Implementar `news-aggregator.ts` com 6 fontes PT-BR
- [ ] Expandir de 9 para 20 notícias
- [ ] Adicionar filtro por categoria (anúncios, reviews, etc.)

**Sprint 3 (Semana 3-4)** — Novas Features
- [ ] Adicionar "Seu Gênero da Semana"
- [ ] Expandir "Continue Watching" com episódio visual
- [ ] Adicionar "Mini-Reviews" carrossel

**Sprint 4+ (Futuro)**
- Milestones
- Previsão de fim
- Curadoria temática

---

## Recomendações Práticas

### ✅ O que fazer

1. **Paralelizar fetches** — Use `Promise.all()` no `getHomeData()` para não serializar:
   ```typescript
   const [trending, news, stats, entries] = await Promise.all([
     fetchTrendingFromTmdb(),
     fetchNewsAggregated(),
     getWeeklyStats(),
     prisma.entry.findMany({ status: 'WATCHING' })
   ]);
   ```

2. **Manter Suspense boundaries** — Cada seção deve ter seu próprio `<Suspense>` para não bloquear render do resto

3. **Cache consciente** — Usar `unstable_cache()` do Next.js para cache granular:
   ```typescript
   const getCachedNews = unstable_cache(
     () => fetchNewsAggregated(),
     ['home-news'],
     { revalidate: 3600, tags: ['news'] }
   );
   ```

4. **Testar responsivo** — Todas as novas features devem funcionar em:
   - Desktop (1920px)
   - Tablet (768px)
   - Mobile (375px)

### ⚠️ O que evitar

1. **NÃO fazer fetches sequenciais** — Usar Promise.all() sempre que possível
2. **NÃO renderizar >100 items sem virtualização** — Se adicionar 20 notícias, considerar scroll virtual
3. **NÃO fazer cache muito agressivo** — 1800-3600s é o sweet spot para home
4. **NÃO adicionar muitos Suspense boundaries** — Máximo 3-4 por página

### 🎯 Checkpoints de Qualidade

Antes de fazer deploy de qualquer feature:

- [ ] Performance: Home carrega em <3s (Lighthouse)
- [ ] Responsividade: Desktop + Tablet + Mobile testados
- [ ] Acessibilidade: Links, buttons, labels corretos
- [ ] Cache: TTL apropriado definido
- [ ] Erro handling: Fallbacks para falhas de API
- [ ] Visual: Alinhado com design Hades (cores, espaçamento, tipografia)

---

## Arquivos a Criar/Modificar

| Arquivo | Ação | Prioridade |
|---|---|---|
| `src/lib/news-aggregator.ts` | Criar | P1 |
| `src/app/api/news/route.ts` | Criar | P1 |
| `src/app/page.tsx` | Modificar | P1 |
| `src/components/FavoriteGenreCard.tsx` | Criar | P2 |
| `src/components/RecentNotes.tsx` | Criar | P2 |
| `src/components/ContinueWatchingCard.tsx` | Modificar | P2 |

---

## Referências

- TMDB API Docs: https://developer.themoviedb.org/docs/getting-started
- Next.js ISR: https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration
- Prisma Queries: https://www.prisma.io/docs/orm/reference/prisma-client-reference
- Componentes Hades: `src/components/`
- Database Schema: `prisma/schema.prisma`
