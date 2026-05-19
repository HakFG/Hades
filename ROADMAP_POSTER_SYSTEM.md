# HADES — Roadmap SISTEMA DE CAPAS (Global)

> **Última atualização:** Maio 2026  
> **Status:** Implementado com margem para expansão  
> **Arquivos associados:** `src/lib/poster-system.ts`, `src/lib/entry-poster-sync.ts`, `src/app/api/posters/`

---

## 📊 Índice

1. [Problema & Solução](#problema--solução)
2. [Análise Atual do Estado](#análise-atual-do-estado)
3. [Arquitetura Completa](#arquitetura-completa)
4. [Fluxo de Dados de Capas](#fluxo-de-dados-de-capas)
5. [Modelo de Dados](#modelo-de-dados)
6. [Implementação Detalhada](#implementação-detalhada)
7. [Pontos de Integração](#pontos-de-integração)
8. [Plano de Implementação](#plano-de-implementação)

---

## Problema & Solução

### 🔴 Problema Identificado

**Capas inconsistentes em todo o site:**

- Quando o usuário define uma capa customizada em `/titles/[id]`, essa capa **não é usada em**:
  - Relations page (exibe poster TMDB original)
  - Browse/Search results
  - Home page (Newly Added, Trending)
  - Profile (watchlist cards)
  - Any card que renderize o título
  - Trava e volta a capa original quando ela é colocada como "WATCHING" e aparece no Em Exibição e Em Andamento

**Causa raiz**: Cada componente que renderiza uma capa faz fetch independente do TMDB, sem consultar a `PosterChoice` customizada pelo usuário.

### ✅ Solução

**Implementar "Fonte de Verdade Única" para Capas:**

```
TMDB Poster (oficial)
        ↓
User customiza em title/[id]
        ↓
Salva em PosterChoice table
        ↓
QUALQUER componente que renderize esse título
busca PosterChoice PRIMEIRO antes de usar TMDB
        ↓
Sempre a mesma capa em todo o site
```

---

## Análise Atual do Estado

### ✅ O que já existe

#### 5.1 **Sistema de Customização em Title Page** (JÁ IMPLEMENTADO)
- Localização: `src/app/titles/[id]/page.tsx`
- Funcionalidade: Upload custom image ou selecionar poster alternativo
- Storage: Salvo em campo `customImage` de `Entry`
- Status: ✅ Funcional

#### 5.2 **PosterChoice Model** (JÁ EXISTE NO SCHEMA)
```prisma
model PosterChoice {
  id String @id @default(cuid())
  key String @unique
  mediaType String
  tmdbId Int
  seasonNumber Int?
  title String?
  posterPath String         // Caminho do poster escolhido
  officialPosterPath String?  // Para comparação
  source String @default("tmdb")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([mediaType, tmdbId])
  @@index([key])
}
```

Status: ✅ Já existe no banco

#### 5.3 **Funções Utility** (PARCIALMENTE IMPLEMENTADO)
- `src/lib/poster-system.ts` contém:
  - `posterChoiceKey()` — Gera chave única para um título
  - `normalizePosterPath()` — Valida e normaliza caminhos
  - `posterUrl()` — Constrói URL final do TMDB
  - `choiceIsActive()` — Verifica se escolha ainda é válida
  - `getPosterChoice()` — Busca do banco
  - `resolvePosterChoicePath()` — Resolve customizado vs oficial
  - `resolveEntryPosterPath()` — Wrapper completo

Status: ✅ Funções básicas existem

#### 5.4 **Sincronização** (PARCIALMENTE IMPLEMENTADO)
- `src/lib/entry-poster-sync.ts`
- Sincroniza quando `Entry.imagePath` muda
- Status: ⏳ Existe mas não é usado em tudo

---

## Arquitetura Completa

### 🎯 Hierarquia de Resoluçãao de Capas

Quando um componente precisa renderizar uma capa, a resolução segue essa ordem:

```
┌─────────────────────────────────────────────┐
│ 1. PosterChoice customizada pelo usuário?   │
│    (existe PosterChoice com key do título)  │
└──────────────┬──────────────────────────────┘
               ↓ SIM
        ┌────────────────────┐
        │ Usar posterPath     │
        │ (da PosterChoice)   │
        │ ✅ FIM              │
        └────────────────────┘

        ↓ NÃO
┌─────────────────────────────────────────────┐
│ 2. Custom Image uploaded em Entry?          │
│    (existe Entry.customImage)               │
└──────────────┬──────────────────────────────┘
               ↓ SIM
        ┌────────────────────┐
        │ Usar customImage    │
        │ (upload do user)    │
        │ ✅ FIM              │
        └────────────────────┘

        ↓ NÃO
┌─────────────────────────────────────────────┐
│ 3. Poster oficial do TMDB?                  │
│    (usar poster_path do response TMDB)      │
└──────────────┬──────────────────────────────┘
               ↓ SIM
        ┌────────────────────┐
        │ Usar poster_path    │
        │ (do TMDB)           │
        │ ✅ FIM              │
        └────────────────────┘

        ↓ NÃO (raro)
        ┌────────────────────┐
        │ Placeholder/default │
        │ ✅ FIM              │
        └────────────────────┘
```

### Função de Resolução Completa

```typescript
// src/lib/poster-system.ts

export async function resolveEntryPosterPath(args: {
  mediaType: PosterMediaType;
  tmdbId: number;
  seasonNumber?: number | null;
  liveOfficialPosterPath?: string | null;
  fallbackPosterPath?: string | null;
}): Promise<string | null> {
  const identity: PosterIdentity = {
    mediaType: args.mediaType,
    tmdbId: args.tmdbId,
    seasonNumber: args.seasonNumber,
  };

  // Step 1: PosterChoice customizada
  const chosen = await resolvePosterChoicePath(args, args.liveOfficialPosterPath);
  if (chosen) return chosen;

  // Step 2: Fallback do Entry.customImage
  if (args.fallbackPosterPath) return args.fallbackPosterPath;

  // Step 3: Official do TMDB
  const official = normalizePosterPath(args.liveOfficialPosterPath);
  if (official) return official;

  return null;
}

export async function resolvePosterChoicePath(
  identity: PosterIdentity,
  liveOfficialPosterPath?: string | null,
): Promise<string | null> {
  const choice = await getPosterChoice(identity);
  
  if (!choiceIsActive(choice, liveOfficialPosterPath)) {
    // Poster oficial mudou, invalidar escolha
    return null;
  }
  
  return normalizePosterPath(choice?.posterPath);
}
```

---

## Fluxo de Dados de Capas

### Quando Usuário Customiza

```
User em title/[id]
         ↓
Clica "Choose Alternative Poster"
         ↓
Seleciona poster de lista alternativas (TMDB)
         ↓
POST /api/posters/choice
  {
    mediaType: "TV_SEASON",
    tmdbId: 1234,
    seasonNumber: 1,
    posterPath: "/path/to/poster.jpg",
    officialPosterPath: "/official/poster.jpg"
  }
         ↓
Cria/atualiza PosterChoice no banco
         ↓
Response: { success: true, choice: { ... } }
         ↓
Client refresca UI, exibe novo poster
         ↓
próximas requisições para esse título
usarão a PosterChoice salva
```

### Quando Componente Renderiza Título

```
Component (MediaCard, RelCard, etc)
         ↓
Tem { tmdbId, parentTmdbId, seasonNumber, poster_path }
         ↓
Chama resolveEntryPosterPath({
  mediaType: tipo,
  tmdbId,
  seasonNumber,
  liveOfficialPosterPath: poster_path
})
         ↓
Função checa:
  1. Existe PosterChoice? SIM → Usar
  2. Não? Tem customImage? SIM → Usar
  3. Não? Usar poster_path (TMDB)
         ↓
Retorna URL final
         ↓
Component renderiza com src={url}
         ↓
Mesmo poster em HOME, SEARCH, RELATIONS, etc.
```

---

## Modelo de Dados

### Prisma Schema (Atual)

```prisma
model Entry {
  // ... existing fields ...
  
  imagePath String?           // Poster original do TMDB
  customImage String?         // Upload customizado do user
  
  // Relations
  relationsFrom Relation[] @relation("SourceRelations")
  relationsTo Relation[] @relation("TargetRelations")
}

model PosterChoice {
  id String @id @default(cuid())
  
  key String @unique  // E.g. "tv:1234:s1" ou "movie:5678"
  
  mediaType String    // "MOVIE" ou "TV_SEASON"
  tmdbId Int
  seasonNumber Int?   // Null para filmes
  
  title String?       // Para referência
  
  posterPath String         // Path do poster escolhido pelo user
  officialPosterPath String?  // Path oficial do TMDB (para invalidação)
  
  source String @default("tmdb")  // "tmdb", "user-upload", etc.
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([key])
  @@index([mediaType, tmdbId])
}

model Relation {
  // ... existing fields ...
  
  // Integração com poster system
  // Quando renderiza RelCard, usa resolveEntryPosterPath()
}
```

### Geração de Chave (Única por Título)

```typescript
export function posterChoiceKey(identity: PosterIdentity): string {
  if (identity.mediaType === 'MOVIE') {
    return `movie:${identity.tmdbId}`;
  }
  // TV_SEASON
  return `tv:${identity.tmdbId}:s${identity.seasonNumber ?? 1}`;
}

// Exemplos:
// - Filme: "movie:550"
// - Série S1: "tv:1399:s1"
// - Série S5: "tv:1399:s5"
```

---

## Implementação Detalhada

### Step 1: API Route — Salvar PosterChoice

Criar/melhorar `src/app/api/posters/route.ts`:

```typescript
import { prisma } from '@/lib/prisma';
import { posterChoiceKey, PosterIdentity } from '@/lib/poster-system';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      mediaType,
      tmdbId,
      seasonNumber,
      title,
      posterPath,
      officialPosterPath,
      source,
    } = body;

    // Validação
    if (!mediaType || !tmdbId || !posterPath) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const identity: PosterIdentity = {
      mediaType: mediaType as 'MOVIE' | 'TV_SEASON',
      tmdbId,
      seasonNumber,
    };

    const key = posterChoiceKey(identity);

    // Upsert
    const choice = await prisma.posterChoice.upsert({
      where: { key },
      create: {
        key,
        mediaType,
        tmdbId,
        seasonNumber,
        title,
        posterPath,
        officialPosterPath,
        source: source || 'tmdb',
      },
      update: {
        posterPath,
        officialPosterPath,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(choice, { status: 200 });
  } catch (error) {
    console.error('[/api/posters] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json(
        { error: 'key parameter required' },
        { status: 400 }
      );
    }

    const choice = await prisma.posterChoice.findUnique({
      where: { key },
    });

    return NextResponse.json(choice, { status: 200 });
  } catch (error) {
    console.error('[/api/posters GET] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Step 2: UI em Title Page para Escolher Capa

Melhorar `src/app/titles/[id]/page.tsx` — Seção de Customização:

```typescript
// Dentro do componente TitlePage

function CustomizationSection() {
  const [alternativePosterOptions, setAlternativePosterOptions] = useState([]);
  const [selectedPosterPath, setSelectedPosterPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadAlternativePoster() {
      try {
        const isTv = entry?.type === 'TV_SEASON';
        const endpoint = isTv
          ? `https://api.themoviedb.org/3/tv/${entry?.parentTmdbId ?? entry?.tmdbId}/images?api_key=${API_KEY}&language=en-US&include_image_language=en,null`
          : `https://api.themoviedb.org/3/movie/${entry?.tmdbId}/images?api_key=${API_KEY}&language=en-US&include_image_language=en,null`;

        const res = await fetch(endpoint);
        const data = await res.json();
        setAlternativePosterOptions(data.posters || []);
      } catch (error) {
        console.error('Error loading alternative posters:', error);
      }
    }

    if (entry?.tmdbId) {
      loadAlternativePoster();
    }
  }, [entry?.tmdbId]);

  async function handleSavePosterChoice(posterPath: string) {
    setLoading(true);
    try {
      const identity: PosterIdentity = {
        mediaType: entry?.type === 'TV_SEASON' ? 'TV_SEASON' : 'MOVIE',
        tmdbId: entry?.parentTmdbId ?? entry?.tmdbId,
        seasonNumber: entry?.seasonNumber,
      };

      const response = await fetch('/api/posters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaType: identity.mediaType,
          tmdbId: identity.tmdbId,
          seasonNumber: identity.seasonNumber,
          title: entry?.title,
          posterPath,
          officialPosterPath: entry?.imagePath,
          source: 'tmdb',
        }),
      });

      if (response.ok) {
        const choice = await response.json();
        setSelectedPosterPath(posterPath);
        // Refresca UI, mostra novo poster
        emitXPNotification({
          message: '📸 Capa customizada com sucesso!',
          earnedXp: 0,
        });
      }
    } catch (error) {
      console.error('Error saving poster choice:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="customization-section">
      <h3>Customizar Capa</h3>

      <div className="poster-gallery">
        <h4>Posters Alternativos</h4>
        <div className="gallery-grid">
          {alternativePosterOptions.map((poster, idx) => (
            <div
              key={idx}
              className={`poster-option ${selectedPosterPath === poster.file_path ? 'selected' : ''}`}
              onClick={() => handleSavePosterChoice(poster.file_path)}
            >
              <img
                src={`https://image.tmdb.org/t/p/w342${poster.file_path}`}
                alt={`Poster option ${idx}`}
              />
              {selectedPosterPath === poster.file_path && (
                <div className="selected-badge">✓ Selecionado</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Upload customizado */}
      <div className="custom-upload">
        <h4>Upload Customizado</h4>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleCustomImageUpload(e)}
          disabled={loading}
        />
      </div>
    </section>
  );
}
```

### Step 3: Usar em Componentes de Renderização

Melhorar `MediaCard`, `RelCard`, e outros:

```typescript
// src/components/MediaCard.tsx

import { resolveEntryPosterPath } from '@/lib/poster-system';

interface MediaCardProps {
  item: {
    id?: string;
    tmdbId: number;
    parentTmdbId?: number;
    seasonNumber?: number;
    type: 'MOVIE' | 'TV_SEASON';
    poster_path: string | null;
    customImage?: string | null;
    title: string;
    // ... other fields
  };
}

export default async function MediaCard({ item }: MediaCardProps) {
  // Resolve poster respeitando PosterChoice
  const finalPosterPath = await resolveEntryPosterPath({
    mediaType: item.type,
    tmdbId: item.parentTmdbId ?? item.tmdbId,
    seasonNumber: item.seasonNumber,
    liveOfficialPosterPath: item.poster_path,
    fallbackPosterPath: item.customImage,
  });

  const posterUrl = finalPosterPath 
    ? `https://image.tmdb.org/t/p/w500${finalPosterPath}`
    : '/placeholder-poster.jpg';

  return (
    <div className="media-card">
      <img src={posterUrl} alt={item.title} />
      <h3>{item.title}</h3>
      {/* ... rest of card ... */}
    </div>
  );
}
```

---

## Pontos de Integração

### Componentes que Renderizam Capas

| Componente | Caminho | Ação necessária |
|---|---|---|
| `MediaCard` | `src/components/MediaCard.tsx` | ✅ Usar `resolveEntryPosterPath()` |
| `RelCard` | `src/app/titles/[id]/page.tsx` | ✅ Usar `resolveEntryPosterPath()` |
| `AiringProgressCard` | `src/components/AiringProgressCard.tsx` | ✅ Usar |
| `NextUpCard` | `src/components/NextUpCard.tsx` | ✅ Usar |
| `EpisodeGrid` | `src/components/EpisodeGrid.tsx` | ✅ Usar |
| `AchievementShowcase` | `src/components/AchievementShowcase.tsx` | ✅ Verificar |
| `ChallengeWidget` | `src/components/ChallengeWidget.tsx` | ✅ Verificar |
| `SpinTheWheel` | `src/components/SpinTheWheel.tsx` | ✅ Usar |
| `ReleaseCalendar` | `src/components/ReleaseCalendar.tsx` | ✅ Verificar |

### Pages que Renderizam Capas

| Page | Caminho | Ação necessária |
|---|---|---|
| Home | `src/app/page.tsx` | ✅ Usar em todas as sections |
| Search | `src/app/search/page.tsx` | ✅ Usar em resultados |
| Title | `src/app/titles/[id]/page.tsx` | ✅ Usar em relations |
| Profile | `src/app/profile/page.tsx` | ✅ Verificar cards |
| Browser | `src/app/browser/page.tsx` | ✅ Verificar |

---

## Plano de Implementação

### 🗓 Fases Recomendadas

**Phase 1 (Imediato)** — Infraestrutura Básica
- [ ] Confirmar `PosterChoice` model está correto
- [ ] Implementar API route `/api/posters` (POST/GET)
- [ ] Testar salvamento básico

**Phase 2 (1 semana)** — Integração em Title Page
- [ ] Melhorar UI de customização em title/[id]
- [ ] Implementar picker de capas alternativas
- [ ] Implementar upload customizado
- [ ] Testar com vários títulos

**Phase 3 (2 semanas)** — Propagação Global
- [ ] Atualizar `MediaCard` para usar resolução
- [ ] Atualizar `RelCard`
- [ ] Atualizar Home page (todas as sections)
- [ ] Atualizar Search results
- [ ] Atualizar Profile cards

**Phase 4 (Polish)**
- [ ] Testar em todos os breakpoints
- [ ] Verificar performance (cache PosterChoice?)
- [ ] Remover capas duplicadas/corrigir inconsistências

### ✅ Checkpoints

- [ ] Customizar capa em title/[id]
- [ ] Mesma capa aparece em Relations
- [ ] Mesma capa aparece em Home/Search
- [ ] Mesma capa aparece em Profile
- [ ] Trocar capa — todas as pages atualizam
- [ ] Performance: Carregar 100 cards < 2s
- [ ] Mobile responsivo

---

## Referências

- TMDB Images API: https://developer.themoviedb.org/docs/get-tv-images
- Poster Sizes: https://www.themoviedb.org/settings/api/images
- Existing Poster System: `src/lib/poster-system.ts`
- Entry Poster Sync: `src/lib/entry-poster-sync.ts`
