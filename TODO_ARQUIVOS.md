### P1 #2: Relações — Ao adicionar, apaga outras relações

**Arquivos a Modificar:**
- ✏️ `src/app/titles/[id]/page.tsx` (linhas ~1050-1200, funções `addRelation`, `refreshRelations`, `removeRelation`, `useEffect`)
- ✏️ `src/app/api/relations/route.ts` (GET, POST, DELETE já estão OK, mas verificar lógica)

**Arquivos para Consultar/Entender:**
- 📖 `src/lib/relations-manager.ts` (se existir, lib de gerenciamento de relations)
- 📖 `prisma/schema.prisma` (schema da tabela Relation)

**Mudanças Necessárias:**
1. Refatorar `refreshRelations()` para carregar automáticas + manuais e mesclar
2. Refatorar `addRelation()` para adicionar sem substituir tudo
3. Refatorar `removeRelation()` para remover apenas 1 item
4. No `useEffect` inicial, gerar automáticas SEMPRE (não condicional)

**Status**: ⏳ Não iniciado

---

### P2 #3: Search — "Popular Now" mostra títulos finalizados

**Arquivos a Modificar:**
- ✏️ `src/app/search/page.tsx` (linhas ~160-180, ~310-340)
  - Função `expandShow()`: linha ~160
  - Função `expandLatest()` dentro de `loadInitialSections()`: linha ~310

**Mudanças Necessárias:**
1. Adicionar filtro `!detail.in_production` no `expandShow()`
2. Adicionar filtro `seasonStatus === 'Airing'` no `expandLatest()`
3. Descartar shows se nenhuma temporada está em produção

**Status**: ⏳ Não iniciado

---


**Arquivos a Modificar:**
- ✏️ `src/components/ListEditor.tsx` (todo o arquivo, refatorar)
- ✏️ `src/app/profile/page.tsx` (linhas ~1270-1450, remover função `ListEditor` local)

**Arquivos para Consultar:**
- 📖 `src/app/search/page.tsx` (ver como usa `ListEditor`)

**Mudanças Necessárias:**
1. Refatorar `ListEditor.tsx` para:
   - Aceitar `onSaved` callback
   - Aceitar `onDeleted` callback
   - Remover `window.location.reload()`
   - Aceitar `entryId` em `existingData`
   - Usar `/api/entries/{id}` PATCH/DELETE (não `/api/update-entry`)
2. No perfil, remover função local `ListEditor`
3. No perfil, importar e usar componente centralizado

**Status**: ⏳ Não iniciado

---


## 🟡 P3 - MELHORIA (Desejável, Pode Esperar)

### P3 #3: Avatar com PNG transparente — sem borda colorida

**Arquivos a Modificar:**
- ✏️ `src/app/profile/page.tsx` (linhas ~1550-1600, função `ProfileEditor` e display do perfil)

**Mudanças Necessárias:**
1. Dinâmico `background` color:
   - Se há imagem (URL válida): `background: 'transparent'`
   - Sem imagem: `background: avatarColor`
2. Adicionar ícone de fallback (👤) quando não há imagem
3. Aplicar mesmo lógica na exibição do perfil

**Status**: ⏳ Não iniciado

---

## 📊 Sumário de Arquivos

### Arquivos MODIFICAR (🔴 Crítico + 🟠 Importante + 🟡 Desejável)

```
src/app/titles/[id]/page.tsx                    ← P1#1, P1#2, P2#1, P2#2
src/app/search/page.tsx                         ← P1#3, P2#3
src/app/api/relations/route.ts                  ← P1#2 (consultar)
src/app/profile/page.tsx                        ← P2#4, P3#2, P3#3
src/app/layout.tsx                              ← P3#1
src/app/globals.css                             ← P3#1
src/components/ListEditor.tsx                   ← P2#4
```

### Arquivos CONSULTAR (📖 Referência)

```
src/lib/tmdb.ts                                 ← P1#1
src/lib/utils.ts                                ← P1#1
src/lib/relations-manager.ts                    ← P1#2 (se existir)
prisma/schema.prisma                            ← P1#2
src/app/api/activity/route.ts                   ← P3#2 (se existir)
```

---

## 🔄 Ordem Recomendada de Implementação

1. **P1#1** (Sinopses) - Simples, 2 mudanças isoladas
2. **P1#3** (Titles em português) - Simples, múltiplas trocas de `pt-BR` → `en-US`
3. **P2#1** (Capas Relations) - Muito simples, 1 parâmetro
4. **P2#2** (Trailers legendados) - Simples, 1 sort adicional
5. **P2#3** (Popular Now) - Médio, 2 filtros novos
6. **P1#2** (Relations duplicadas) - Complexo, refatorar 3 funções
7. **P2#4** (ListEditor) - Complexo, unificar 2 implementações
8. **P3#2** (Activity agrupamento) - Médio-Complexo, refatorar pushActivity
9. **P3#1** (Navbar visual) - Simples, estilos CSS + animações
10. **P3#3** (Avatar PNG) - Simples, lógica condicional de background

---

## ✅ Checklist de Implementação

### P1

- [ ] P1#1: Sinopses português
- [ ] P1#2: Relations duplicadas
- [ ] P1#3: Titles em português (Search)

### P2

- [ ] P2#1: Capas Relations português
- [ ] P2#2: Trailers legendados
- [ ] P2#3: Popular Now séries finalizadas
- [ ] P2#4: ListEditor unificado

### P3

- [ ] P3#1: Navbar visual
- [ ] P3#2: Activity agrupamento 24h
- [ ] P3#3: Avatar PNG transparente

---

**Gerado em**: April 28, 2026  
**Última atualização**: Análise completa concluída
