# 🔧 HADES - Correções e Melhorias Pendentes

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
│       ├── profile/route.ts              ← GET/PATCH perfil
│       ├── relations/route.ts            ← GET/POST/DELETE/PATCH relações
│       ├── update-entry/route.ts         ← POST atualizar (com customImage)
│       └── refresh-all/route.ts          ← POST sincronizar todos dados
├── components/
│   └── ListEditor.tsx                    ← Modal de edição (usado em 2 páginas)
└── lib/
    ├── prisma.ts                         ← Cliente Prisma singleton
    ├── tmdb.ts                           ← Fetching com retry automático
    ├── tmdb-titles.ts                    ← Busca especializada de títulos
    ├── tmdb-airing.ts                    ← Status de episódios
    ├── relations-manager.ts              ← Gerenciamento de relações
    └── utils.ts                          ← Helpers: getOrdinal, buildSeasonTitle, formatScore
```

---

## 🐛 BUGS E ERROS — P1 (CRÍTICOS)

---

### ✅ P1 · #1 — Relações: adicionar apaga as automáticas e não persiste após F5

- **Prioridade:** P1 — CRÍTICO
- **Status:** ⏳ Pendente
- **Estimativa:** 4–6h

#### Descrição

Ao adicionar uma relação manualmente na página de detalhe de um título:

1. As relações automáticas (vindas do TMDB via `getAutoRelations`) desaparecem imediatamente da UI.
2. Após pressionar F5, a relação manual também some (não persiste visualmente mesmo estando salva no banco).

A tabela `Relation` já existe no schema Prisma e a API (`/api/relations`) está funcional. O problema está **inteiramente na gestão de estado e no `useEffect` da página de detalhe**.

#### Causa Raiz (verificada na análise)

**Problema 1 — Estado único sobrescrevendo tudo:**

```typescript
// src/app/titles/[id]/page.tsx (linhas ~1800–1850)
useEffect(() => {
  const loadRelations = async () => {
    const saved = await fetchSavedRelations(entryId);
    const auto  = await getAutoRelations(tmdbId, isTV, fetchResult);
    const combined = await getCombinedRelations(saved, auto);
    setRelations(combined.all); // ← Um único array substitui tudo
  };
  loadRelations();
}, [entryId]);
```

Se `getAutoRelations()` falha (timeout, erro TMDB), retorna `[]` e `combined.all` fica apenas com as salvas (ou vazio). O F5 reexecuta esse fluxo, descartando o que estava visível.

**Problema 2 — `addRelation()` não isola o estado salvo:**

```typescript
// Linha ~1613 ou ~1646
const newRelation = await saveRelation(relation);
setRelations(prev => [...prev, newRelation]); // ← Adiciona ao array geral
// Mas no próximo reload, useEffect sobrescreve tudo novamente
```

**Problema 3 — Chamada dupla desnecessária a `/api/relations`:**

A rota GET `/api/relations` é chamada 2x (linhas ~1210 e ~1317), desperdiçando banda e aumentando chance de race condition.

#### Arquivos Envolvidos

| Arquivo | Linhas Aproximadas | O que alterar |
|---|---|---|
| `src/app/titles/[id]/page.tsx` | 1800–1850 | Separar estados; corrigir `useEffect` |
| `src/app/titles/[id]/page.tsx` | ~1613, ~1646 | Corrigir `addRelation` e `removeRelation` |
| `src/app/titles/[id]/page.tsx` | ~1210, ~1317 | Eliminar chamada dupla ao GET relations |
| `src/lib/relations-manager.ts` | `getCombinedRelations()` | Garantir merge correto sem duplicatas |
| `src/lib/tmdb-titles.ts` | `getAutoRelations()` | Garantir fallback sem retornar erro silencioso |
| `src/app/api/relations/route.ts` | POST, DELETE, GET | Verificar se handlers respondem corretamente |

#### Solução Esperada (passo a passo)

**Passo 1 — Separar os dois estados:**

```typescript
// titles/[id]/page.tsx
const [savedRelations, setSavedRelations] = useState<SavedRelation[]>([]);
const [autoRelations,  setAutoRelations]  = useState<AutoRelation[]>([]);

