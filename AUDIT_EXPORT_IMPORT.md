# 🔍 Auditoria Completa: Fluxo de Export/Import

**Data**: 29 de Abril de 2026  
**Status**: ⚠️ CRÍTICO - Múltiplos problemas encontrados  
**Risco**: Dados INCOMPLETOS ao restaurar backup

---

## 📋 Resumo Executivo

O sistema de export/import **NÃO está 100% funcional**. Há inconsistências sérias entre:
- ✅ O que é exportado (COMPLETO)
- ❌ O que é importado de volta (INCOMPLETO)
- ❌ O que está na interface TypeScript (INCOMPLETO)

**Resultado**: Um backup completo será **restaurado parcialmente**, perdendo campos importantes.

---

## 🔴 Problemas Críticos Encontrados

### 1. **IMPORT INCOMPLETO - Campos não restaurados no update()**

**Arquivo**: `/src/app/api/entries/import/route.ts`

Quando um entry JÁ EXISTE, o `update()` perde estes campos:
```typescript
// ❌ FALTAM NO UPDATE:
rating           // PERDIDO
popularity       // PERDIDO
bannerPath       // PERDIDO
studio           // PERDIDO
genres           // PERDIDO
releaseDate      // PERDIDO
endDate          // PERDIDO
format           // PERDIDO
customImage      // PERDIDO
private          // PERDIDO
favoriteRank     // PERDIDO
synopsis         // PERDIDO
createdAt        // PERDIDO (não pode ser atualizado, mas deveria ser preservado)
```

**Impacto**: Ao importar um backup sobre uma entrada existente, esses campos **não serão restaurados**.

---

### 2. **CREATE Incompleto - Campos faltam no insert novo**

Campos faltando quando criando entry nova:
```typescript
// ❌ FALTAM NO CREATE:
rating           // PERDIDO
popularity       // PERDIDO
bannerPath       // PERDIDO
customImage      // PERDIDO
private          // PERDIDO
favoriteRank     // PERDIDO
synopsis         // PERDIDO
studio           // PERDIDO
endDate          // PERDIDO (SÓ tá no update, não no create!)
```

---

### 3. **Interface TypeScript Desatualizada**

**Arquivo**: `/src/app/profile/page.tsx` (linhas ~10-30)

```typescript
interface Entry {
  // ... campos ...
  // ❌ FALTA:
  popularity: number;      // NÃO ESTÁ DEFINIDO
  customImage: string | null;
  private: boolean;
  favoriteRank: number | null;
  synopsis: string | null;
  bannerPath: string | null; // ✓ está, mas não usado em export
  studio: string | null;    // ✓ está, mas não usado em export
}
```

---

### 4. **Tipo de Dados Inconsistente**

No import, `rating` deveria ser Float, mas não há tratamento:
```json
// ✅ No backup (correto):
"rating": 7.771,
"popularity": 7.3672

// ❌ No import (não trata):
rating: e.rating ?? 0,    // Não existe no create!
popularity: e.popularity  // Não existe no create!
```

---

### 5. **Campos Relacionados NÃO são Exportados/Importados**

#### a) **Relações entre entradas** (Relation model)
```typescript
// ❌ TOTALMENTE IGNORADO:
relationsFrom  // Não exportado
relationsTo    // Não exportado
```

**Impacto**: Se você tem relacionamentos (ex: "assistiu depois de", "relacionado com"), eles **SERÃO PERDIDOS** no backup.

#### b) **ActivityLog** (histórico de atividades)
```typescript
// ❌ TOTALMENTE IGNORADO:
ActivityLog model // Não exportado
// Histórico completo de quando foi adicionado, atualizado, etc.
```

**Impacto**: Todo o histórico de atividades será perdido.

#### c) **Profile** (informações do usuário)
```typescript
// ❌ TOTALMENTE IGNORADO:
Profile model  // Não exportado
// Username, bio, avatar, banner
```

**Impacto**: Configurações do perfil não serão restauradas.

---

### 6. **Datas Malformadas**

No `parseDate()`:
```typescript
function parseDate(val: string | null | undefined): Date | null {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}
```

**Problema**: Espera string YYYY-MM-DD, mas o backup às vezes tem ISO strings completas:
```json
"startDate": "2025-01-20",     // ✓ OK
"updatedAt": "2026-04-29T16:23:04.156Z"  // ❌ Não será parseado
```

---

### 7. **Export não respeita createdAt**

**Arquivo**: `/src/app/api/entries/route.ts` (GET)

```typescript
// ✓ Serializa corretamente, MAS:
const serialized = entries.map(entry => ({
  ...entry,
  startDate: entry.startDate?.toISOString().split('T')[0] ?? null,
  finishDate: entry.finishDate?.toISOString().split('T')[0] ?? null,
  updatedAt: entry.updatedAt.toISOString(),
  // ❌ NÃO serializa createdAt!
}));
```

No import, `createdAt` também não é restaurado:
```typescript
create: {
  // ❌ createdAt não é passado
  // Default vai ser now(), perdendo data original
}
```

