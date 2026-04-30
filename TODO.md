# 🔧 HADES - Correções, Features e Melhorias Pendentes

> **📌 Instruções para IA / Desenvolvedor**
> - Leia todo o contexto antes de começar.
> - Siga os critérios de aceitação de cada tarefa.
> - Se algo não estiver claro, peça mais informações antes de alterar.
> - Prefira soluções que não quebrem compatibilidade retroativa.
> - Faça commits por tarefa, com mensagens descritivas.
> - Antes de iniciar qualquer tarefa, verifique dependências entre elas.

---

## 🏷️ Prioridades

| Nível | Descrição |
|-------|-----------|
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

## ✨ FEATURES NOVAS

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