// Derivado: nunca um estado único sobrescrevendo o outro
const allRelations = useMemo(
  () => [...savedRelations, ...autoRelations],
  [savedRelations, autoRelations]
);
```

**Passo 2 — Corrigir o `useEffect` para não sobrescrever em caso de falha:**

```typescript
useEffect(() => {
  const loadRelations = async () => {
    // Salvas: sempre busca do banco
    const saved = await fetchSavedRelations(entryId);
    setSavedRelations(saved);

    // Auto: tenta buscar; falha não apaga as salvas
    try {
      const auto = await getAutoRelations(tmdbId, isTV, fetchResult);
      setAutoRelations(auto);
    } catch (err) {
      console.warn('[titles] Falha ao carregar relações automáticas:', err);
      // Estado anterior de autoRelations permanece intacto
    }
  };
  loadRelations();
}, [entryId]);
```

**Passo 3 — Corrigir `addRelation`:**

```typescript
const addRelation = async (relation: NewRelation) => {
  const newRelation = await saveRelation(relation); // POST /api/relations
  if (newRelation) {
    setSavedRelations(prev => [...prev, newRelation]); // Apenas salvas
    // Auto relations não são tocadas
  }
};
```

**Passo 4 — Corrigir `removeRelation`:**

```typescript
const removeRelation = async (targetTmdbId: number) => {
  await fetch(`/api/relations?sourceId=${entryId}&targetTmdbId=${targetTmdbId}`, {
    method: 'DELETE'
  });
  setSavedRelations(prev => prev.filter(r => r.targetTmdbId !== targetTmdbId));
  // Auto relations não são tocadas
};
```

**Passo 5 — Eliminar chamada GET duplicada:**

Cachear o resultado da primeira chamada a `/api/relations` e reusar. Remover a segunda ocorrência (linha ~1317).

#### Critério de Aceitação

- [ ] Relações automáticas (TMDB) e manuais convivem lado a lado na UI.
- [ ] Adicionar uma relação não remove as demais.
- [ ] Após F5, relações automáticas recarregam do TMDB e manuais persistem do banco.
- [ ] Remover uma relação manual remove apenas ela.
- [ ] Falha no TMDB ao buscar auto-relations não apaga as salvas.

#### Teste Manual

1. Acessar `/titles/movie-550` (Fight Club — tem coleção e recomendações automáticas).
2. Anotar quantas relações automáticas estão visíveis.
3. Adicionar uma relação manual (ex: SEQUEL para outro filme). Confirmar que as automáticas **não desapareceram**.
4. Pressionar F5. Confirmar que tanto as automáticas quanto a manual continuam visíveis.
5. Remover a relação manual. Confirmar que apenas ela sumiu.
6. Pressionar F5 novamente. Confirmar que automáticas voltaram e manual não está mais lá.

---

## 🐛 BUGS E ERROS — P2 (IMPORTANTES)

---

### ✅ P2 · #2 — "Popular Now" exibe séries finalizadas

- **Prioridade:** P2 — IMPORTANTE
- **Status:** ⏳ Pendente
- **Estimativa:** 1–2h

#### Descrição

Na seção "Popular Now" (aba TV Shows em `/search`), séries que já foram encerradas continuam aparecendo, mesmo sem estar mais no ar.

#### Causa Raiz (verificada na análise)

**Em `src/app/search/page.tsx` (linhas ~295–315), função `expandLatest()`:**

```typescript
async function expandLatest(shows: RawShow[]) {
  const cards = await Promise.all(shows.slice(0, 6).map(async show => {
    const seasons = await expandShow(show, false);
    if (!seasons.length) return null;
    const sorted = seasons.sort((a, b) => (b.season_number ?? 0) - (a.season_number ?? 0));
    const airingSeasons = sorted.filter(s => s.seasonStatus === 'Airing');
    if (airingSeasons.length === 0) return null; // ✅ Descarta corretamente
    // ...
  }));
}
```

O problema está em `expandShow()` (linhas ~100–125): quando `in_production === false`, a função retorna `[]` **para qualquer tipo de busca**, inclusive buscas textuais. Isso é correto para "Popular Now", mas **incorreto para busca textual** (ver BUG #3).

O filtro de `Popular Now` funciona, mas pode ser complementado: séries recentemente encerradas que o TMDB ainda entrega via `/tv/on_the_air` às vezes escapam.

#### Arquivos Envolvidos

| Arquivo | Linhas Aproximadas | O que alterar |
|---|---|---|
| `src/app/search/page.tsx` | ~295–315 | Função `expandLatest()` |
| `src/app/search/page.tsx` | ~100–125 | Função `expandShow()` — adicionar parâmetro `includeFinished` |

#### Solução Esperada

Adicionar verificação explícita na `expandLatest()` usando o campo `in_production` **antes** de chamar `expandShow()`, adicionando um filtro adicional por `air_date` da última temporada:

```typescript
// Adicionar na expandLatest():
const today = new Date().toISOString().split('T')[0];