---

## 📊 Tabela de Comparação

| Campo | Exported | Imported | Update | Create | Frontend Interface |
|-------|----------|----------|--------|--------|-------------------|
| id | ✅ | ✅ | N/A | ✅ | ✅ |
| tmdbId | ✅ | ✅ | ❌ | ✅ | ✅ |
| title | ✅ | ✅ | ❌ | ✅ | ✅ |
| type | ✅ | ✅ | ❌ | ✅ | ✅ |
| status | ✅ | ✅ | ✅ | ✅ | ✅ |
| score | ✅ | ✅ | ✅ | ✅ | ✅ |
| progress | ✅ | ✅ | ✅ | ✅ | ✅ |
| **rating** | ✅ | ❌ | ❌ | ❌ | ✅ |
| **popularity** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **bannerPath** | ✅ | ❌ | ❌ | ❌ | ✅ |
| **studio** | ✅ | ✅ | ❌ | ❌ | ✅ |
| **genres** | ✅ | ✅ | ❌ | ✅ | ✅ |
| releaseDate | ✅ | ✅ | ❌ | ✅ | ✅ |
| **endDate** | ✅ | ✅ | ❌ | ❌ | - |
| format | ✅ | ✅ | ❌ | ✅ | ✅ |
| imagePath | ✅ | ✅ | ❌ | ✅ | ✅ |
| **customImage** | ✅ | ❌ | ❌ | ❌ | - |
| **private** | ✅ | ❌ | ❌ | ❌ | - |
| **synopsis** | ✅ | ❌ | ❌ | ❌ | - |
| **favoriteRank** | ✅ | ❌ | ❌ | ❌ | - |
| **createdAt** | ✅ | ❌ | ❌ | ❌ | - |
| notes | ✅ | ✅ | ✅ | ✅ | ✅ |
| isFavorite | ✅ | ✅ | ✅ | ✅ | ✅ |
| hidden | ✅ | ✅ | ✅ | ✅ | ✅ |
| rewatchCount | ✅ | ✅ | ✅ | ✅ | ✅ |
| startDate | ✅ | ✅ | ✅ | ✅ | ✅ |
| finishDate | ✅ | ✅ | ✅ | ✅ | ✅ |
| parentTmdbId | ✅ | ✅ | ❌ | ✅ | ✅ |
| seasonNumber | ✅ | ✅ | ❌ | ✅ | ✅ |
| totalEpisodes | ✅ | ✅ | ❌ | ✅ | ✅ |

---

## 🔗 Tabela de Relações Não Importadas

| Entidade | Status | Impacto |
|----------|--------|--------|
| **Entry ↔ Entry** (Relation model) | ❌ NÃO EXPORTADO | Relacionamentos perdidos (sequências, spin-offs, etc) |
| **ActivityLog** | ❌ NÃO EXPORTADO | Histórico completo perdido |
| **Profile** | ❌ NÃO EXPORTADO | Configurações de usuário perdidas |

---

## 🎯 Cenário Real: O que acontece ao importar um backup completo

### Cenário A: Banco vazio
```
✅ Funciona bem (usa create)
❌ MAS perde: rating, popularity, bannerPath, customImage, private, favoriteRank, synopsis, endDate, createdAt
```

### Cenário B: Banco com alguns dados
```
✅ Para entradas novas: usa create (menos campos)
⚠️ Para entradas existentes: usa update (MUITO menos campos!)
   → rating, popularity, bannerPath, studio, genres, releaseDate, endDate, format, customImage, private, favoriteRank, synopsis - TODOS PERDIDOS
```

### Cenário C: Restauração após perda total
```
❌ ActivityLog: NÃO será restaurado
❌ Relações: NÃO serão restauradas
❌ Profile: NÃO será restaurado
❌ 17+ campos por entry serão perdidos
```

---

## 🛠️ Solução Recomendada

### Passo 1: Atualizar Interface TypeScript
```typescript
interface Entry {
  // ... existentes ...
  popularity: number;
  customImage: string | null;
  private: boolean;
  favoriteRank: number | null;
  synopsis: string | null;
  studio: string | null;
  staff: any; // JSON
  createdAt: string;
}
```

### Passo 2: Corrigir o Endpoint de Import
Adicionar TODOS os campos ao `update()` e `create()`

### Passo 3: Exportar Relações
```typescript
// Adicionar ao export: relationsFrom, relationsTo
```

### Passo 4: Exportar ActivityLog e Profile
Criar endpoints separados ou incluir no mesmo JSON

### Passo 5: Preservar createdAt
```typescript
create: {
  // ...
  createdAt: e.createdAt ? new Date(e.createdAt) : undefined,
}
```

---

## 📝 Recomendação Final

**NÃO recomendo usar o sistema atual como backup confiável**. Implementar as correções acima antes de confiar nele para restauração em caso de desastre.

Estimar: **~1-2 horas** para corrigir tudo.
