# 🔧 HADES - Correções, Features e Melhorias Pendentes

> **📌 Instruções para IA / Desenvolvedor**
> - Leia todo o contexto antes de começar.
> - Siga os critérios de aceitação de cada tarefa.
> - Se algo não estiver claro, peça mais informações antes de alterar.
> - Prefira soluções que não quebrem compatibilidade retroativa.
> - Faça commits por tarefa, com mensagens descritivas.
> - Antes de iniciar qualquer tarefa, verifique dependências entre elas.
> - **Análise de referência:** `ANALISE_CONEXOES.md` (28/04/2026)

---

## 🏷️ Prioridades

| Nível | Descrição |
|-------|-----------|
| **P1** | Crítico — impede funcionalidade principal, deve ser resolvido imediatamente |
| **P2** | Importante — melhoria significativa, sem blocker, próxima sprint |
| **P3** | Nice-to-have — refatoração, performance, qualidade de código |

---

## 🗺️ Mapa de Arquivos do Projeto

```
src/
├── app/
│   ├── page.tsx                          ← Home (SSR com Suspense)
│   ├── layout.tsx                        ← Root layout com navbar
│   ├── profile/page.tsx                  ← Perfil + listas do usuário
│   ├── search/page.tsx                   ← Busca, filtros e seções
│   ├── titles/[id]/page.tsx              ← Detalhe de título + relações
│   └── api/
│       ├── add-media/route.ts            ← POST criar entry
│       ├── entries/route.ts              ← GET todas entries
│       ├── entries/[id]/route.ts         ← PATCH/DELETE entry específica
│       ├── entry/[id]/route.ts           ← GET por slug
│       ├── entry/by-slug/[slug]/route.ts ← GET por slug custom
│       ├── notifications/route.ts        ← GET notificações [NOVO]
│       ├── profile/route.ts              ← GET/PATCH perfil
│       ├── relations/route.ts            ← GET/POST/DELETE/PATCH relações
│       ├── update-entry/route.ts         ← POST atualizar (com customImage)
│       └── refresh-all/route.ts          ← POST sincronizar todos dados
├── components/
│   ├── ListEditor.tsx                    ← Modal de edição (usado em 2 páginas)
│   └── NotificationPanel.tsx            ← Painel de notificações [NOVO]
└── lib/
    ├── prisma.ts                         ← Cliente Prisma singleton
    ├── tmdb.ts                           ← Fetching com retry automático
    ├── tmdb-titles.ts                    ← Busca especializada de títulos
    ├── tmdb-airing.ts                    ← Status de episódios
    ├── notifications.ts                  ← Lógica de notificações [NOVO]
    ├── relations-manager.ts              ← Gerenciamento de relações
    └── utils.ts                          ← Helpers: getOrdinal, buildSeasonTitle, formatScore
```

---

## 🐛 BUGS ATIVOS — P1 (CRÍTICOS)

---

### 🔴 P1 · #1 — profile/page.tsx: reload ao voltar da página (comportamento de F5)

- **Prioridade:** P1 — CRÍTICO
- **Arquivo:** `src/app/profile/page.tsx`
- **Estimativa:** 1–2h

#### Descrição

Ao sair da página `/profile` para qualquer outra rota (ex: `/search`) e depois voltar, o perfil recarrega completamente como se um F5 tivesse sido disparado. Isso causa perda de estado local, animações reiniciadas e uma experiência de navegação brusca. O problema não ocorre em outras páginas (ex: `/search`, `/titles`).

#### Causa Provável

Uso de `useEffect` com dependência que força recarga desnecessária, como um `visibilitychange` ou `focus` que chama `load()` sem verificar se os dados realmente mudaram. Também pode ser efeito colateral do `router.push` com `reload` implícito.

#### Solução Esperada

Remover ou modificar o listener de visibilidade/foco que recarrega os dados ao reentrar na página. Em vez disso, confiar apenas no carregamento inicial e em atualizações via API quando houver mudanças concretas (ex: salvar uma entrada). Manter o estado `entries` para evitar refetch desnecessário.

#### Critério de Aceitação

- [ ] Navegar para outra página e voltar ao perfil **não** deve disparar nenhum `fetch('/api/entries')` ou `fetch('/api/profile')` a menos que os dados tenham sido explicitamente modificados em outra aba.

---

### 🔴 P1 · #2 — profile/page.tsx: Recent Activity desaparece após F5 ou saída da página