// Filtro extra: só processar shows que ainda estão em produção
// ou cuja última temporada tenha air_date nos últimos 60 dias / futuro
const activeShows = shows.filter(show => {
  return show.in_production === true;
  // Alternativa mais robusta: verificar last_air_date
});
const cards = await Promise.all(activeShows.slice(0, 6).map(...));
```

#### Critério de Aceitação

- [ ] "Popular Now" exibe somente séries com `in_production === true`.
- [ ] Séries como "Breaking Bad" ou "Game of Thrones" **não** aparecem em "Popular Now".
- [ ] Séries como "The Bear" ou outras ativas **aparecem** normalmente.

#### Teste Manual

1. Abrir `/search?tab=tv`.
2. Localizar a seção "Popular Now".
3. Verificar que nenhuma série conhecida como encerrada (Breaking Bad, Avatar 2005, etc.) está na lista.

---

### ✅ P2 · #3 — Buscas textuais não retornam séries finalizadas

- **Prioridade:** P2 — IMPORTANTE
- **Status:** ⏳ Pendente
- **Estimativa:** 1–2h
- **Dependência:** Relacionado ao BUG #2 — mesma função `expandShow()` envolvida

#### Descrição

Ao pesquisar por séries conhecidas e encerradas ("Avatar: The Last Airbender", "Breaking Bad", "Friends"), os resultados não aparecem ou aparecem incompletos.

#### Causa Raiz (verificada na análise)

**Em `src/app/search/page.tsx` (linhas ~570–585), função `handleTextSearch()`:**

```typescript
const handleTextSearch = async () => {
  // ...
  if (mediaType === 'tv') {
    const expanded = await Promise.all(
      (data.results ?? []).map((show: RawShow) => expandShow(show, false))
      //                                                              ↑
      //  expandShow() checa in_production — séries finalizadas retornam []
    );
    let allCards: MediaCard[] = expanded.flat(); // ← Avatar vira [] e some
    setResults(allCards);
  }
};
```

**Em `expandShow()` (linhas ~100–125):**

```typescript
if (!detail.in_production) return []; // ← BLOQUEIA SÉRIES FINALIZADAS NA BUSCA
```

Este filtro faz sentido para "Popular Now", mas não para buscas textuais onde o usuário quer ver a série independente do status.

#### Arquivos Envolvidos

| Arquivo | Linhas Aproximadas | O que alterar |
|---|---|---|
| `src/app/search/page.tsx` | ~100–125 | Função `expandShow()` — adicionar parâmetro |
| `src/app/search/page.tsx` | ~570–585 | Função `handleTextSearch()` — passar `includeFinished = true` |

#### Solução Esperada

**Passo 1 — Adicionar parâmetro `includeFinished` em `expandShow()`:**

```typescript
async function expandShow(
  show: RawShow,
  includeSpecials = false,
  includeFinished = true  // ← NOVO parâmetro (padrão: inclui finalizadas)
): Promise<MediaCard[]> {
  const detail = await res.json();

  // Apenas bloqueia se for explicitamente pedido (ex: Popular Now)
  if (!includeFinished && !detail.in_production) return [];

  // Para buscas normais: inclui tudo
  // ...
}
```

**Passo 2 — Atualizar chamadas:**

```typescript
// Em handleTextSearch() — busca textual: incluir finalizadas
expandShow(show, false, true)  // includeFinished = true

