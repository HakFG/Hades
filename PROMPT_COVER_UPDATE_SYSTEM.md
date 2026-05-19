# PROMPT — Sistema Global de Atualização de Capas (Hades)

---

## CONTEXTO DO PROJETO

Você está trabalhando no **Hades**, uma aplicação Next.js 16 full-stack com App Router, Prisma + PostgreSQL, TypeScript strict e integração TMDB. O modelo central de mídia é o `Entry`, que possui os campos de imagem:

```
imagePath: String?    // poster TMDB
bannerPath: String?   // backdrop TMDB
logoPath: String?     // logo TMDB
customImage: String?  // upload do usuário (tem prioridade sobre imagePath)
```

---

## OBJETIVO PRINCIPAL

**Implemente um sistema robusto e centralizado de atualização de capas**, de modo que toda vez que a capa de um título for alterada na aba `app/titles/[id]/page.tsx`, essa mudança se propague automaticamente como **verdade absoluta** para TODOS os lugares do site onde a capa daquele título aparece — sem necessidade de recarregamento manual, sem dados obsoletos, sem inconsistências.

---

## ARQUIVOS QUE VOCÊ DEVE LER PRIMEIRO (obrigatório)

Antes de qualquer implementação, leia e compreenda completamente:

1. `src/app/titles/[id]/page.tsx` — Página de detalhe do título; onde a capa é alterada
2. `src/app/api/entry/[id]/route.ts` — API route para operação por entry ID
3. `src/app/api/update-entry/route.ts` — Rota que atualiza progress/status/campos de entry
4. `src/app/api/entries/route.ts` e `src/app/api/entries/[id]/route.ts` — CRUD principal
5. `src/lib/prisma.ts` — Cliente Prisma centralizado
6. `src/lib/utils.ts` — Helpers de URL de imagem TMDB (função `getImageUrl` ou similar)
7. `src/components/AiringProgressCard.tsx` — Card que exibe capa em "em andamento"
8. `src/components/NextUpCard.tsx` — Card que exibe capa em "próximos"
9. `src/components/ListEditor.tsx` — Editor de lista com capas
10. `src/app/page.tsx` — Home (seções com capas)
11. `src/app/profile/page.tsx` — Perfil (capas aparecem em listas)
12. `prisma/schema.prisma` — Schema completo, foco no modelo `Entry` e `ActivityLog`

---

## O QUE JÁ EXISTE (analise antes de criar)

Busque no codebase por:

- Qualquer função, hook ou utilitário que já lide com `customImage`, `imagePath` ou atualização de poster
- Qualquer `PATCH` ou `PUT` na API que já receba campos de imagem
- Qualquer sistema de cache de imagem (Next.js `<Image>`, revalidação ISR, `revalidatePath`, `revalidateTag`)
- Qualquer uso de `router.refresh()`, `mutate()` (SWR) ou `queryClient.invalidateQueries()` relacionado a entries
- Qualquer Context, Zustand store ou estado global que já carregue entries

**Integre e expanda o que existir. Não duplique lógica.**

---

## IMPLEMENTAÇÃO REQUERIDA

### 1. API — Endpoint de atualização de capa (`PATCH /api/entry/[id]`)

Garanta que o endpoint aceite e persista:

```typescript
{
  imagePath?: string;      // poster TMDB path (ex: "/abc123.jpg")
  bannerPath?: string;     // backdrop TMDB path
  logoPath?: string;       // logo TMDB path
  customImage?: string;    // URL de imagem customizada do usuário
}
```

Regras de negócio obrigatórias:
- `customImage` tem **prioridade absoluta** sobre `imagePath` na leitura em qualquer componente
- Ao salvar, chame `revalidatePath` para invalidar o cache de todas as rotas que exibem o entry:
  - `revalidatePath('/titles/[id]')`
  - `revalidatePath('/')` (home)
  - `revalidatePath('/profile')`
  - `revalidatePath('/search')`
  - `revalidatePath('/gamification')`