- **Prioridade:** P1 — CRÍTICO
- **Arquivo:** `src/app/profile/page.tsx`
- **Estimativa:** 2–4h

#### Descrição

A aba "Recent Activity" (dentro do Overview) perde todas as entradas ao recarregar a página (F5) ou ao sair e voltar para o perfil. As atividades que foram geradas durante a sessão somem como se nunca tivessem sido registradas. O problema não afeta outras partes do perfil (listas, favoritos, estatísticas).

#### Causa Provável

O `activityLog` é mantido apenas em memória (`useState`) e não é persistido em `localStorage` ou no banco de dados. Ao recarregar a página, o estado é reiniciado, e nenhuma atividade é carregada de uma fonte persistente.

#### Solução Esperada

1. Persistir `activityLog` no `localStorage` a cada atualização e recarregar do `localStorage` na inicialização.
2. (Alternativa mais robusta) Criar uma tabela `Activity` no banco de dados e gravar cada ação (via API) para que as atividades persistam entre sessões e dispositivos.
3. Verificar o código mais antigo salvo no GitHub para resgatar a implementação original que já persistia as atividades corretamente (se existia).

#### Critério de Aceitação

- [ ] Após F5, as atividades geradas antes do recarregamento continuam visíveis.
- [ ] Sair do perfil e voltar mantém as atividades da sessão anterior.
- [ ] Atividades não somem mais ao navegar entre abas/rotas.

---

### 🔴 P1 · #3 — profile/page.tsx: label "Watched" deve exibir somente contagem (0/1 ou 1)

- **Prioridade:** P1 — CRÍTICO
- **Arquivo:** `src/app/profile/page.tsx`
- **Estimativa:** 30min

#### Descrição

Nos cards ou na listagem do profile, o label "Watched" deve ser substituído por uma exibição numérica simples: `0` se o título ainda não foi completado, `1` se foi. Sem texto "Watched", apenas o número.

#### Solução Esperada

```typescript
// ANTES:
<span>{entry.status === 'COMPLETED' ? 'Watched' : 'Not Watched'}</span>

// DEPOIS:
<span style={{ fontVariantNumeric: 'tabular-nums' }}>
  {entry.status === 'COMPLETED' ? '1' : '0'}
</span>
```

Para filmes (type: MOVIE), o valor máximo é sempre `1`. Para séries, pode-se manter `episodesWatched/totalEpisodes` ou simplificar para `0/1` baseado no status da temporada.

#### Critério de Aceitação

- [ ] Label "Watched" não aparece mais nos cards do profile.
- [ ] Filmes completados exibem `1`; os demais exibem `0/1`.
- [ ] Sem quebra de layout nos cards.

---

## ✨ FEATURES NOVAS

---

### 🚀 FEAT · #F1 — app/page.tsx: Seção "In Progress" na sidebar

- **Prioridade:** P2
- **Arquivo:** `src/app/page.tsx`
- **Estimativa:** 2–3h

#### Descrição

Adicionar uma nova seção na coluna direita da Home, abaixo de "Airing Now", chamada **"In Progress"**. Ela deve listar tanto **filmes** quanto **séries** que o usuário está atualmente assistindo (status `WATCHING`).

#### Ideia de Implementação

```typescript
// getHomeData() — buscar entries WATCHING de qualquer tipo
const inProgress = await prisma.entry.findMany({
  where: { status: 'WATCHING' },
  orderBy: { updatedAt: 'desc' },
  take: 6,
});
```

O card deve exibir:
- Poster do título
- Título
- Progresso atual: para séries `Ep X/Total`, para filmes uma barra de progresso (se houver minutagem registrada) ou apenas o ícone de "em andamento"
- Badge de tipo: 🎬 Filme ou 📺 Série

Layout: grid 2 colunas, igual ao "Airing Now", com o mesmo visual de `airing-card`.

#### Critério de Aceitação

- [ ] Seção "In Progress" aparece abaixo de "Airing Now" na sidebar direita.
- [ ] Lista filmes e séries com status WATCHING.
- [ ] Exibe progresso quando disponível.
- [ ] Máximo de 6 itens, ordenados por `updatedAt` decrescente.
- [ ] Link funcional para `/titles/[slug]`.

---

### 🚀 FEAT · #F2 — app/layout.tsx: Ícone de notificações (sino) com painel