// Em expandLatest() — seção "Popular Now": excluir finalizadas
expandShow(show, false, false) // includeFinished = false
```

#### Critério de Aceitação

- [ ] Buscar "Avatar: The Last Airbender" retorna a série nos resultados.
- [ ] Buscar "Breaking Bad" retorna a série.
- [ ] Buscar "Friends" retorna a série.
- [ ] Seção "Popular Now" continua mostrando apenas séries ativas (não regrediu).

#### Teste Manual

1. Abrir `/search?tab=tv`.
2. Digitar "Avatar: The Last Airbender" → deve aparecer.
3. Digitar "Breaking Bad" → deve aparecer.
4. Verificar que "Popular Now" ainda não exibe séries encerradas.

---

### ✅ P2 · #4 — ListEditor não atualiza a UI de resultados após salvar (Search)

- **Prioridade:** P2 — IMPORTANTE
- **Status:** ⏳ Pendente
- **Estimativa:** 1–2h

#### Descrição

Ao salvar uma entrada via ListEditor modal na página `/search`, o modal fecha mas os cards de resultado **não são atualizados**. O usuário não recebe nenhum feedback visual de que a entrada foi salva com sucesso.

#### Causa Raiz (verificada na análise)

**Em `src/app/search/page.tsx` (linhas ~840–850):**

```typescript
const openEditor = () => {
  setEditorData({...});
  setEditorOpen(true);
};

// O modal só fecha; não há callback de sucesso:
<ListEditor
  onClose={() => setEditorOpen(false)}
  // ← Falta: onSave={(entry) => handleEditorSave(entry)}
/>
```

#### Arquivos Envolvidos

| Arquivo | Linhas Aproximadas | O que alterar |
|---|---|---|
| `src/app/search/page.tsx` | ~840–870 | Adicionar `handleEditorSave` callback |
| `src/components/ListEditor.tsx` | — | Verificar se já expõe `onSave` prop; adicionar se necessário |

#### Solução Esperada

```typescript
// Em search/page.tsx — criar callback de save:
const handleEditorSave = (savedEntry: Entry) => {
  setResults(prev => prev.map(card => {
    if (card.tmdbId === savedEntry.tmdbId) {
      return {
        ...card,
        entryId: savedEntry.id,
        status: savedEntry.status,
        score: savedEntry.score,
        progress: savedEntry.progress,
      };
    }
    return card;
  }));
  setEditorOpen(false);
};

// Passar para o modal:
<ListEditor
  onClose={() => setEditorOpen(false)}
  onSave={handleEditorSave}  // ← Novo
/>
```

Verificar se `ListEditor.tsx` já suporta `onSave` prop. Caso não, adicionar o callback após a chamada bem-sucedida da API.

#### Critério de Aceitação

- [ ] Após salvar via ListEditor em `/search`, o card correspondente atualiza visualmente (ex: ícone de status, nota).
- [ ] O modal fecha normalmente após salvar.
- [ ] Sem reload de página.

#### Teste Manual

1. Abrir `/search`, buscar "Inception".
2. Clicar no ícone de edição (✎) do card.
3. Definir status "WATCHED", score "9.0".
4. Salvar.
5. Confirmar que o card atualiza com o novo status visualmente, sem precisar de F5.

---

### ✅ P2 · #5 — Score multiplicado por 10 no ListEditor (dados corrompidos)

- **Prioridade:** P2 — IMPORTANTE (dados corrompidos no banco)
- **Status:** ⏳ Pendente
- **Estimativa:** 30min–1h

#### Descrição

O score enviado via `ListEditor` é multiplicado por 10 antes de ser enviado à API, mas na página `titles/[id]` o score é enviado diretamente como decimal. A API armazena ambos como recebidos, gerando dados inconsistentes no banco.

Exemplos de impacto:
- Nota "8.0" salva via ListEditor → banco armazena `80`
- Nota "8.0" salva via titles/[id] → banco armazena `8.0`
- Exibição fica incoerente

#### Causa Raiz (verificada na análise)

**Em `src/components/ListEditor.tsx` (linha 271):**
```typescript
score: score > 0 ? Math.round(score * 10) : 0  // ← MULTIPLICA POR 10 (errado)
```

**Em `src/app/titles/[id]/page.tsx` (linha ~828):**
```typescript
score,  // ← DECIMAL DIRETO (correto)
```

**Em `src/app/api/entries/[id]/route.ts` (linha ~26):**
```typescript
// Espera decimal 0.0–10.0 (correto)
const scoreNum = typeof body.score === 'number' ? body.score : parseFloat(body.score);
```

#### Arquivos Envolvidos

| Arquivo | Linha | O que alterar |
|---|---|---|
| `src/components/ListEditor.tsx` | 271 | Remover `Math.round(score * 10)` → usar `score` direto |
| `src/app/titles/[id]/page.tsx` | ~828 | Confirmar que já envia decimal (não alterar) |
| `src/app/api/entries/[id]/route.ts` | ~26 | Confirmar que aceita decimal (não alterar) |

#### Solução Esperada

```typescript
// ListEditor.tsx linha 271 — ANTES:
score: score > 0 ? Math.round(score * 10) : 0,