- Atualize também o campo `imagePath` no `ActivityLog` correspondente ao entry se existir

### 2. Utilitário central de resolução de imagem (`src/lib/image-resolver.ts`)

Crie (ou expanda `src/lib/utils.ts`) uma função pura e única:

```typescript
export function resolveEntryImage(entry: {
  customImage?: string | null;
  imagePath?: string | null;
}, options?: { size?: 'w92' | 'w185' | 'w342' | 'w500' | 'w780' | 'original' }): string
```

- Se `customImage` existe e não está vazio → retorna `customImage`
- Se `imagePath` existe → retorna URL TMDB formatada: `https://image.tmdb.org/t/p/${size}${imagePath}`
- Fallback → retorna string de placeholder (ex: `/placeholder-poster.svg`)
- **Todo componente do site DEVE usar essa função para resolver imagens.** Nenhum componente deve construir URLs de imagem manualmente.

### 3. Componentes — Substituição global

Em **todos** os componentes e páginas abaixo, substitua qualquer lógica manual de resolução de imagem pela função `resolveEntryImage`:

- `src/components/AiringProgressCard.tsx`
- `src/components/NextUpCard.tsx`
- `src/components/ListEditor.tsx`
- `src/app/page.tsx` (todas as seções com cards de mídia)
- `src/app/profile/page.tsx`
- `src/app/search/page.tsx`
- `src/app/titles/[id]/page.tsx`
- Qualquer outro componente que renderize `entry.imagePath` ou `entry.customImage` diretamente

### 4. Propagação em tempo real (client-side)

Na página `src/app/titles/[id]/page.tsx`, após uma atualização de capa bem-sucedida:

```typescript
// Após PATCH bem-sucedido:
router.refresh()  // força re-fetch dos Server Components
```

Se o projeto usa SWR ou React Query para entries, invalide a chave correspondente após o PATCH.

Se o projeto usa um Context global de entries, atualize o entry no estado após o PATCH para propagação imediata sem recarregamento.

### 5. Sincronização TMDB → Banco

Verifique se `src/app/api/refresh-all/route.ts` e qualquer job cron em `src/lib/` já atualizam `imagePath` e `bannerPath` via TMDB. Se não, adicione:

```typescript
// Ao sincronizar entry com TMDB, sempre regravar imagePath e bannerPath
// MAS nunca sobrescrever customImage — customImage é soberano
if (tmdbData.poster_path) {
  updateData.imagePath = tmdbData.poster_path;
}
// customImage NUNCA é tocado pela sync automática
```

---

## CRITÉRIOS DE ROBUSTEZ

O sistema final deve garantir:

- [ ] Alterar a capa em `/titles/[id]` → capa atualizada imediatamente nessa página
- [ ] Navegar para `/` (home) → capa já atualizada nos cards
- [ ] Navegar para `/profile` → capa já atualizada nas listas
- [ ] Sync automático com TMDB não sobrescreve `customImage`
- [ ] `ActivityLog` reflete a imagem correta do entry
- [ ] Nenhum componente constrói URL de imagem fora de `resolveEntryImage`
- [ ] TypeScript sem erros em strict mode

---

## RESTRIÇÕES

- **Não quebre** funcionalidades existentes de gamificação, XP, progress e status
- **Não altere** o schema do Prisma a menos que seja absolutamente necessário e você explique por quê
- **Mantenha** a hierarquia `customImage > imagePath > placeholder`
- **Não crie** novos modelos de banco apenas para cache de imagem — use revalidação do Next.js
- Use **`revalidatePath` e `revalidateTag`** do Next.js para invalidação de cache, não soluções manuais

---

## ENTREGA ESPERADA

1. Diff ou código completo dos arquivos modificados/criados
2. Confirmação de quais arquivos foram lidos antes da implementação
3. Lista de todos os componentes onde `resolveEntryImage` foi aplicado
4. Explicação de como a propagação funciona (server revalidation + client refresh)
