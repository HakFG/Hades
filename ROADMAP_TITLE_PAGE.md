# HADES — Roadmap TITLE PAGE (`app/titles/[id]/page.tsx`)

> **Última atualização:** Maio 2026  
> **Status:** Complexo, com sistema de Relations em desenvolvimento  
> **Arquivos associados:** `src/app/titles/[id]/page.tsx`, `src/lib/relations-manager.ts`, `src/lib/poster-system.ts`

---

## 📊 Índice

1. [Análise Atual do Estado](#análise-atual-do-estado)
2. [Implementações Já Existentes](#implementações-já-existentes)
3. [Sistema de Relations (CRÍTICO)](#sistema-de-relations-crítico)
4. [Sistema de Capas (Integração)](#sistema-de-capas-integração)
5. [Features a Implementar](#features-a-implementar)
6. [Arquitetura Técnica](#arquitetura-técnica)
7. [Plano de Implementação](#plano-de-implementação)

---

## Análise Atual do Estado

### 🎯 O que a Página de Título já é

`src/app/titles/[id]/page.tsx` é um **Client Component complexo** que renderiza:
- Detalhes completos de um título (série ou filme)
- Múltiplas abas: Overview, Episodes, Characters, Staff, Videos, Relations
- Sistema de customização de poster
- Sistema de relações (relacionados, sequências, spin-offs)
- Integração com banco de dados do usuário

**Características atuais**:
- **Tipo**: Client-side com Suspense
- **Abas**: Overview | Episodes | Characters | Staff | Videos
- **Dados primários**: TMDB API (details, credits, videos, etc.)
- **Dados secundários**: `prisma.entry` (notas, customImage, relations)
- **Performance**: Carrega dados sob demanda por aba
- **Tamanho do arquivo**: ~2000+ linhas

### ✅ O que já funciona

#### 3.1 **Overview Tab** (JÁ IMPLEMENTADO)
- Renderiza: Poster, título, sinopse, rating, genres, networks, studios, etc.
- Inclui: Botões de ação (Add to List, Mark as Watched, etc.)
- Dados: TMDB detalhe + Entry do usuário
- **Status**: ✅ Completo

#### 3.2 **Episodes Tab** (JÁ IMPLEMENTADO)
- Para séries: Lista todas as temporadas + episódios
- Para filmes: Não aparece
- Grid de episódios com air date, número, nome
- Progress visual do que foi assistido
- **Status**: ✅ Completo com paginação

#### 3.3 **Characters Tab** (JÁ IMPLEMENTADO)
- Renderiza: Elenco (atores) com foto, nome, personagem
- Dados: TMDB `/credits` endpoint
- Cards clicáveis que navegar para `/staff/[person-id]`
- **Status**: ✅ Completo

#### 3.4 **Staff Tab** (JÁ IMPLEMENTADO)
- Renderiza: Crew organizado por departamento (Directors, Writers, Producers, etc.)
- Dados: TMDB `/credits` departamento
- Filtro por papel
- **Status**: ✅ Completo

#### 3.5 **Videos Tab** (JÁ IMPLEMENTADO)
- Renderiza: Trailers, teasers, clipes
- Dados: TMDB `/videos` endpoint
- Player embedded YouTube
- **Status**: ✅ Completo

#### 3.6 **Sistema de Customização de Poster** (JÁ IMPLEMENTADO)
- Upload de imagem customizada via `customImage` field
- Seleção de poster alternativo via `posterChoice`
- Integração com `src/lib/poster-system.ts`
- Exibição do poster selecionado em todo o site
- **Status**: ✅ Funcional mas precisa de UI polish

#### 3.7 **Relations - Base** (PARCIALMENTE IMPLEMENTADO)
- Funcionalidade: Exibe relações entre títulos
- Componente: `RelCard` renderiza relações
- Dados: Vem de `Relation` model do Prisma
- Tipos suportados: Sequel, Prequel, Spin-off, Side Story, Other
- **Limitações**:
  - Não tem seleção de tipo durante criação
  - Não diferencia bem entre tipos
  - UI para editar relações é minimal
- **Status**: ⏳ Funcional mas incompleto

#### 3.8 **Relations - Automáticas** (PARCIALMENTE IMPLEMENTADO)
- Busca sequências automáticas via TMDB `/movie/{id}/collection`
- Detecta prequels via lógica customizada
- Armazena em `Relation` com tipo apropriado
- **Status**: ⏳ Funciona com limitações

#### 3.9 **Recommendations** (JÁ IMPLEMENTADO)
- Renderiza: Títulos recomendados similares
- Dados: TMDB `/recommendations` endpoint
- Cards clicáveis
- **Status**: ✅ Completo

---

## Implementações Já Existentes

### Componentes

| Componente | Localização | Propósito | Status |
|---|---|---|---|
| `RelCard` | `src/app/titles/[id]/page.tsx` (subcomponente) | Renderiza relação individual | ✅ |
| `CharCard` | `src/app/titles/[id]/page.tsx` (subcomponente) | Renderiza ator individual | ✅ |
| `StaffCard` | `src/app/titles/[id]/page.tsx` (subcomponente) | Renderiza membro staff | ✅ |
| `RecCard` | `src/app/titles/[id]/page.tsx` (subcomponente) | Renderiza recomendação | ✅ |

### Libs

| Lib | Caminho | Propósito | Status |
|---|---|---|---|
| `relations-manager` | `src/lib/relations-manager.ts` | Gerencia operações com relations | ✅ |
| `poster-system` | `src/lib/poster-system.ts` | Seleciona/normaliza posters | ✅ |
| `tmdb-airing` | `src/lib/tmdb-airing.ts` | Busca data de airing TMDB | ✅ |
| `entry-poster-sync` | `src/lib/entry-poster-sync.ts` | Sincroniza poster quando poster muda | ✅ |

### APIs

| Rota | Método | Propósito |
|---|---|---|
| `/api/relations` | GET | Busca relações de um título |
| `/api/relations` | POST | Cria nova relação |
| `/api/relations/[id]` | DELETE | Remove relação |
| `/api/relations/import` | POST | Importa relações automáticas |
| `/api/posters` | POST | Salva escolha de poster |
| `/api/entries?tmdbId=*` | GET | Busca entry para adicionar à lista |

---

## Sistema de Relations (CRÍTICO)

### 🔴 Problema Atual

O sistema de relations tem várias limitações:

1. **Tipos não diferenciados bem**: Todos são tratados similares na UI
2. **UI de edição minimal**: Não há editor visual robusto
3. **Lógica automática incompleta**: Não detecta todos os tipos de relação
4. **Sem validação de tipo**: Usuário pode criar relações incoerentes

### ✅ Solução Recomendada

#### Phase 1: Estender Schema Prisma (Migration requerida)

Atual `Relation` model:
```prisma
model Relation {
  id String @id @default(cuid())
  sourceEntryId String
  targetEntryId String?
  relationType String  // "Sequel", "Prequel", "Spin-off", etc.
  title String
  poster_path String?
  kind String  // "movie" ou "tv"
  year String?
  seasonNumber Int?
  order Int?
  targetTmdbId Int
  targetParentTmdbId Int?
  targetSeasonNumber Int?
  targetType String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  sourceEntry Entry @relation("SourceRelations", fields: [sourceEntryId], references: [id], onDelete: Cascade)
  targetEntry Entry? @relation("TargetRelations", fields: [targetEntryId], references: [id], onDelete: SetNull)
  @@unique([sourceEntryId, targetTmdbId])
  @@index([sourceEntryId])
  @@index([targetEntryId])
}
```

**Recomendação**: Adicionar campos:
```prisma
model Relation {
  // ... existing fields ...
  
  // Novo: validar tipo de relação
  relationType RelationType  // Enum em vez de String
  
  // Novo: marcar como automático vs manual
  isAutomatic Boolean @default(false)
  
  // Novo: order para sequências
  sequenceOrder Int?
  
  // Novo: metadata para spin-offs
  spinoffMetadata Json?  // { characters: string[], universe: string }
}

enum RelationType {
  SEQUEL
  PREQUEL
  SPIN_OFF
  SIDE_STORY
  OTHER
}
```

**Migration**:
```bash
npx prisma migrate dev --name enhance_relations_type_and_metadata
```

---

#### Phase 2: Melhorar UI de Edição de Relations

Criar componente `src/components/RelationsEditor.tsx`:

```typescript
interface RelationsEditorProps {
  sourceEntryId: string;
  onSave: (relation: Relation) => void;
}

export default function RelationsEditor({ sourceEntryId, onSave }: RelationsEditorProps) {
  const [step, setStep] = useState<'search' | 'type' | 'confirm'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [selectedType, setSelectedType] = useState<RelationType | null>(null);

  const relationsTypes = [
    {
      type: 'SEQUEL',
      label: 'Sequência',
      description: 'Continuação direta da história',
      icon: '→'
    },
    {
      type: 'PREQUEL',
      label: 'Prelúdio',
      description: 'Ocorre antes dos eventos',
      icon: '←'
    },
    {
      type: 'SPIN_OFF',
      label: 'Spin-off',
      description: 'Derivação com personagens/universo',
      icon: '↗'
    },
    {
      type: 'SIDE_STORY',
      label: 'História Paralela',
      description: 'Mesmo universo mas independent',
      icon: '↔'
    },
    {
      type: 'OTHER',
      label: 'Outro',
      description: 'Crossover ou outra ligação',
      icon: '◊'
    }
  ];

  // Step 1: Search
  if (step === 'search') {
    return (
      <div className="relations-editor-search">
        <input
          placeholder="Buscar título relacionado..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            // Fetch search results
          }}
        />
        <div className="search-results">
          {searchResults.map(result => (
            <div
              key={result.id}
              className="search-result-item"
              onClick={() => {
                setSelectedTarget(result);
                setStep('type');
              }}
            >
              <img src={posterUrl(result.poster_path)} alt={result.title} />
              <div>
                <h4>{result.title}</h4>
                <p>{result.year || result.release_date?.split('-')[0]}</p>
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => setStep(null)}>Cancel</button>
      </div>
    );
  }

  // Step 2: Select Type
  if (step === 'type' && selectedTarget) {
    return (
      <div className="relations-editor-type">
        <h3>Que tipo de relação é {selectedTarget.title}?</h3>
        <div className="relation-types-grid">
          {relationsTypes.map(rt => (
            <button
              key={rt.type}
              className={`relation-type-button ${selectedType === rt.type ? 'active' : ''}`}
              onClick={() => setSelectedType(rt.type as RelationType)}
            >
              <span className="icon">{rt.icon}</span>
              <span className="label">{rt.label}</span>
              <span className="description">{rt.description}</span>
            </button>
          ))}
        </div>
        <div className="button-group">
          <button onClick={() => setStep('search')}>Back</button>
          <button 
            onClick={() => setStep('confirm')}
            disabled={!selectedType}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  // Step 3: Confirm
  if (step === 'confirm' && selectedTarget && selectedType) {
    return (
      <div className="relations-editor-confirm">
        <h3>Confirmar Relação</h3>
        <div className="confirmation">
          <div className="source-target">
            <div className="item">
              <strong>De:</strong> [sourceEntry.title]
            </div>
            <span className="relation-icon">
              {relationsTypes.find(rt => rt.type === selectedType)?.icon}
            </span>
            <div className="item">
              <strong>Para:</strong> {selectedTarget.title}
            </div>
          </div>
        </div>
        <div className="button-group">
          <button onClick={() => setStep('type')}>Back</button>
          <button 
            onClick={() => {
              // Save relation
              onSave({
                sourceEntryId,
                targetTmdbId: selectedTarget.id,
                relationType: selectedType,
                title: selectedTarget.title,
                // ... outros campos
              });
              setStep('search');
            }}
          >
            Save Relation
          </button>
        </div>
      </div>
    );
  }

  return null;
}
```

---

#### Phase 3: Melhorar Detecção Automática

Estender `src/lib/relations-manager.ts`:

```typescript
/**
 * Detecta automaticamente relações de um título TMDB
 * Estratégia: usar collection + TMDB relationships + lógica customizada
 */
export async function detectAutomaticRelations(
  tmdbId: number,
  kind: 'movie' | 'tv',
): Promise<SavedRelation[]> {
  const relations: SavedRelation[] = [];

  if (kind === 'movie') {
    // Buscam collection (sequências)
    const details = await fetchTmdbDetails(tmdbId, 'movie');
    if (details.belongs_to_collection) {
      const collection = details.belongs_to_collection;
      const collectionDetails = await fetchTmdbCollection(collection.id);
      
      // Detecta sequências e prequelas
      collectionDetails.parts.forEach(part => {
        if (part.id !== tmdbId) {
          const relationType = detectSequenceType(
            details.release_date,
            part.release_date,
            part.id === tmdbId + 1 ? 'likely_next' : 'unknown'
          );
          
          relations.push({
            sourceEntryId: '',  // Preenchido depois
            targetTmdbId: part.id,
            relationType,
            title: part.title,
            kind: 'movie',
            year: part.release_date?.split('-')[0],
            poster_path: part.poster_path,
            isAutomatic: true,
          });
        }
      });
    }
  } else {
    // Para TV: Procura spin-offs
    const details = await fetchTmdbDetails(tmdbId, 'tv');
    // Procura network, production company para encontrar spin-offs
    // Exemplo: "Breaking Bad" → "Better Call Saul" (mesmo criador)
    // Requer dataset customizado de relacionamentos conhecidos
  }

  return relations;
}

function detectSequenceType(
  dateA: string,
  dateB: string,
  hint?: string,
): RelationType {
  const yearA = parseInt(dateA.split('-')[0]);
  const yearB = parseInt(dateB.split('-')[0]);
  
  if (yearB > yearA) return RelationType.SEQUEL;
  if (yearB < yearA) return RelationType.PREQUEL;
  return RelationType.OTHER;
}
```

---

### 🎯 Fluxo Ideal de Relations

```
User vê título X na page
           ↓
"Relations" section mostra:
  • Automáticas (detectadas do TMDB)
  • Manuais (adicionadas pelo usuário)
           ↓
Ao clicar "Add Relation":
  1. User busca título
  2. Seleciona tipo (Sequel, Prequel, Spin-off, etc.)
  3. Sistema valida (não permite duplicatas)
  4. Salva em DB
           ↓
Relation aparece na UI com:
  • Ícone do tipo
  • Título e poster
  • Link para título
  • Botão para remover (apenas manual)
```

---

## Sistema de Capas (Integração)

**IMPORTANTE**: O sistema de capas é GLOBAL, descrito em `ROADMAP_POSTER_SYSTEM.md`. Aqui apenas a integração na Title Page.

### Integração Recomendada

Na Title Page, ao exibir relações, usar:

```typescript
// Em RelCard component:
import { resolveEntryPosterPath } from '@/lib/poster-system';

async function ResolvePosterForRelation(rel: RelationItem) {
  const poster = await resolveEntryPosterPath({
    mediaType: rel.kind === 'movie' ? 'MOVIE' : 'TV_SEASON',
    tmdbId: rel.targetTmdbId,
    seasonNumber: rel.targetSeasonNumber,
    liveOfficialPosterPath: rel.poster_path,
  });
  return poster ?? rel.poster_path;
}
```

---

## Features a Implementar

### 📌 Prioridade 1: Essencial

#### Feature 1.1: Relations Editor UI (Completo)
- Implementar 3-step wizard (search → type → confirm)
- Adicionar validação de tipo
- Melhorar remoção de relations
**Estimativa**: 5-6 horas

#### Feature 1.2: Melhorar Detecção Automática
- Estender lógica de Collection TMDB
- Adicionar heurística para spin-offs
- Testar com vários títulos
**Estimativa**: 4-5 horas

#### Feature 1.3: UI de Customização de Poster (Polish)
- Melhorar seletor de poster alternativo
- Adicionar drag-drop para upload
- Cropping tool para imagem custom
**Estimativa**: 3-4 horas

---

### 📌 Prioridade 2: Features Novas

#### Feature 2.1: "Cronograma de Sequências"
- Para séries/filmes com sequências, mostrar timeline visual
- Exemplo: Breaking Bad (S1-S5) → El Camino → Better Call Saul

**Estimativa**: 4 horas

#### Feature 2.2: "Estatísticas de Relações"
- Mostrar quantas relações o título tem
- Agrupar por tipo (sequelas, spin-offs, etc.)
- Gráfico visual

**Estimativa**: 2-3 horas

---

## Arquitetura Técnica

### Database Schema (Após Migration)

```prisma
enum RelationType {
  SEQUEL
  PREQUEL
  SPIN_OFF
  SIDE_STORY
  OTHER
}

model Relation {
  id String @id @default(cuid())
  
  // Chaves estrangeiras
  sourceEntryId String
  targetEntryId String?
  sourceEntry Entry @relation("SourceRelations", fields: [sourceEntryId], references: [id], onDelete: Cascade)
  targetEntry Entry? @relation("TargetRelations", fields: [targetEntryId], references: [id], onDelete: SetNull)
  
  // Informações da relação
  relationType RelationType
  title String
  poster_path String?
  kind String  // "movie" ou "tv"
  year String?
  seasonNumber Int?
  sequenceOrder Int?
  
  // Dados TMDB
  targetTmdbId Int
  targetParentTmdbId Int?
  targetSeasonNumber Int?
  targetType String?
  
  // Metadata
  isAutomatic Boolean @default(false)
  spinoffMetadata Json?
  
  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([sourceEntryId, targetTmdbId])
  @@index([sourceEntryId])
  @@index([targetEntryId])
  @@index([relationType])
}
```

### Componentes a Criar

| Componente | Localização | Propósito |
|---|---|---|
| `RelationsEditor` | `src/components/RelationsEditor.tsx` | UI wizard 3 steps |
| `RelationsTimeline` | `src/components/RelationsTimeline.tsx` | Timeline visual |
| `RelationsStats` | `src/components/RelationsStats.tsx` | Estatísticas |

---

## Plano de Implementação

### 🗓 Fases Sugeridas

**Phase 1 (Imediato)** — UI & Polish
- [ ] Implementar RelationsEditor com 3 steps
- [ ] Melhorar customização de poster
- [ ] Add validação de tipo de relation

**Phase 2 (1-2 semanas)**
- [ ] Estender detecção automática
- [ ] Adicionar RelationsTimeline
- [ ] Adicionar RelationsStats

**Phase 3 (Nice-to-have)**
- [ ] Cronograma visual de sequências
- [ ] Recomendação automática de próxima na série
- [ ] Bloqueio de edição de relações automáticas

---

## Referências

- TMDB Collections API: https://developer.themoviedb.org/docs/get-collection-details
- TMDB Credits: https://developer.themoviedb.org/docs/get-tv-credits
- Existing Relations Manager: `src/lib/relations-manager.ts`
- Existing Poster System: `src/lib/poster-system.ts`