// DEPOIS:
score: score > 0 ? score : 0,
```

> ⚠️ **Atenção:** Verificar se há entradas antigas no banco com score > 10 (fruto da multiplicação). Se houver, executar uma migration de dados para dividir esses valores por 10.

#### Critério de Aceitação

- [ ] Score "7.3" salvo via ListEditor é armazenado como `7.3` no banco.
- [ ] Score salvo via `titles/[id]` também é `7.3`.
- [ ] Exibição é consistente entre as duas formas de edição.
- [ ] Nenhum valor de score > 10 é inserido no banco.

#### Teste Manual

1. Ir a `/profile?tab=films`, editar uma entrada e definir score "7.3" via ListEditor.
2. Salvar.
3. Acessar a rota `/titles/[id]` desse mesmo título.
4. Abrir o editor novamente e verificar que o score exibido é "7.3" (não "73").
5. Alterar para "8.0" via `titles/[id]`, salvar, e confirmar persistência.

---

### ✅ P2 · #6 — `update-entry/route.ts` usa tmdbId como ID do banco (possível crash)

- **Prioridade:** P2 — IMPORTANTE (pode causar falha silenciosa)
- **Status:** ⏳ Pendente
- **Estimativa:** 30min

#### Descrição

Em `/api/update-entry/route.ts`, o `entryId` recebido é tratado como um número inteiro (tmdbId), mas os IDs do banco são CUIDs (strings UUID). Se um CUID for passado, `parseInt()` retorna `0` ou `NaN`, quebrando a operação silenciosamente.

#### Causa Raiz (verificada na análise)

**Em `src/app/api/update-entry/route.ts` (linha ~33):**

```typescript
const payload = {
  tmdbId: parseInt(entryId, 10) || 0,  // ← ERRADO se entryId for CUID
};
```

**Schema Prisma:**
```prisma
model Entry {
  id     String @id @default(cuid())  // ← CUID (string)
  tmdbId Int    @unique               // ← TMDB ID (número)
}
```

#### Arquivos Envolvidos

| Arquivo | Linha | O que alterar |
|---|---|---|
| `src/app/api/update-entry/route.ts` | ~33 | Usar `id` (CUID) diretamente em vez de `parseInt` |

#### Solução Esperada

```typescript
// ANTES:
const payload = { tmdbId: parseInt(entryId, 10) || 0 };
await prisma.entry.update({ where: { tmdbId: payload.tmdbId }, data: ... });

// DEPOIS:
// Se entryId é o CUID da DB:
await prisma.entry.update({ where: { id: entryId }, data: ... });

// Se entryId é o tmdbId numérico:
await prisma.entry.update({ where: { tmdbId: parseInt(entryId, 10) }, data: ... });
```

Verificar qual tipo de ID é passado pelo cliente para definir o `where` correto.

#### Critério de Aceitação

- [ ] Chamada a `/api/update-entry` com um CUID válido atualiza a entrada corretamente.
- [ ] Nenhum erro silencioso de `parseInt` em IDs string.

---

## 🔧 MELHORIAS — P3 (NICE-TO-HAVE)

---

### 🟢 P3 · #7 — Funções duplicadas: `imgUrl()` e `entrySlug()` em dois arquivos

- **Prioridade:** P3
- **Estimativa:** 30min

#### Descrição

As funções `imgUrl()` e `entrySlug()` existem duplicadas em `profile/page.tsx` e `search/page.tsx`. O código é idêntico em ambos os lugares.

#### Arquivos Envolvidos

| Arquivo | Linhas Aprox. | Ação |
|---|---|---|
| `src/app/profile/page.tsx` | ~92, ~99 | Remover funções locais, importar de utils |
| `src/app/search/page.tsx` | ~135, ~140 | Remover funções locais, importar de utils |
| `src/lib/utils.ts` | — | Adicionar e exportar `imgUrl()` e `entrySlug()` |

#### Solução Esperada

```typescript
// src/lib/utils.ts — adicionar:
export function imgUrl(path: string | null, size = 'w300'): string {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : '';
}