- **Prioridade:** P2
- **Arquivos:** `src/app/layout.tsx`, `src/components/NotificationPanel.tsx` (novo), `src/app/api/notifications/route.ts` (novo), `src/lib/notifications.ts` (novo)
- **Estimativa:** 6–10h

#### Descrição

Adicionar na navbar, ao lado do ícone de perfil, um **ícone de sino** que ao ser clicado abre um painel lateral/dropdown de notificações. As notificações são geradas automaticamente consultando a API do TMDB com base na biblioteca do usuário.

#### Tipos de Notificação

**Tipo 1 — Novo episódio de série que estou assistindo:**
```
🎬 Episódio 5 de "The Bear" saiu!
```
- Condição: entry com `status = WATCHING` e `type = TV_SEASON`; TMDB retorna `next_episode_to_air` com `air_date <= hoje`

**Tipo 2 — Estreia de filme ou temporada na minha lista:**
```
🎉 "Dune: Part Three" estreiou hoje!
```
- Condição: entry com `status = PLAN_TO_WATCH`; `release_date` ou `first_air_date` == hoje

**Tipo 3 — Novo título relacionado adicionado ao TMDB:**
```
✨ "Severance Season 3" foi recém adicionado ao site!
```
- Condição: qualquer título nas listas do usuário tem um `similar` ou `recommendation` no TMDB que foi adicionado/descoberto recentemente (verificar via `/movie/changes` ou `/tv/changes`)

#### Arquitetura Sugerida

```typescript
// src/lib/notifications.ts
export interface Notification {
  id: string;
  type: 'NEW_EPISODE' | 'PREMIERE' | 'RELATED_ADDED';
  title: string;
  message: string;
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  createdAt: string;
  read: boolean;
  slug: string;
}

export async function generateNotifications(userId: string): Promise<Notification[]>
```

```typescript
// src/app/api/notifications/route.ts
// GET — retorna notificações não lidas
// POST — marca como lida ({ id })
```

```typescript
// src/components/NotificationPanel.tsx
// Dropdown com lista de Notification[]
// Badge vermelho no sino com contagem de não lidas
// Cada notificação clicável leva ao título
// Botão "Mark all as read"
```

#### Estratégia de Cache

As notificações devem ser **geradas no servidor** e cacheadas por 30–60 minutos (`revalidate: 1800`) para não sobrecarregar a API do TMDB a cada clique.

#### Critério de Aceitação

- [ ] Ícone de sino aparece na navbar ao lado do perfil.
- [ ] Badge vermelho com contagem de não lidas aparece quando há notificações.
- [ ] Ao clicar, abre painel com lista de notificações.
- [ ] Notificação de novo episódio aparece quando série WATCHING tem episódio recente.
- [ ] Notificação de estreia aparece quando título da lista estreia hoje.
- [ ] Notificação de relacionado aparece quando novo título semelhante é adicionado ao TMDB.
- [ ] Clicar numa notificação navega para o título correto.
- [ ] "Mark all as read" limpa o badge.
- [ ] Painel fecha ao clicar fora.

---

### 🚀 FEAT · #F3 — search/page.tsx: Filtros avançados estilo AniList

- **Prioridade:** P2
- **Arquivo:** `src/app/search/page.tsx`
- **Estimativa:** 4–6h

#### Descrição

Expandir o sistema de filtros da busca para ser muito mais robusto e granular, inspirado na interface de filtros do AniList Browser. Os filtros devem ser combinados (AND) e aplicados em tempo real ou via botão "Apply".

#### Novos Filtros a Adicionar

| Filtro | Tipo | Fonte |
|--------|------|-------|
| Gênero | Multi-select (chips) | TMDB `/genre/movie/list` e `/genre/tv/list` |
| Ano de lançamento | Range slider (ex: 1990–2024) | Campo `release_date` / `first_air_date` |
| Score mínimo | Slider (0–10) | Campo `vote_average` |
| Status | Select (Em andamento / Finalizada / Cancelada) | Campo `status` TMDB |
| Número de temporadas | Range (mín/máx) | Campo `number_of_seasons` |
| Duração do episódio | Range em minutos | Campo `episode_run_time` |
| País de origem | Select com busca | Campo `origin_country` |
| Idioma original | Select com busca | Campo `original_language` |
| Plataforma de streaming | Multi-select | TMDB `/watch/providers` |
| Ordenação | Select (Popularidade, Score, Data, A-Z) | `sort_by` no `/discover` |
| Formato (apenas filmes) | Select (Feature Film / Short / Documentary) | — |

