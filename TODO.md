# 🔧 HADES - Correções Pendentes

Ordem de prioridade, do mais urgente (funcionalidade quebrada) ao menos urgente (otimização).

---

## 🥇 PRIORIDADE 1 – Rotas de API essenciais (verificação e ajustes)

- [x] `GET /api/entries` – listar todas as entries do perfil ✅ (já existe)
- [x] `PATCH /api/entries/[id]` – editar status, score, progresso, datas ✅ (já existe)
- [x] `DELETE /api/entries/[id]` – remover entry ✅ (já existe)
- [x] `GET /api/entry/movie-{id}` – buscar entry específica (movies) ✅ (já existe)
- [x] `GET /api/entry/tv-{showId}-s{seasonNumber}` – buscar entry específica (TV) ✅ (já existe)
- [x] `POST /api/update-entry` – criar ou atualizar entry (upsert) ✅ (usado pelo ListEditor do search/perfil)
- [x] `POST /api/add-media` – adicionar série completa ou filme ✅ **mantida** (usada pelo modal de título)
- [x] `POST /api/refresh-all` – sincronizar dados do TMDB em lote ✅ (já existe)
- [x] `GET /api/profile` – buscar perfil do usuário ✅ (já existe)
- [x] `PATCH /api/profile` – atualizar perfil ✅ (já existe)

**Ações pendentes dentro desta prioridade:**
- [ ] **Remover duplicação de criação**: desativar `POST /api/entries` (comentar ou retornar 405) – pois o `ListEditor` já usa `/api/update-entry` e o fluxo de adição via título usa `/api/add-media`.
- [ ] **Adicionar validações** em `/api/update-entry` (score 0-100, status válido, datas).

---

## 🥈 PRIORIDADE 2 – Unificar helpers duplicados (importar de `@/lib/utils`)

- [x] `src/app/page.tsx` – remover `getOrdinal` local, importar de `@/lib/utils` ✅ **concluído**
- [x] `src/app/titles/[id]/page.tsx` – já importa todas as helpers de `@/lib/utils` ✅
- [x] `src/app/search/page.tsx` – já importa `getOrdinal`, `buildSeasonTitle` de `@/lib/utils` ✅
- [x] `src/app/api/add-media/route.ts` – já importa `getOrdinal`, `buildSeasonTitle` de `@/lib/utils` ✅

**Nenhuma ação pendente – todos os arquivos já utilizam as helpers centralizadas.**

---

## 🥉 PRIORIDADE 3 – Ajustar navegação do perfil (abas)

- [ ] `src/app/profile/page.tsx` – ler `searchParams.tab` e setar a aba ativa (`overview`, `series`, `films`, `favorites`, `stats`)
- [ ] `src/app/layout.tsx` – ajustar links `Film List` e `Series List` para passar `?tab=films` e `?tab=series`

---

## 🧹 PRIORIDADE 4 – Remover código morto (limpeza)

- [ ] Excluir `src/lib/tmdb-airing.ts` (não utilizado)
- [ ] Excluir `src/lib/tmdb.ts` (ou integrar nas páginas)
- [ ] Remover `formatAniListTitle` (não usada)
- [ ] Remover `getNextEpisode` (não usada)

---

## 🧠 PRIORIDADE 5 – Campos órfãos do schema (avaliar futuramente)

- [ ] Definir se `synopsis`, `customImage`, `staff`, `format`, `endDate`, `rating`, `popularity` serão utilizados
- [ ] Se não, removê-los do schema e rodar migração
- [ ] Se sim, implementar leitura/escrita nos pontos adequados

---

## 📌 Nota para o desenvolvedor

- Após cada correção, teste manualmente.
- Use `npx prisma studio` para verificar os dados.
- As funções auxiliares já estão em `src/lib/utils.ts` – importe sempre de lá.