export function entrySlug(type: 'movie' | 'tv', tmdbId: number, seasonNumber?: number): string {
  return type === 'movie' ? `movie-${tmdbId}` : `tv-${tmdbId}-s${seasonNumber}`;
}
```

---

### 🟢 P3 · #8 — Language inconsistente em `add-media/route.ts`

- **Prioridade:** P3
- **Estimativa:** 5min

#### Descrição

Em `src/app/api/add-media/route.ts` (linha ~105), uma busca de séries extras usa `language=pt-BR` quando deveria usar `language=en-US` para consistência com o restante.

#### Arquivo Envolvido

| Arquivo | Linha | O que alterar |
|---|---|---|
| `src/app/api/add-media/route.ts` | ~105 | Mudar `language=pt-BR` → `language=en-US` |

---

### 🟢 P3 · #9 — Re-renderizações desnecessárias em `MediaCardComponent`

- **Prioridade:** P3
- **Estimativa:** 1–2h

#### Descrição

`MediaCardComponent` em `search/page.tsx` usa `useState` para hover, causando re-render do card inteiro a cada mouse event. Com 50 cards em grid, são 50 re-renders simultâneos por hover.

#### Arquivos Envolvidos

| Arquivo | O que alterar |
|---|---|
| `src/app/search/page.tsx` | Usar CSS `:hover` no lugar de `useState(hov)` |
| `src/app/profile/page.tsx` | Mover inline styles de `EntryCard` para classes CSS |

#### Solução Esperada

Substituir `onMouseEnter/Leave` por CSS puro:

```css
/* Trocar lógica de hover JS por: */
.media-card:hover .overlay { opacity: 1; }
```

---

### 🟢 P3 · #10 — Lazy loading de imagens ausente

- **Prioridade:** P3
- **Estimativa:** 15min

#### Descrição

As tags `<img>` de posters em `search/page.tsx` e `profile/page.tsx` não possuem `loading="lazy"`, o que força o browser a carregar todas as imagens imediatamente, prejudicando o LCP (Largest Contentful Paint).

#### Arquivos Envolvidos

| Arquivo | Ação |
|---|---|
| `src/app/search/page.tsx` | Adicionar `loading="lazy"` em `<img>` de posters |
| `src/app/profile/page.tsx` | Adicionar `loading="lazy"` em `<img>` de posters |

```typescript
// ANTES:
<img src={`https://image.tmdb.org/t/p/w300${item.poster_path}`} alt={displayTitle} />