#### Layout Sugerido (estilo AniList)

```
[Gênero: Action, Drama ×]  [Ano: 2015–2024]  [Score: ≥7.5]  [Status: Returning]
[Plataforma: Netflix, HBO]  [País: US, JP]  [Ordenar por: Popularidade ▼]
                                                              [Clear Filters] [Apply]
```

Filtros selecionados aparecem como **chips removíveis** no topo, com botão "Clear All".

#### Integração com `/discover`

Ao aplicar filtros, substituir a busca textual pelo endpoint `/discover/movie` ou `/discover/tv` com os parâmetros correspondentes:

```typescript
const params = new URLSearchParams({
  api_key: apiKey,
  sort_by: sortBy,
  'vote_average.gte': minScore,
  'first_air_date.gte': `${yearMin}-01-01`,
  'first_air_date.lte': `${yearMax}-12-31`,
  with_genres: selectedGenres.join(','),
  with_watch_providers: selectedProviders.join('|'),
  watch_region: 'US',
  // ...
});
```

#### Critério de Aceitação

- [ ] Painel de filtros expandível (não ocupa espaço quando fechado).
- [ ] Multi-select de gêneros com chips visuais.
- [ ] Range de ano funcional.
- [ ] Filtro de score mínimo funcional.
- [ ] Filtros combinados funcionam corretamente via `/discover`.
- [ ] Chips de filtros ativos aparecem no topo com botão de remoção individual.
- [ ] "Clear All" remove todos os filtros.
- [ ] Sem regressão na busca textual simples.

---

## 🎨 MELHORIAS DE DESIGN

---

### 🎨 DESIGN · #D1 — profile/page.tsx: Redesign de Favoritos, Overview, Stats e Tabs

- **Prioridade:** P2
- **Arquivo:** `src/app/profile/page.tsx`
- **Estimativa:** 6–10h

> ⚠️ **Preservar sem alteração:** cards das listas (SeriesList, FilmList), banner do perfil, avatar/ícone do usuário. Alterar apenas as partes descritas abaixo.

---

#### D1.1 — Tabs de Navegação (Overview / Series List / Film List / Favourites / Stats)

**Objetivo:** Visual mais grego/elegante, com rosa como cor ativa.

```css
/* Tab ativa */
.profile-tab.active {
  color: rgb(232, 105, 144);               /* rosa já usado no projeto */
  border-bottom: 2px solid rgb(232, 105, 144);
  text-shadow: 0 0 12px rgba(232,105,144,0.4);
}

/* Tab inativa */
.profile-tab {
  color: rgba(220,210,215,0.5);
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  font-size: 12px;
  font-weight: 700;
}
```

Adicionar uma linha horizontal fina abaixo das tabs com gradiente `rgba(232,105,144,0.15)`.

---

#### D1.2 — Seção Overview: Estatísticas Rápidas

**Objetivo:** Cards de estatística animados com números que "contam" ao entrar na tela (CountUp animation).

Layout sugerido: 4 cards em linha horizontal
```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   142        │ │   38         │ │   7.4        │ │   320h       │
│  Titles      │ │  Completed   │ │  Avg Score   │ │  Watch Time  │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

```typescript
// Animação CountUp
function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = value / 40;
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(Math.floor(start));
    }, 20);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{display}</span>;
}
```

Cards com borda sutil rosa (`border: 1px solid rgba(232,105,144,0.15)`) e micro-glow no hover.

---

#### D1.3 — Seção Favourites

**Objetivo:** Grid de posters com animação de entrada em cascata (stagger) e hover elegante.

- Layout: grid de 6 colunas (igual a outras seções do projeto)
- Cada card tem animação `fadeInUp` com delay escalonado:

```css
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

