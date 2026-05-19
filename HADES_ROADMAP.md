# HADES — Roadmap de Melhorias

> Documento consolidado com todas as features novas, melhorias e correções planejadas para o site Hades. Inclui especificações detalhadas por página e sistema.

---

## 📋 Índice

1. [Home — `app/page.tsx`](#1-home--appapagetsx)
2. [Search / Browse — `app/search/page.tsx`](#2-search--browse--appsearchpagetsx)
3. [Title — `app/title/[id]`](#3-title--apptitleid)
4. [Sistema de Notificações](#4-sistema-de-notificações)
5. [Sistema de Capas (global)](#5-sistema-de-capas-global)

---

## 1. Home — `app/page.tsx`

### 1.1 Sessão de hoje — "O que assistir agora"
- Card proeminente sugerindo **1 ou 2 títulos específicos para hoje**
- Baseado na lista do usuário (watchlist ativa)
- Usa lógica de next-up + streaks para contextualizar a sugestão
- Mensagem contextual: ex: _"Você está em 5 dias de streak, continue com…"_
- **Dados:** `/api/next-up` + `/api/gamification/user-stats` + `StreakData`

---

### 1.2 Remoção da aba Next Up - JÁ FOI REMOVIDO
- A aba **Next Up foi removida** por ter se tornado inutilizada
- A lógica de próximo episódio migra para o card "Sessão de hoje"

---

### 1.3 Newly Added — mais robusto
- Passa a comportar até **6 títulos** antes de quebrar a linha
- Aceita **séries e filmes** — qualquer obra nova adicionada ao TMDB aparece aqui
- Componente maior, mais inteligente e mais visual

---

### 1.4 Films & Series News — expandido e em PT-BR
- Passa a exibir até **20 notícias**
- Todos os sites de origem trocados por **fontes brasileiras**
- **Foco exclusivo em anúncios importantes:** continuações, renovações, cancelamentos — sem críticas nem opiniões
- **Fontes aprovadas:**
  - https://www.omelete.com.br/
  - https://www.adorocinema.com/
  - https://cinepop.com.br/
  - https://www.tecmundo.com.br/minha-serie
  - https://x.com/SeriesTWBZ
  - https://x.com/tuaseriebr

---

### 1.5 Calendário de lançamentos da watchlist
- Mini-calendário **horizontal** mostrando os próximos episódios que vão ao ar
- Exibe apenas séries com `status: WATCHING` na lista do usuário
- Mostra **dias da semana e horários** de exibição
- **Dados:** campo `lastAirDate` + consulta ao TMDB para próximos episódios
- Cobre os próximos **7 dias** com badges por série

---

### 1.6 Vitrine de conquistas recentes
- Carrossel horizontal compacto com os **últimos badges desbloqueados** e desafios concluídos
- Cada item exibe: ícone, nome da conquista e XP ganho
- **Dados:** `GamificationActivityLog` + `badges[]` do `UserGamification`
- Complementa ou substitui o `ChallengeWidget` atual

---

### 1.7 Seus números desta semana
- Widget com **4 métricas dos últimos 7 dias:**
  - Episódios assistidos
  - Filmes assistidos
  - Horas totais
  - XP ganho
- Exibe comparação com o período anterior: ex: _"↑ 3 ep a mais que semana passada"_
- **Dados:** `ActivityLog` filtrado por data + `GamificationActivityLog`

---

### 1.8 Roleta do destino — título aleatório da watchlist - JÁ FOI FEITO, PORÉM COLOCAR ELE EM BAIXO DE SÉRIES E FILM LIST.
- Botão estilizado (temática mitológica/Hades) que **sorteia um título aleatório** da watchlist com `status: PLANNING`
- Exibe card com poster e sinopse do título sorteado
- Incentiva o usuário a começar algo que está postergando
- **Implementação:** busca entries com `status: PLANNING` → `Math.random()` → exibe card

---

## 2. Search / Browse — `app/search/page.tsx`

### 2.1 Nova aba "People"
- Terceira aba ao lado de **TV Shows** e **Movies**
- Permite buscar por **atores, diretores e roteiristas**
- Resultados listam obras associadas à pessoa
- Integração com `/api/staff/search` já existente + TMDB `/person/{id}`
- Abre perfil em `/staff/[id]` ou permite adicionar obra direto à lista

---

### 2.2 Indicador "Já está na sua lista"
- Em cada card de resultado (TMDB ou seções fixas), exibe **badge ou overlay** indicando:
  - Se o título já está na coleção
  - Qual o status atual: `Watching`, `Completed`, `Planning`, etc.
- Ação rápida de atualização de status **sem sair da busca**
- **Implementação:** cross-check do `tmdbId` dos resultados com as entries do banco

---

### 2.3 Seção "Não está na sua lista"
- Curadoria automática que cruza:
  - Trending da semana (TMDB `/trending/tv/week` e `/trending/movie/week`)
  - Gêneros favoritos do usuário
  - Exclusão de `tmdbId`s já presentes na coleção
- Resultado: só exibe títulos que realmente valem descobrir
- Hero-card com botão **"+ Adicionar"** diretamente na seção

---

### 2.4 Grid de gêneros clicável
- Grid visual de gêneros: Drama, Sci-Fi, Comédia, Horror, Crime, Ação, Animação, Romance etc.
- Clique em um gênero **filtra instantaneamente** os resultados
- Estado visual claro do gênero ativo (highlight/border)
- Conectado ao achievement `genres_10/20/30` para mostrar progresso de diversidade

---

### 2.5 Melhorias nos filtros de busca
Substituir os dropdowns atuais (Genre ▼, Year ▼, Any Format ▼, Status ▼) por **chips clicáveis e acumuláveis**:

| Filtro | Campo no banco | Detalhe |
|---|---|---|
| Gênero | `genres` | chips multi-seleção |
| Intervalo de ano | `releaseDate` | dual slider (ex: 1990–2005) |
| Duração / Runtime | `episodeRuntime` | slider (ex: episódios < 30min) |
| Plataforma / Rede | `networks` | chips: Netflix, HBO, Apple TV+… |
| Status de produção | `productionStatus` | Em andamento, Encerrada, Em produção |
| Idioma original | `languages` | chips: PT, EN, JP, KR… |
| Nota mínima TMDB | `rating` | slider 0–10 |
| Formato | `format` | toggle: minissérie, série, filme |
| Hidden gems | `popularity` + `rating` | baixa popularidade + nota alta |
| "Nunca explorado" | `genres` cruzado com entries | gêneros com < 3 títulos na lista |

---

### 2.6 Seções fixas abertas por padrão (Trending, Popular Now, All Time Popular)
- As 3 seções **não precisam mais de clique** para expandir — os títulos aparecem ao abrir a página
- Válido tanto para **séries quanto para filmes**
- Ao clicar em "Trending": ordena do **maior para o menor** em trending
- Ao clicar em "Popular Now": ordena por popularidade atual
- Ao clicar em "All Time Popular": ordena por mais votados de todos os tempos

---

### 2.7 Sistema de scroll repaginado
- Ao carregar 40+ títulos, exibe **no máximo 20 por vez**
- A cada scroll até o fim, carrega os próximos **21 títulos**
- **Correção de bug crítico:** títulos não piscam mais ao passar o mouse (causado por re-render no hover — corrigir com `memo` ou separação de estado)

---

### 2.8 Sessão de OSCAR inteligente
- Ao entrar em `app/search/page.tsx` e selecionar um ano, exibe todos os filmes que concorreram ao Oscar daquele ano.
- Deve ser um sistema **extremamente inteligente e robusto**: sincroniza TMDB com um dataset próprio de indicações e categorias, garantindo resultados precisos mesmo quando TMDB não declara explicitamente a premiação.
- Requisitos principais:
  - seleção de ano única ou intervalo de anos
  - filtros por categoria de Oscar (Melhor Filme, Direção, Ator, Atriz, Roteiro, Documentário, Animação, etc.)
  - destaque visual de vencedores e indicados
  - blend entre filmes do Oscar e watchlist/status do usuário
  - descoberta de curiosidades como "primeiro Oscar de um diretor brasileiro", "filmes indicados mas não exibidos no Brasil" e "vencedores com baixa popularidade TMDB"
- Implementação sugerida:
  - manter um dataset interno de premiações com `year`, `movieId`, `categories`, `result` e `tmdbId`
  - criar endpoint `app/api/oscar/route.ts` que retorna títulos por `year`, `category`, `winner` e `country`
  - criar componente `OscarSection` ou `OscarPanel` em `app/search/page.tsx` para renderizar cards com medalhas, trailers, notas e links rápidos
  - usar cache periódico ou job de sincronização para atualizar dados de Oscar e associar filmes ao TMDB mesmo quando o título mudar de nome ou tiver múltiplas versões
  - aplicar o sistema de capas global para que a imagem exibida venha sempre da fonte única de verdade do título
- Experiência ideal:
  - ao selecionar um ano, o usuário vê uma grade com os filmes indicados, ordenados por número de indicações, nota e status de watchlist
  - a seção permite alternar entre `Todos`, `Vencedores`, `Indicados`, `Por categoria` e `Favoritos da watchlist`
  - cards mostram: categoria, status (vencedor/indicado), ano do Oscar, sinopse, e ações rápidas de `Adicionar à lista` ou `Ver detalhes`.

---

## 3. Title — `app/title/[id]`

### 3.1 Sistema de Relations — mais inteligente e robusto

#### Tipos de relação suportados:

| Tipo | Descrição | Exemplo |
|---|---|---|
| `Sequel` | Continuação direta | The Mandalorian 3rd Season -> Star Wars: The Mandalorian and Grogu (cronologicamente) |
| `Prequel` | Obra anterior direta | — |
| `Spin-off` | Derivação com personagens/universo — **somente primeira temporada** de cada série conta | Yellowstone ↔ 1923 (T1 de cada) |
| `Side Story` | Obras independentes baseadas no mesmo personagem/conceito | Batman (2022) ↔ Batman (Nolan) |
| `Other` | Mesmo universo, crossover pontual, sem ligação direta | Ben 10 ↔ Mutante Rex |

#### Regras do sistema:
- **Qualquer título** do site pode ter relations adicionadas ou removidas
- O usuário pode **adicionar e remover** relations livremente, sem nenhuma trava
- Correções manuais são sempre possíveis — _"verdade absoluta do site"_
- Inspirado no sistema do **AniList**, adaptado para o Hades
- Sem limite de relations por título

---

## 4. Sistema de Notificações

### Notificações inteligentes — o que deve ser notificado:

| Evento | Prioridade | Detalhe |
|---|---|---|
| Novo episódio de série na lista | 🔴 Alta | Sempre que um episódio novo for ao ar de uma série com `status: WATCHING` |
| Série/filme adicionado ao TMDB que é continuação de algo na lista | 🔴 Alta | Nova temporada anunciada, sequel, spin-off |
| Qualquer alteração em título da lista | 🟡 Média | Mudança de status, novas informações, data de estreia atualizada |
| Novo título adicionado ao site (Newly Added) | 🟢 Baixa | Notificação opcional/configurável |

### Comportamento esperado:
- Notificações agrupadas por título (não uma por episódio)
- Painel de notificações com marcação de lida / não lida
- Possibilidade futura de configurar quais tipos receber

---

## 5. Sistema de Capas (global)

### Problema atual:
- As capas exibidas em **Relations** (`title/[id]`) e na aba de **Browse/Search** não respeitam a capa personalizada definida em `title/[id]`

### Comportamento esperado:
- A capa definida (ou sobrescrita) em `title/[id]` é a **fonte de verdade global**
- Qualquer componente do site que exibir um card de título deve usar a capa dessa fonte
- Isso se aplica a: Relations, Browse, Newly Added, Trending, Search Results, Home cards etc.

---

 #sym:## ✅ Resumo por página

| Página | Feature | Status | Difficulty |
|---|---|---|---|
| Home | Sessão de hoje | 🆕 Novo | Medium |
| Home | Remover Next Up | 🗑 Remover | Low |
| Home | Newly Added robusto | 🔧 Melhorar | Medium |
| Home | News em PT-BR (20 notícias) | 🔧 Melhorar | Medium |
| Home | Calendário de lançamentos | 🆕 Novo | Medium-High |
| Home | Vitrine de conquistas | 🆕 Novo | Medium |
| Home | Números da semana | 🆕 Novo | Medium |
| Home | Roleta do destino | 🆕 Novo | Low |
| Search | Aba People | 🆕 Novo | Medium |
| Search | Indicador "já na lista" | 🆕 Novo | Low-Medium |
| Search | Seção "não está na sua lista" | 🆕 Novo | Medium |
| Search | Grid de gêneros clicável | 🆕 Novo | Low-Medium |
| Search | Filtros como chips (avançados) | 🔧 Melhorar | Medium-High |
| Search | Seções abertas por padrão | 🔧 Melhorar | Low |
| Search | Scroll paginado + fix hover bug | 🐛 Corrigir | Medium |
| Search | Sessão de OSCAR inteligente | 🆕 Novo | Medium-High |
| Title /[id] | Relations inteligentes (spin-off, side story, other) | 🔧 Melhorar | High |
| Title /[id] | Relations editáveis em qualquer título | 🔧 Melhorar | Medium-High |
| Global | Capas unificadas (fonte de verdade) | 🐛 Corrigir | High |
| Global | Notificações inteligentes | 🔧 Melhorar | High |


## Classificação por dificuldade

**Baixa (Low)**
- Remover Next Up — alteração de UI/rota, impacto localizado; ver [app/page.tsx](app/page.tsx) e `NextUpCard` component.
- Roleta do destino — implementação simples com seleção aleatória; usa `src/lib/next-up.ts`/`src/lib/utils.ts`.
- Seções abertas por padrão — ajuste de estado/props nas views de busca.

**Baixa / Média (Low-Medium)**
- Indicador "já na sua lista" — cross-check simples entre resultados e `entries` do banco; ver [src/lib/prisma.ts](src/lib/prisma.ts) e components de card.
- Grid de gêneros clicável — UI + interação, baixo impacto no backend; ver [src/lib/genres.ts](src/lib) e `ProductionFilterBar`.

**Média (Medium)**
- Sessão de hoje — já existem `next-up` e `gamification` modules; precisa integração de `src/lib/next-up.ts` + `src/lib/gamification.ts` e ajustes de layout em [app/page.tsx](app/page.tsx).
- Newly Added robusto — ampliar quantidade e aceitar filmes/series; envolve ajustes de query TMDB e layout em `NewlyAdded`/components relacionados.
- News em PT-BR — mudança de fontes e agregação (20 itens); trabalho de backend/ETL e componentes de listagem.
- Vitrine de conquistas — usa `GamificationActivityLog`; trabalho de layout e consumo de [src/lib/activity.ts](src/lib/activity.ts).
- Números da semana — consultas a `ActivityLog` e agregações por período; impacto médio no backend.
- Aba People — integração com `/api/staff/search` já existente; UI de abas e resultado.
- Seção "não está na sua lista" — curadoria combinando trending + gêneros favoritos; necessita queries e filtragem.
- Scroll paginado + fix hover bug — envolve otimização de render e memoization em componentes listados (ver `EpisodeGrid`, `MediaCard`).

**Média / Alta (Medium-High)**
- Calendário de lançamentos — consulta a TMDB para próximos episódios, timezone e UI de calendário horizontal; cuidado com performance.
- Filtros como chips (avançados) — refatoração dos filtros atuais para chips acumuláveis e sliders, sincronização com query params e backend.
- Relations editáveis — UI/UX para inserir/remover relações e endpoints para persistência; ver `relations-manager.ts`.

**Alta (High)**
- Relations inteligentes (spin-off, side story, other) — mudança de modelo de dados, regras de consistência e UI complexa para exibir relações; grande impacto em `title/[id]` e `relations-manager`.
- Capas unificadas (fonte de verdade) — refatoração global para garantir uma fonte única de capas; envolve múltiplos componentes (`Relations`, `Browse`, `Newly Added`, `MediaCard`) e `poster-system.ts`.
- Notificações inteligentes — sistema de notificação com agrupamento, backend scheduling e painel de notificações; envolve `activity.ts`, `notifications.ts` e infra/cron jobs.

### Observações técnicas (rápidas)
- Muitos recursos já têm partes implementadas em `src/lib` e `src/components`; selecionei justificativas com base nesses arquivos.
- Recomendo começar pelos itens de **Baixa** e **Média** para entregas rápidas e coletar feedback antes de refatorações globais (Capas, Relations, Notificações).

## Recomendações de reaproveitamento de arquivos e novos artefatos sugeridos

As recomendações abaixo são minha sugestão técnica para **maximizar reaproveitamento** do código existente e **minimizar** a criação de novos arquivos. São orientações — não precisam ser seguidas à risca; use como base prática para decidir o que refatorar vs. criar do zero.

Formato por item: Reaproveitar (arquivos/rotas existentes) → Novo (se necessário) → Nota prática.

- Sessão de hoje
  - Reaproveitar: `src/lib/next-up.ts`, `src/lib/gamification.ts`, `src/components/NextUpCard.tsx`, `src/app/page.tsx`.
  - Novo: opcional `src/components/TodaySession.tsx` (wrapper/compose). Recomendo criar apenas se quiser isolar markup/estado.

- Remover Next Up
  - Reaproveitar: `src/components/NextUpCard.tsx`, `src/app/page.tsx`.
  - Novo: nenhum. Ajuste de rotas/condicionais em `app/page.tsx` basta.

- Newly Added (mais robusto)
  - Reaproveitar: `src/lib/tmdb-titles.ts`, `src/lib/tmdb.ts`, `src/components/MediaCard.tsx`.
  - Novo: opcional `src/components/NewlyAdded.tsx` se preferir separar lógica de fetch/visual; caso contrário, amplie o componente atual.
  - Nota: atenção à paginação e ao layout responsivo (até 6 itens antes da quebra).

- News em PT-BR (20 notícias)
  - Reaproveitar: nenhum agregador de news backend; UI pode reutilizar componentes de listagem (`MediaCard`/carrossel).
  - Novo: `src/lib/news-aggregator.ts` (fetch/normalização) + `src/components/NewsList.tsx`.
  - Nota: preferir um job/TTL para cache das 20 notícias (ETL) em vez de chamadas diretas no cliente.

- Calendário de lançamentos (watchlist)
  - Reaproveitar: `src/lib/tmdb-airing.ts`, `src/lib/prisma.ts`, `src/components/SeasonSelector.tsx` (como referência de UI).
  - Novo: `src/components/ReleaseCalendar.tsx` (UI horizontal) e opcional API route que agrega próximos 7 dias (p.ex. extensão de `app/api/next-up/route.ts`).
  - Nota: lidar com timezone/horário local e performance das chamadas TMDB.

- Vitrine de conquistas
  - Reaproveitar: `src/lib/achievements.ts`, `src/lib/activity.ts`, `src/components/AchievementToast.tsx`, `src/components/ChallengeWidget.tsx`.
  - Novo: opcional `src/components/AchievementShowcase.tsx` (carrossel compacto) — pode ser implementado como variação de `ChallengeWidget`.

- Números da semana
  - Reaproveitar: `src/lib/activity.ts`, `src/app/api/activity/route.ts`.
  - Novo: nenhum obrigatório; crie `src/components/WeeklyStats.tsx` se quiser componente reutilizável.

- Roleta do destino
  - Reaproveitar: `src/lib/prisma.ts`, `src/lib/utils.ts`.
  - Novo: opcional `src/components/SpinTheWheel.tsx` (UI). Lógica de seleção pode ser um util em `src/lib`.

- Aba People (Search)
  - Reaproveitar: `src/app/api/staff/search/route.ts`, `src/lib/staff.ts`, `src/components/StaffComponents/*`.
  - Novo: nenhum — adicionar aba/cliente em `src/app/search/page.tsx` e reutilizar `FilteredBrowserClient.tsx`/staff components.

- Indicador "já na sua lista"
  - Reaproveitar: `src/lib/prisma.ts`, `src/components/MediaCard.tsx`, `src/app/api/entries/route.ts`.
  - Novo: não necessário; crie uma pequena função util (`src/lib/entry-check.ts`) apenas se preferir teste isolado.

- Seção "não está na sua lista"
  - Reaproveitar: `src/lib/tmdb.ts` (trending), `src/lib/prisma.ts`.
  - Novo: opcional `src/components/DiscoverHero.tsx` para separar apresentação; filtragem pode ficar diretamente em `app/search/page.tsx`.

- Grid de gêneros clicável
  - Reaproveitar: `src/components/ProductionFilterBar.tsx` (base) e estilos.
  - Novo: `src/components/GenreGrid.tsx` se quiser modularizar; caso contrário, estender `ProductionFilterBar` é suficiente.

- Filtros como chips (avançados)
  - Reaproveitar: `src/components/ProductionFilterBar.tsx`, `src/app/browser/FilteredBrowserClient.tsx`.
  - Novo: `src/components/FilterChips.tsx` + hook `src/hooks/useFilters.ts` para sincronizar query params e estado (recomendado).

- Seções fixas abertas por padrão
  - Reaproveitar: `src/app/search/page.tsx` e sections components.
  - Novo: nenhum — ajuste `collapsed`/`open` states iniciais.

- Scroll paginado + fix hover bug
  - Reaproveitar: `src/components/EpisodeGrid.tsx`, `src/components/MediaCard.tsx`.
  - Novo: não — aplicar `React.memo`, extrair itens de lista para componentes puros e implementar carregamento incremental no grid.

- Relations inteligentes (spin-off, side story, other)
  - Reaproveitar: `src/lib/relations-manager.ts`, API routes em `src/app/api/relations/*`, UI em `src/app/titles/[id]/page.tsx`.
  - Novo: provavelmente **migrations / prisma model change** e `src/components/RelationsGraph.tsx` para visualização; backend: ampliar regras em `relations-manager.ts`.
  - Nota: alterar schema/prisma exige migration e validação de dados.

- Relations editáveis
  - Reaproveitar: `src/lib/relations-manager.ts`, `src/app/api/relations/route.ts`, `src/app/api/relations/import/route.ts`.
  - Novo: `src/components/RelationsEditor.tsx` (editor inline) é recomendado para UX; endpoint já existe, ampliar validações.

- Capas unificadas (fonte de verdade)
  - Reaproveitar: `src/lib/poster-system.ts`, `src/lib/entry-poster-sync.ts`, `src/app/api/posters/route.ts`, `src/components/MediaCard.tsx`.
  - Novo: criar `src/lib/poster-service.ts` (interface única de leitura) e adaptar consumidores para sempre usar esse serviço. Expect refactor amplo nos componentes que renderizam posters.

- Notificações inteligentes
  - Reaproveitar: `src/lib/notifications.ts`, `src/components/NotificationPanel.tsx`, `src/app/api/notifications/route.ts`, `src/hooks/useXPNotification.ts`.
  - Novo: scheduler/worker (fora do Next process ou cron job), p.ex. `app/api/notifications/scheduler.ts` ou um job externo; `src/components/NotificationsConfig.tsx` para preferências de usuário.

Conclusão e recomendação prática
- Priorize reaproveitar bibliotecas e componentes de `src/lib` e `src/components` antes de criar novos arquivos.
- Crie stubs/componentes pequenos apenas quando modularidade ou testes justificarem (marquei os sugeridos como "opcional" quando não estritamente necessários).
- Para alterações que impactam schema (relations, posters), crie branch separada, adicione migrations e escreva scripts de migração/rollback.

Estas são recomendações minhas — detalhadas e pragmáticas — para reduzir criação de arquivos e acelerar entregas. Não precisam ser seguidas à risca; adapte conforme a conveniência do projeto e prioridades de produto.