// DEPOIS:
<img src={`https://image.tmdb.org/t/p/w300${item.poster_path}`} alt={displayTitle} loading="lazy" />
```

---

### 🟢 P3 · #11 — Extrair função `createEntry()` (dois POSTs similares)

- **Prioridade:** P3
- **Estimativa:** 30min

#### Descrição

Em `src/app/titles/[id]/page.tsx` existem dois blocos quase idênticos de `POST /api/add-media` (linhas ~1613 e ~1646). Devem ser extraídos para uma função reutilizável `createEntry()`.

#### Arquivo Envolvido

| Arquivo | Linhas | O que alterar |
|---|---|---|
| `src/app/titles/[id]/page.tsx` | ~1613, ~1646 | Extrair para função `createEntry(payload)` |

---

## 📊 RESUMO DE PRIORIDADES

| # | Issue | Prioridade | Arquivo Principal | Impacto | Esforço Est. |
|---|-------|-----------|-------------------|---------|-------------|
| 1 | Relações desaparecem após F5 / add apaga automáticas | **P1** | `titles/[id]/page.tsx` | Alto | 4–6h |
| 2 | "Popular Now" exibe séries encerradas | **P2** | `search/page.tsx` | Médio | 1–2h |
| 3 | Buscas textuais não retornam séries finalizadas | **P2** | `search/page.tsx` | Alto | 1–2h |
| 4 | ListEditor não atualiza UI de resultados após salvar | **P2** | `search/page.tsx` | Médio | 1–2h |
| 5 | Score multiplicado por 10 no ListEditor | **P2** | `ListEditor.tsx` | Alto | 30min |
| 6 | `update-entry` usa tmdbId como ID do banco | **P2** | `update-entry/route.ts` | Médio | 30min |
| 7 | Funções `imgUrl()` / `entrySlug()` duplicadas | **P3** | `utils.ts` | Baixo | 30min |
| 8 | Language inconsistente em `add-media` | **P3** | `add-media/route.ts` | Baixo | 5min |
| 9 | Re-renders desnecessários em MediaCard | **P3** | `search/page.tsx` | Baixo | 1–2h |
| 10 | Lazy loading de imagens ausente | **P3** | múltiplos | Baixo | 15min |
| 11 | Dois POSTs similares sem função reutilizável | **P3** | `titles/[id]/page.tsx` | Baixo | 30min |

---

## 📋 CHECKLIST DE TESTES MANUAIS

### Teste 1 — Relações (P1 · #1)
- [ ] Acessar `/titles/movie-550` (Fight Club — tem coleção automática).
- [ ] Anotar relações automáticas visíveis.
- [ ] Adicionar relação manual (ex: SEQUEL). Confirmar que automáticas **não desapareceram**.
- [ ] Pressionar F5. Confirmar que todas as relações continuam visíveis.
- [ ] Remover a relação manual. Confirmar que apenas ela sumiu.

### Teste 2 — Popular Now (P2 · #2)
- [ ] Abrir `/search?tab=tv`.
- [ ] Verificar seção "Popular Now": nenhuma série encerrada deve aparecer.
- [ ] Confirmar que Breaking Bad, Game of Thrones não estão na lista.

### Teste 3 — Busca Textual de Séries (P2 · #3)
- [ ] Abrir `/search?tab=tv`.
- [ ] Buscar "Avatar: The Last Airbender" → deve aparecer.
- [ ] Buscar "Breaking Bad" → deve aparecer.
- [ ] "Popular Now" ainda não exibe séries encerradas (sem regressão).

### Teste 4 — ListEditor Feedback Visual (P2 · #4)
- [ ] Buscar "Inception" em `/search`.
- [ ] Abrir ListEditor (✎), definir status "WATCHED" e score "9.0".
- [ ] Salvar → o card deve atualizar visualmente sem F5.

### Teste 5 — Score Consistente (P2 · #5)
- [ ] Em `/profile`, editar uma entrada via ListEditor → score "7.3".
- [ ] Acessar `/titles/[id]` do mesmo título.
- [ ] Abrir editor: score deve aparecer como "7.3" (não "73").
- [ ] Editar score para "8.0" via `titles/[id]`, salvar. Verificar persistência.

### Teste 6 — Entrada Normal
- [ ] Ir a `/search?tab=tv` → buscar "Breaking Bad".
- [ ] Clicar ✎, definir status "WATCHING", score "9.5", progress "5/62".
- [ ] Salvar. Confirmar em `/profile`.

### Teste 7 — Edge Cases
- [ ] Buscar "xyzabc123" → mensagem amigável, sem crash.
- [ ] Desconectar internet → retry automático e mensagem de timeout após 3x.

---

## 📝 NOTAS TÉCNICAS

### Sobre o Estado de Saúde do Projeto

- ✅ Estrutura robusta e escalável
- ✅ Integração TMDB com retry automático (3x, backoff exponencial, 8s timeout)
- ✅ Validações de dados completas nas rotas de API
- ✅ Todos os imports corretos (nenhum import quebrado identificado)
- ✅ Tratamento de erros robusto em operações TMDB
- ⚠️ 1 bug crítico em fluxo de relações (P1 · #1)
- ⚠️ 1 inconsistência crítica de dados de score (P2 · #5)
- ⚠️ 2 problemas de busca de séries (P2 · #2 e #3)

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
```

---

*Documento gerado com base em análise estática completa do projeto HADES.*
*Referência: `ANALISE_CONEXOES.md` — 28 de Abril de 2026*