.fav-card:nth-child(1) { animation: fadeInUp 0.4s ease 0.05s both; }
.fav-card:nth-child(2) { animation: fadeInUp 0.4s ease 0.10s both; }
/* ... até nth-child(6) com delay 0.30s */
```

- Hover: `transform: scale(1.04)` + `box-shadow: 0 8px 24px rgba(232,105,144,0.2)` + overlay com ícone de coração rosa
- Borda arredondada: `border-radius: 10px`
- Remoção de favorito: botão de coração no hover com confirmação discreta

---

#### D1.4 — Seção Stats: Redesign completo com animações

**Objetivo:** Aba de estatísticas visualmente deslumbrante com gráficos animados e estética elegante.

**Componentes a incluir:**

**a) Gráfico de Distribuição de Scores (barras verticais animadas):**
```
Score:  1  2  3  4  5  6  7  8  9  10
Bars:   ▁  ▁  ▂  ▃  ▅  ▇  █  ▇  ▅  ▂
```
Barras crescem de baixo para cima com `scaleY` animation ao entrar na tela.
Cor: gradiente rosa `rgb(232,105,144)` → `rgb(180,70,110)`.

**b) Gêneros mais assistidos (barras horizontais animadas):**
```
Action    ████████████████░░░░  80%
Drama     ████████████░░░░░░░░  60%
Sci-Fi    ████████░░░░░░░░░░░░  40%
```
Barras preenchem da esquerda para direita com `scaleX` animation.

**c) Atividade por mês (mini heatmap ou barras):**
Grid de 12 meses com intensidade de cor baseada em títulos adicionados/completados.

**d) Cards de recordes pessoais:**
```
┌──────────────────────┐  ┌──────────────────────┐
│ 🏆 Highest Rated     │  │ 📅 Most Active Month  │
│ The Wire — 10/10     │  │ March 2024 — 12 titles│
└──────────────────────┘  └──────────────────────┘
```

**Estilo geral da aba Stats:**
- Background de cada card: `rgb(48,44,44)` com borda `rgba(232,105,144,0.12)`
- Títulos de seção: uppercase, `letter-spacing: 0.1em`, cor rosa
- Número destacados: fonte maior, peso 800, cor `rgb(220,210,215)`
- Separadores entre seções: linha com gradiente rosa

#### Critério de Aceitação (D1 geral)

- [ ] Tabs com visual grego/elegante; rosa como cor ativa.
- [ ] Stats rápidos na Overview animam com CountUp ao carregar.
- [ ] Favoritos entram com stagger animation; hover com glow rosa.
- [ ] Aba Stats tem gráfico de distribuição de scores animado.
- [ ] Aba Stats tem gêneros mais assistidos com barras animadas.
- [ ] Cards e banner do perfil **não foram alterados**.
- [ ] SeriesList e FilmList **não foram alteradas**.
- [ ] Todas as animações respeitam `prefers-reduced-motion`.

---

## 📊 RESUMO DE PRIORIDADES ATUALIZADO

| # | Issue / Feature | Tipo | Prioridade | Arquivo Principal | Impacto | Esforço |
|---|-----------------|------|-----------|-------------------|---------|---------|
| 1 | Relações desaparecem após F5 | Bug | **P1** | `titles/[id]/page.tsx` | Alto | 4–6h |
| 2 | Trending TV: menos de 6 títulos | Bug | **P1** | `search/page.tsx` | Alto | 1–2h |
| 3 | All Time Popular TV: loading infinito | Bug | **P1** | `search/page.tsx` | Alto | 1–3h |
| 4 | ListEditor não conecta ao Activity | Bug | **P1** | `ListEditor.tsx` | Alto | 2–4h |
| 5 | "Watched" → exibir 0/1 no profile | Bug | **P1** | `profile/page.tsx` | Médio | 30min |
| 6 | Popular Now exibe séries encerradas | Bug | **P2** | `search/page.tsx` | Médio | 1–2h |
| 7 | Busca textual exclui séries finalizadas | Bug | **P2** | `search/page.tsx` | Alto | 1–2h |
| 8 | ListEditor sem feedback visual ao salvar | Bug | **P2** | `search/page.tsx` | Médio | 1–2h |
| 9 | Score multiplicado por 10 | Bug | **P2** | `ListEditor.tsx` | Alto | 30min |
| 10 | update-entry usa tmdbId como ID | Bug | **P2** | `update-entry/route.ts` | Médio | 30min |
| F1 | Seção "In Progress" na Home | Feature | **P2** | `app/page.tsx` | Alto | 2–3h |
| F2 | Notificações (sino) na navbar | Feature | **P2** | `layout.tsx` + novos | Alto | 6–10h |
| F3 | Filtros avançados estilo AniList | Feature | **P2** | `search/page.tsx` | Alto | 4–6h |
| D1 | Redesign profile: tabs, stats, favs | Design | **P2** | `profile/page.tsx` | Alto | 6–10h |
| 11 | imgUrl/entrySlug duplicadas | Refactor | **P3** | `utils.ts` | Baixo | 30min |
| 12 | Language inconsistente add-media | Refactor | **P3** | `add-media/route.ts` | Baixo | 5min |
| 13 | Re-renders desnecessários MediaCard | Perf | **P3** | `search/page.tsx` | Baixo | 1–2h |
| 14 | Lazy loading ausente | Perf | **P3** | múltiplos | Baixo | 15min |
| 15 | Dois POSTs sem função reutilizável | Refactor | **P3** | `titles/[id]/page.tsx` | Baixo | 30min |

---

## 📋 CHECKLIST DE TESTES MANUAIS

### Testes de Bugs

- [ ] **#2** — `/search?tab=tv` → Trending exibe exatamente 6 itens.
- [ ] **#3** — `/search?tab=tv` → "All Time Popular" carrega sem ficar infinito.
- [ ] **#4** — Editar via ListEditor → Activity Feed do profile atualiza.
- [ ] **#5** — Cards do profile exibem `1` (completado) ou `0` (não completado), sem texto "Watched".
- [ ] **#6** — "Popular Now" TV não exibe Breaking Bad, Game of Thrones.
- [ ] **#7** — Busca por "Breaking Bad" retorna resultado.
- [ ] **#8** — Salvar via ListEditor atualiza card visualmente sem F5.
- [ ] **#9** — Score "7.3" não vira "73" no ListEditor.

### Testes de Features

- [ ] **F1** — Home exibe seção "In Progress" abaixo de "Airing Now" com filmes e séries WATCHING.
- [ ] **F2** — Sino na navbar com badge; painel abre com notificações corretas; "mark all read" funciona.
- [ ] **F3** — Filtros avançados: gênero, ano, score, status combinados funcionam via `/discover`.

### Testes de Design

- [ ] **D1** — Tabs rosa ao clicar; overview com CountUp animado; favoritos com stagger; stats com gráficos animados.
- [ ] **D1** — Banner, avatar, cards de SeriesList e FilmList **não foram alterados**.

---

## 📝 NOTAS TÉCNICAS

### Sobre o Estado de Saúde do Projeto

- ✅ Estrutura robusta e escalável
- ✅ Integração TMDB com retry automático (3x, backoff exponencial, 8s timeout)
- ✅ Validações de dados completas nas rotas de API
- ✅ Todos os imports corretos (nenhum import quebrado identificado)
- ✅ Tratamento de erros robusto em operações TMDB
- 🔴 2 bugs P1 novos em `search/page.tsx` (TV Trending + All Time Popular)
- 🔴 ListEditor desconectado do Activity (P1)
- ⚠️ Score inconsistente (P2 · #9)
- ⚠️ 2 problemas de busca de séries (P2 · #6 e #7)

### Dependências entre Tasks

```
F2 (Notificações) depende de:
  → Prisma schema: nova tabela Notification (ou armazenar em memória/cache)
  → API TMDB: /tv/{id} para next_episode_to_air
  → lib/notifications.ts (novo arquivo)

