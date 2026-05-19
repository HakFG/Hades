# HADES — Roadmap SEARCH / BROWSE (`app/search/page.tsx`)

> **Última atualização:** Maio 2026  
> **Status:** Ativo com múltiplas features implementadas  
> **Arquivos associados:** `src/app/search/page.tsx`, `src/app/browser/page.tsx`, `src/lib/browser-filter.ts`

---

## 📊 Índice

1. [Análise Atual do Estado](#análise-atual-do-estado)
2. [Implementações Já Existentes](#implementações-já-existentes)
3. [Features a Implementar/Expandir](#features-a-implementarimplementarexpandir)
4. [Arquitetura Técnica](#arquitetura-técnica)
5. [Fluxo de Dados de Busca](#fluxo-de-dados-de-busca)
6. [Sistema de Filtros](#sistema-de-filtros)
7. [Plano de Implementação](#plano-de-implementação)

---

## Análise Atual do Estado

### 🎯 O que a Search/Browse já é

`src/app/search/page.tsx` é um **Client Component** que fornece interface de busca e descoberta de títulos. Características atuais:

- **Tipo**: Client-side (useState, useCallback, useEffect)
- **Dados primários**: TMDB API (trending, popular, descoberta)
- **Modo**: Alternância entre TV Shows e Movies
- **Filtros atuais**: 
  - Genre (select dropdown)
  - Year (select dropdown)
  - Format (select dropdown)
  - Status (select dropdown)
- **Paginação**: Scroll-based infinite loading
- **Exibição**: Seções colapsáveis (Trending, Popular, etc.)
- **Integração com banco**: Cross-check com `entries` para mostrar status (Watching, Completed, etc.)

### ✅ O que já funciona

#### 2.1 **Busca por Título** (JÁ IMPLEMENTADO)
- Fluxo: Input text + Enter/botão → fetch TMDB `/search/tv` ou `/search/movie`
- Paginação: Carrega 20 por vez, scroll para carregar +20
- Exibição: Cards com poster, title, ano
- **Status**: ✅ Ativo

#### 2.2 **Filtros Básicos** (JÁ IMPLEMENTADO)
- Genre: Dropdown simples
- Year: Dropdown com anos de 1874 até agora
- Format: Dropdown com opções por tipo (TV, Miniseries, Short Films, etc.)
- Status: Dropdown com opções de produção (Airing, Ended, etc.)
- **Integração**: Query params (URL) para persistência de filtro
- **Status**: ✅ Ativo

#### 2.3 **Alternância TV/Movies** (JÁ IMPLEMENTADO)
- Toggle button ou botões para alternar tipo
- Ao alternar, limpa resultados e busca novo tipo
- **Status**: ✅ Ativo

#### 2.4 **Indicador de Status** (PARCIALMENTE IMPLEMENTADO)
- Ao exibir resultado, verifica se tmdbId existe em `entries`
- Se sim, exibe badge com status (Watching, Completed, Planning, etc.)
- **Limitação**: Pode ser visualmente sutil ou não estar em todos os cards
- **Status**: ⏳ Existe mas precisa melhorar visibilidade

#### 2.5 **Trending This Week & Popular Now** (JÁ IMPLEMENTADO)
- Seções separadas que mostram trending e popular
- Dados: TMDB `/trending/tv/week` + `/tv/popular`
- Renderização: Cards em grid
- **Status**: ✅ Ativo

#### 2.6 **Browser Page** (JÁ IMPLEMENTADO)
- Localização: `src/app/browser/page.tsx`
- Funcionalidade: Landing page com trending, popular, upcoming
- Dados: Vem de `src/lib/browser-filter.ts`
- **Status**: ✅ Ativo

#### 2.7 **Staff Search** (FUNCIONALIDADE EXISTENTE, NÃO VISÍVEL)
- API route: `src/app/api/staff/search/route.ts`
- Endpoint: Busca pessoas (atores, diretores, roteiristas)
- Dados: TMDB `/search/person`
- **Implementação**: Pronta, mas não tem aba visual em Search
- **Status**: ⏳ Backlog — precisa de aba na UI

#### 2.8 **Seções Abertas por Padrão** (PARCIALMENTE IMPLEMENTADO)
- Trending e Popular aparecem ao carregar
- Podem estar colapsadas inicialmente
- **Recomendação do roadmap**: Sempre expandidas
- **Status**: ⏳ Funciona mas pode ser otimizado

#### 2.9 **Scroll Paginado com Fix Hover Bug** (IMPLEMENTADO)
- Carregamento incremental funciona (Promise-based)
- Bug de flicker ao hover: **Corrigir com React.memo + estado separado**
- **Status**: ⚠️ Funciona mas com pequeno flicker em hover

---

## Implementações Já Existentes

### Componentes & Libs

| Componente/Lib | Caminho | Propósito | Status |
|---|---|---|---|
| `MediaCard` | `src/components/MediaCard.tsx` | Card genérico resultado busca | ✅ |
| `ProductionFilterBar` | `src/components/ProductionFilterBar.tsx` | Filtros atuais | ✅ |
| `ListEditor` | `src/components/ListEditor.tsx` | UI para adicionar/editar entrada | ✅ |
| `browser-filter` | `src/lib/browser-filter.ts` | Lógica de agregação Browse | ✅ |
| `tmdb-titles` | `src/lib/tmdb-titles.ts` | Fetch e transform TMDB | ✅ |

### APIs Utilizadas

| Rota | Método | Propósito |
|---|---|---|
| `/api/entries?tmdbId=*` | GET | Busca entrada por TMDB ID |
| `/api/add-media` | POST | Adiciona título à lista |
| `/api/update-entry` | PUT | Atualiza status/info de entrada |
| `/api/staff/search` | GET | Busca pessoas (staff) |

---

## Features a Implementar/Expandir

### 📌 Prioridade 1: Essencial (Imediato)

#### Feature 1.1: Aba "People" — Busca por Atores/Diretores/Roteiristas
**Problema**: Funcionalidade existe via API (`/api/staff/search`), mas não há UI para acessá-la.

**Solução recomendada**:

1. Adicionar terceira aba em Search:
   ```typescript
   type MediaType = 'tv' | 'movie' | 'people';
   
   // No JSX:
   <div className="search-tabs">
     <button onClick={() => setMediaType('tv')}>TV Shows</button>
     <button onClick={() => setMediaType('movie')}>Movies</button>
     <button onClick={() => setMediaType('people')}>People</button>  {/* NOVO */}
   </div>
   ```

2. Criar state separado para People:
   ```typescript
   const [peopleResults, setPeopleResults] = useState<Person[]>([]);
   const [peopleSearchTerm, setPeopleSearchTerm] = useState('');
   ```

3. Fetch People quando mediaType === 'people':
   ```typescript
   async function searchPeople(query: string) {
     const res = await fetch(`/api/staff/search?q=${query}`);
     const data = await res.json();
     setPeopleResults(data);
   }
   ```

4. Renderizar resultados com componentes de Staff:
   ```typescript
   {mediaType === 'people' && peopleResults.map(person => (
     <div key={person.id} className="people-card">
       <img src={posterUrl(person.profile_path)} alt={person.name} />
       <h3>{person.name}</h3>
       <p>{person.known_for_department}</p>
       <p className="filmography">{person.known_for_titles?.join(', ')}</p>
       <button onClick={() => navigateTo(`/staff/${person.id}`)}>
         View Profile
       </button>
     </div>
   ))}
   ```

5. Integrar com componentes existentes em `src/components/StaffComponents/`

**Estimativa**: 3-4 horas

---

#### Feature 1.2: Melhorar Indicador "Já está na sua lista"
**Problema**: Indicador existe mas pode ser mais visível/funcional.

**Solução recomendada**:

1. Adicionar overlay ou badge grande no card:
   ```typescript
   function MediaCardComponent({ item }) {
     const [status, setStatus] = useState<MediaStatus | null>(null);
     
     useEffect(() => {
       if (item.tmdbId) {
         fetch(`/api/entries?tmdbId=${item.tmdbId}`)
           .then(r => r.json())
           .then(entry => setStatus(entry?.status || null));
       }
     }, [item.tmdbId]);

     return (
       <div className="media-card" style={{position: 'relative'}}>
         {status && (
           <div className="status-badge" style={{
             position: 'absolute', top: 8, right: 8,
             background: getStatusColor(status),
             padding: '4px 8px', borderRadius: 4,
             fontSize: 11, fontWeight: 700, color: 'white'
           }}>
             {status}
           </div>
         )}
         {/* resto do card */}
       </div>
     );
   }
   ```

2. Adicionar ação rápida:
   ```typescript
   {status && (
     <button className="quick-action-button" onClick={() => {
       // Navega para title/[id] com hash #edit-status
       navigateTo(`/${item.linkSlug}#edit-status`);
     }}>
       Update Status
     </button>
   )}
   ```

3. CSS para melhor visibilidade:
   ```css
   .status-badge {
     text-transform: uppercase;
     letter-spacing: 0.5px;
     animation: fadeIn 0.3s ease;
   }
   ```

**Estimativa**: 2-3 horas

---

#### Feature 1.3: Expandir Seção "Não está na sua lista"
**Problema**: Recomendação do roadmap menciona, mas não está implementada.

**Solução recomendada**:

1. Criar query que busca:
   - Trending da semana (TMDB `/trending/tv/week`)
   - Popular (TMDB `/tv/popular`)
   - Gêneros favoritos do usuário (baseado em entries COMPLETED/WATCHING)
   - EXCLUIR: todos os tmdbIds que já estão no banco

2. Implementar lógica:
   ```typescript
   async function getNotInListSuggestions() {
     // Buscar gêneros favoritos do usuário
     const userEntries = await prisma.entry.findMany({
       where: { status: { in: ['WATCHING', 'COMPLETED'] } }
     });
     const favoriteGenres = extractTopGenres(userEntries, 5);

     // Buscar trending + popular
     const trending = await fetchTrendingFromTmdb();
     const popular = await fetchPopularFromTmdb();

     // Buscar tmdbIds já no banco
     const existingTmdbIds = await prisma.entry.findMany({
       select: { tmdbId: true }
     }).then(e => new Set(e.map(x => x.tmdbId)));

     // Filtrar: trending/popular que NÃO estão no banco
     const suggestions = [...trending, ...popular]
       .filter(item => !existingTmdbIds.has(item.id))
       .filter(item => hasOverlapWithFavoriteGenres(item, favoriteGenres))
       .slice(0, 12);

     return suggestions;
   }
   ```

3. Adicionar seção no Search:
   ```typescript
   {suggestions.length > 0 && (
     <section className="not-in-list-section">
       <h2>Not in your list (But you might like)</h2>
       <div className="hero-card">
         <div className="poster-side">
           <img src={posterUrl(suggestions[0].poster_path)} />
         </div>
         <div className="content-side">
           <h3>{suggestions[0].title}</h3>
           <p>{suggestions[0].synopsis}</p>
           <button>+ Add to List</button>
         </div>
       </div>
       <div className="carousel">
         {suggestions.slice(1).map(item => (
           <MediaCard key={item.id} item={item} />
         ))}
       </div>
     </section>
   )}
   ```

**Estimativa**: 4-5 horas

---

### 📌 Prioridade 2: Importantes (1-2 semanas)

#### Feature 2.1: Grid de Gêneros Clicável
**Objetivo**: Alternativa visual aos dropdowns — grid de gêneros que o usuário pode clicar.

**Implementação**:

1. Criar componente `src/components/GenreGrid.tsx`:
   ```typescript
   interface GenreGridProps {
     selectedGenre: number | null;
     onGenreSelect: (genreId: number) => void;
   }

   export default function GenreGrid({ selectedGenre, onGenreSelect }: GenreGridProps) {
     const genres = [
       { id: 28, name: 'Action' },
       { id: 12, name: 'Adventure' },
       { id: 16, name: 'Animation' },
       { id: 35, name: 'Comedy' },
       { id: 80, name: 'Crime' },
       { id: 99, name: 'Documentary' },
       { id: 18, name: 'Drama' },
       { id: 10751, name: 'Family' },
       { id: 14, name: 'Fantasy' },
       { id: 36, name: 'History' },
       { id: 27, name: 'Horror' },
       { id: 10402, name: 'Music' },
       { id: 9648, name: 'Mystery' },
       { id: 10749, name: 'Romance' },
       { id: 878, name: 'Science Fiction' },
       { id: 10770, name: 'TV Movie' },
       { id: 53, name: 'Thriller' },
       { id: 10752, name: 'War' },
       { id: 37, name: 'Western' },
     ];

     return (
       <div className="genre-grid">
         {genres.map(genre => (
           <button
             key={genre.id}
             className={`genre-chip ${selectedGenre === genre.id ? 'active' : ''}`}
             onClick={() => onGenreSelect(selectedGenre === genre.id ? null : genre.id)}
           >
             {genre.name}
           </button>
         ))}
       </div>
     );
   }
   ```

2. Adicionar CSS:
   ```css
   .genre-grid {
     display: grid;
     grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
     gap: 8px;
     margin-bottom: 20px;
   }

   .genre-chip {
     padding: 8px 12px;
     border: 1px solid rgba(255,255,255,0.2);
     background: transparent;
     color: rgb(220,210,215);
     border-radius: 20px;
     cursor: pointer;
     transition: all 0.2s ease;
   }

   .genre-chip:hover {
     border-color: rgba(16,185,129,0.5);
     background: rgba(16,185,129,0.1);
   }

   .genre-chip.active {
     border-color: rgb(16,185,129);
     background: rgba(16,185,129,0.2);
   }
   ```

3. Integrar no Search:
   ```typescript
   <GenreGrid 
     selectedGenre={selectedGenre} 
     onGenreSelect={setSelectedGenre}
   />
   ```

**Estimativa**: 2 horas

---

#### Feature 2.2: Filtros Avançados como Chips
**Objetivo**: Substituir dropdowns por UI mais moderna e acumulativa.

**Implementação**:

Criar componente `src/components/AdvancedFilterChips.tsx` com:
- Multi-seleção de gêneros (chips acumuláveis)
- Slider de anos (range: 1990–2025)
- Slider de duração (episódios < 30min)
- Chips de plataforma/rede (Netflix, HBO, etc.)
- Chips de status produção
- Slider de nota mínima TMDB

```typescript
interface AdvancedFilters {
  genres: number[];
  yearRange: [number, number];
  runtime: number | null;
  networks: string[];
  productionStatus: string[];
  minRating: number;
}

export default function AdvancedFilterChips({
  filters,
  onFiltersChange,
}: {
  filters: AdvancedFilters;
  onFiltersChange: (f: AdvancedFilters) => void;
}) {
  return (
    <div className="advanced-filters">
      {/* Gêneros */}
      <div className="filter-section">
        <h4>Genres</h4>
        <div className="chips">
          {/* MultiSelect chips */}
        </div>
      </div>

      {/* Ano */}
      <div className="filter-section">
        <h4>Year Range</h4>
        <input type="range" min="1990" max={currentYear} {...filters.yearRange} />
      </div>

      {/* Duração */}
      <div className="filter-section">
        <h4>Episode Duration</h4>
        <input type="range" min="0" max="120" step="5" value={filters.runtime || 0} />
      </div>

      {/* Redes */}
      <div className="filter-section">
        <h4>Networks</h4>
        <div className="network-chips">
          {/* Netflix, HBO, Apple+, etc. */}
        </div>
      </div>

      {/* Status de Produção */}
      <div className="filter-section">
        <h4>Production Status</h4>
        <div className="status-chips">
          {/* Airing, Returning, Ended, etc. */}
        </div>
      </div>

      {/* Nota mínima */}
      <div className="filter-section">
        <h4>Minimum Rating</h4>
        <input type="range" min="0" max="10" step="0.5" value={filters.minRating} />
      </div>
    </div>
  );
}
```

**Estimativa**: 5-6 horas

---

#### Feature 2.3: Sessão de OSCAR Inteligente
**Objetivo**: Buscar, filtrar e exibir filmes indicados ao Oscar por ano/categoria.

**Arquitetura recomendada**:

1. Criar dataset interno em `src/data/oscars.json`:
   ```json
   {
     "2024": [
       {
         "id": 1,
         "tmdbId": 615457,
         "title": "Oppenheimer",
         "categories": ["Best Picture", "Best Director", "Best Actor"],
         "result": "winner",
         "posterPath": "/..."
       }
     ]
   }
   ```

2. Criar lib `src/lib/oscar-data.ts`:
   ```typescript
   export interface OscarFilm {
     id: string;
     tmdbId: number;
     title: string;
     categories: string[];
     result: 'winner' | 'nominated';
     year: number;
     posterPath: string;
     synopsisFromTmdb?: string;
   }

   export async function getOscarFilmsByYear(year: number): Promise<OscarFilm[]> {
     const data = require('@/data/oscars.json');
     return data[year] || [];
   }

   export async function getOscarCategories(year: number): Promise<string[]> {
     const films = await getOscarFilmsByYear(year);
     const cats = new Set<string>();
     films.forEach(f => f.categories.forEach(c => cats.add(c)));
     return Array.from(cats);
   }
   ```

3. Criar componente `src/components/OscarSection.tsx`:
   ```typescript
   export default function OscarSection({ year, selectedCategory }: {
     year: number;
     selectedCategory?: string;
   }) {
     const [films, setFilms] = useState<OscarFilm[]>([]);
     const [filter, setFilter] = useState<'all' | 'winners' | 'nominated'>('all');

     useEffect(() => {
       async function load() {
         const data = await fetch(`/api/oscars?year=${year}`).then(r => r.json());
         setFilms(data);
       }
       load();
     }, [year]);

     const filtered = films
       .filter(f => filter === 'all' || f.result === filter)
       .filter(f => !selectedCategory || f.categories.includes(selectedCategory));

     return (
       <section className="oscar-section">
         <h2>Academy Awards {year}</h2>
         <div className="filter-buttons">
           {(['all', 'winners', 'nominated'] as const).map(f => (
             <button 
               key={f}
               className={filter === f ? 'active' : ''}
               onClick={() => setFilter(f)}
             >
               {f.charAt(0).toUpperCase() + f.slice(1)}
             </button>
           ))}
         </div>
         <div className="oscar-grid">
           {filtered.map(film => (
             <OscarFilmCard key={film.id} film={film} />
           ))}
         </div>
       </section>
     );
   }
   ```

4. Criar API route `src/app/api/oscars/route.ts`:
   ```typescript
   export async function GET(request: Request) {
     const { searchParams } = new URL(request.url);
     const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
     const films = await getOscarFilmsByYear(year);
     return NextResponse.json(films);
   }
   ```

**Estimativa**: 6-8 horas

---

### 📌 Prioridade 3: Performance & UX (Nice-to-have)

#### Feature 3.1: Virtualization para Scroll Paginado
**Problema**: Carregar 100+ items sem virtualization pode ficar lento.

**Solução**: Usar `react-window`:
```bash
npm install react-window
```

```typescript
import { FixedSizeGrid as Grid } from 'react-window';

function SearchResultsGrid({ items }) {
  return (
    <Grid
      columnCount={4}
      columnWidth={280}
      rowCount={Math.ceil(items.length / 4)}
      rowHeight={420}
      height={window.innerHeight}
      width={window.innerWidth}
    >
      {({ columnIndex, rowIndex, style }) => {
        const index = rowIndex * 4 + columnIndex;
        return (
          <div style={style}>
            <MediaCard item={items[index]} />
          </div>
        );
      }}
    </Grid>
  );
}
```

**Estimativa**: 2-3 horas

---

#### Feature 3.2: Fix Hover Bug (Flicker em MediaCard)
**Problema**: Cards piscam ao passar mouse.

**Causa**: Re-render de lista inteira ao hover.

**Solução**:
1. Memoizar `MediaCard`:
   ```typescript
   const MediaCardMemo = React.memo(MediaCard, (prev, next) => {
     return prev.item.id === next.item.id && 
            prev.showStatus === next.showStatus;
   });
   ```

2. Separar estado de hover:
   ```typescript
   const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
   
   {items.map(item => (
     <MediaCardMemo
       key={item.id}
       item={item}
       isHovered={hoveredCardId === item.id}
       onHover={() => setHoveredCardId(item.id)}
       onHoverEnd={() => setHoveredCardId(null)}
     />
   ))}
   ```

3. CSS transform em vez de reflow:
   ```css
   .media-card {
     transition: transform 0.2s ease, box-shadow 0.2s ease;
   }
   .media-card:hover {
     transform: translateY(-4px);
     box-shadow: 0 8px 24px rgba(0,0,0,0.4);
   }
   ```

**Estimativa**: 1-2 horas

---

## Arquitetura Técnica

### 📐 Layout Search Page

```
┌────────────────────────────────────────────┐
│  Search Bar (sticky top)                   │
│  [Input] [TV/Movie Toggle] [Filters]      │
├────────────────────────────────────────────┤
│  Filter Options (collapsible)              │
│  ┌─ Genre Grid ──────────────────────────┐ │
│  ├─ Year Slider ────────────────────────┤ │
│  ├─ Format Chips ────────────────────────┤ │
│  └─ Status ─────────────────────────────┘ │
├────────────────────────────────────────────┤
│  Results Grid (infinite scroll)            │
│  ┌──┬──┬──┬──┐                            │
│  │  │  │  │  │                            │
│  │  │  │  │  │  4 colunas (responsive)   │
│  │  │  │  │  │                            │
│  └──┴──┴──┴──┘                            │
│  ... (scroll carrega mais)                 │
└────────────────────────────────────────────┘
```

### 🔄 Fluxo de Dados de Busca

```
User Input (Search term / Filters)
         ↓
SearchPage State Update
         ↓
generateQueryUrl() → TMDB URL
         ↓
fetch(url) → TMDB API
         ↓
mediaToCard() → Normalize response
         ↓
Cross-check com prisma.entry (tmdbId)
         ↓
Add status badge se existir
         ↓
Render MediaCard[]
```

---

## Sistema de Filtros

### Filtros Atuais (Dropdowns)

| Filtro | Campo TMDB | Comportamento |
|---|---|---|
| Genre | `with_genres` | Single select |
| Year | `primary_release_year` (movies) / `first_air_date` (tv) | Single select |
| Format | `with_type` | Mapeamento complexo (2-6) |
| Status | Custom logic | Client-side filter |

### Filtros Recomendados (Fase 2)

| Filtro | Campo TMDB | Tipo |
|---|---|---|
| Gêneros | `with_genres` | Multi-select chips |
| Intervalo de Ano | `primary_release_year` | Dual slider |
| Duração | `with_runtime` | Slider |
| Redes | `with_networks` | Multi-select chips |
| Status Produção | `with_status` | Multi-select chips |
| Idioma Original | `with_original_language` | Chips |
| Nota TMDB | `vote_average.gte` | Slider |
| "Hidden Gems" | `popularity < 100 && rating > 7` | Toggle |

---

## Plano de Implementação

### 🗓 Sprint Sugerido

**Sprint 1 (Imediato)** — Features Essenciais
- [ ] Implementar aba "People" com search
- [ ] Melhorar indicador "já na lista" com badge visível
- [ ] Criar seção "Não está na sua lista"

**Sprint 2 (Próximas 1-2 semanas)**
- [ ] Implementar Genre Grid clicável
- [ ] Expandir para Filtros Avançados (chips + sliders)
- [ ] Fix hover bug no grid

**Sprint 3 (Médio prazo)**
- [ ] Sessão Oscar inteligente
- [ ] Virtualization para performance
- [ ] Polish visual geral

### ✅ Checkpoints

- [ ] Search retorna resultados em <1s
- [ ] Filtros sincronizam com URL (query params)
- [ ] Status badge visível em 100% dos cards
- [ ] People aba funcional e integrada
- [ ] Oscar section responsivo e funcional
- [ ] Hover bug resolvido
- [ ] Mobile responsivo em <375px

---

## Referências

- TMDB API: https://developer.themoviedb.org/docs/discover-tv
- React Window: https://react-window.now.sh/
- Filter Chips Pattern: https://material-ui.com/components/chips/
- Existing Libs: `src/lib/tmdb-titles.ts`, `src/lib/browser-filter.ts`