D1 (Redesign Profile) NÃO depende de outras tasks.
  → Pode ser desenvolvida em paralelo.

F3 (Filtros Avançados) depende de:
  → Verificar se #6 e #7 foram corrigidos primeiro para não conflitar.
```

### Comandos Úteis para Debug

```bash
# Ver logs de erro do TMDB
grep -r "TMDB" src/app/titles --include="*.tsx" | grep -i error

# Encontrar todas as chamadas fetch
grep -r "fetch(" src/ --include="*.ts*" | grep -v node_modules

# Buscar todas as chamadas para /api/relations
grep -r "/api/relations" src/ --include="*.ts*"

# Encontrar todos os useState e useEffect em titles/[id]
grep -rn "useState\|useEffect" src/app/titles --include="*.tsx"

# Verificar scores inconsistentes no banco (rodar via Prisma Studio ou query direta)
# SELECT id, score FROM "Entry" WHERE score > 10;

# Listar entries com status WATCHING (para testar In Progress + Notificações)
# SELECT id, title, type, status, updatedAt FROM "Entry" WHERE status = 'WATCHING' ORDER BY updatedAt DESC;
```

---

*Documento atualizado com base em análise e revisão do projeto HADES.*
*Referência anterior: `ANALISE_CONEXOES.md` — 28 de Abril de 2026*
*Atualização: 29 de Abril de 2026*