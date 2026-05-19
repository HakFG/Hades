# HADES — Roadmap Completo (Índice Master)

> **Última atualização:** Maio 2026  
> **Estrutura:** 5 documentos especializados + Este índice  
> **Status:** Pronto para implementação em fases

---

## 📚 Documentos Disponíveis

### 1️⃣ [ROADMAP_HOME.md](ROADMAP_HOME.md) — Home Page (`app/page.tsx`)

**Foco:** Dashboard principal, features de agregação e recomendação.

**Conteúdo:**
- ✅ Análise de 10 features já implementadas
- 🔧 3 features a expandir (Notícias PT-BR, Newly Added, Calendário)
- 🆕 3 features novas (Gênero favorito, Continue Watching, Mini-Reviews)
- 📊 Arquitetura de performance (ISR, cache, Suspense)
- 🗓 Plano em 4 sprints

**Key Stats:**
- Features Prontas: 10/10
- Features Melhoráveis: 3
- Features Novas: 5+
- Estimativa Total: 20-30 horas

**Arquivo**
s principais:
- `src/app/page.tsx` (3.7KB)
- `src/components/TodaySession.tsx`
- `src/components/ReleaseCalendar.tsx`
- `src/lib/weekly-stats.ts`

---

### 2️⃣ [ROADMAP_SEARCH_BROWSE.md](ROADMAP_SEARCH_BROWSE.md) — Search/Browse (`app/search/page.tsx`)

**Foco:** Descoberta, busca avançada e exploração de títulos.

**Conteúdo:**
- ✅ Análise de 9 features já implementadas
- 🔧 3 features a melhorar (People tab, Status indicator, Seção "Não na lista")
- 🆕 5 features novas (Genre Grid, Filtros Avançados, Oscar, Virtualization, Fix bugs)
- 🏗️ Arquitetura de filtros (atual vs recomendada)
- 📐 Layout grid responsivo

**Key Stats:**
- Features Prontas: 9/9
- Features Essenciais: 3
- Features Nice-to-have: 5+
- Estimativa Total: 25-35 horas

**Arquivos principais:**
- `src/app/search/page.tsx` (600+KB)
- `src/components/MediaCard.tsx`
- `src/lib/tmdb-titles.ts`

---

### 3️⃣ [ROADMAP_TITLE_PAGE.md](ROADMAP_TITLE_PAGE.md) — Title Page (`app/titles/[id]`)

**Foco:** Detalhe do título, sistema de Relations, customização de capas.

**Conteúdo:**
- ✅ Análise de 9 features já implementadas
- 🔴 **CRÍTICO:** Sistema de Relations incompleto
- 🆕 UI Editor de Relations (3 steps)
- 🆕 Detecção automática melhorada
- 📊 Timeline visual de sequências
- 🗄️ Migration de schema Prisma (enum RelationType)

**Key Stats:**
- Features Prontas: 9/9
- **Features Críticas:** 3 (Relations)
- Features Novas: 2+
- Estimativa Total: 15-20 horas

**Arquivos principais:**
- `src/app/titles/[id]/page.tsx` (2000+ linhas)
- `src/lib/relations-manager.ts`
- `src/lib/poster-system.ts`

---

### 4️⃣ [ROADMAP_NOTIFICATIONS.md](ROADMAP_NOTIFICATIONS.md) — Notificações (Global)

**Foco:** Sistema completo de notificações com persistência, triggers e agendamento.

**Conteúdo:**
- ✅ Análise de 3 tipos já implementados
- 🔴 **CRÍTICO:** Não há persistência (recalcula sempre)
- 🗄️ Novo model `Notification` + `NotificationPreferences`
- 🤖 4 principais triggers (NEW_EPISODE, UPCOMING, RELATED, MILESTONE)
- ⏰ Scheduler com node-cron (4 jobs cron)
- 🎨 UI melhorada + filtros + painel
- ⚙️ Preferences page (escolher tipos de notificação)

**Key Stats:**
- Tipos de Notificação: 11 (3 prontos + 8 novos)
- Triggers: 4 principais
- Migration Prisma: Necessária
- Estimativa Total: 30-40 horas (PROJETO GRANDE)

**Arquivos principais:**
- `src/lib/notifications.ts`
- `src/components/NotificationPanel.tsx`
- `src/app/api/notifications/`

---

### 5️⃣ [ROADMAP_POSTER_SYSTEM.md](ROADMAP_POSTER_SYSTEM.md) — Sistema de Capas (Global)

**Foco:** "Fonte de Verdade Única" para capas em todo o site.

**Conteúdo:**
- 🔴 **CRÍTICO:** Capas inconsistentes em todo site
- ✅ Infraestrutura básica já existe (PosterChoice model)
- 🔄 Fluxo completo de resolução de capas
- 🎨 Hierarquia: PosterChoice → CustomImage → TMDB
- 🔗 Integração em 11+ componentes
- ✅ Implementação step-by-step

**Key Stats:**
- Componentes para integrar: 11+
- Pages para integrar: 5+
- Estimativa Total: 15-20 horas

**Arquivos principais:**
- `src/lib/poster-system.ts`
- `src/app/api/posters/route.ts`
- `prisma/schema.prisma` (model PosterChoice já existe)

---

## 🎯 Roadmap de Prioridades Sugerido

### **CRÍTICO** 🔴 (Bloqueia outras features)

1. **Sistema de Capas Global** (ROADMAP_POSTER_SYSTEM.md)
   - Problema: Capas inconsistentes em todo site
   - Impacto: Alto — afeta UX em Home, Search, Relations, Profile
   - Estimativa: 15-20 horas
   - Recomendação: **Fazer PRIMEIRO**

2. **Relations Editor** (ROADMAP_TITLE_PAGE.md - Feature 1.1)
   - Problema: UI mínima para adicionar relações
   - Impacto: Alto — usuário não consegue criar relações facilmente
   - Estimativa: 5-6 horas
   - Recomendação: **Fazer logo depois de Posters**

3. **Notificações com Persistência** (ROADMAP_NOTIFICATIONS.md - Phase 1)
   - Problema: Notificações recalculadas a cada refresh
   - Impacto: Médio — experiência quebrada
   - Estimativa: 8-10 horas (só Phase 1)
   - Recomendação: **3º projeto**

### **IMPORTANTE** 🟡 (Melhora UX)

1. **Aba People em Search** (ROADMAP_SEARCH_BROWSE.md - Feature 1.1)
   - API pronta, só falta UI
   - Estimativa: 3-4 horas
   - Recomendação: **Incorporar em próximo sprint Search**

2. **Notícias PT-BR Expandidas** (ROADMAP_HOME.md - Feature 1.1)
   - Problema: Notícias em inglês, limit 3/fonte
   - Estimativa: 2-3 horas
   - Recomendação: **Próximo sprint Home**

3. **Filtros Avançados em Search** (ROADMAP_SEARCH_BROWSE.md - Feature 2.2)
   - Refactor dos dropdowns para chips
   - Estimativa: 5-6 horas
   - Recomendação: **Médio prazo Search**

### **NICE-TO-HAVE** 🟢 (Polimento)

1. **Oscar Section Inteligente** (ROADMAP_SEARCH_BROWSE.md - Feature 2.3)
   - Feature cool mas não crítica
   - Estimativa: 6-8 horas

2. **Virtualization para Performance** (ROADMAP_SEARCH_BROWSE.md - Feature 3.1)
   - Melhoria de performance, não bug crítico
   - Estimativa: 2-3 horas

---

## 📊 Matriz de Esforço vs Impacto

```
IMPACTO ALTO
│
│     [Capas]     [Relations]
│    (15-20h)      (5-6h)
│
│    [Notif-P1]   [People Tab]
│    (8-10h)       (3-4h)
│
│    [Notif-Full] [News PT-BR]
│    (30-40h)      (2-3h)
│
│    [Oscar]       [Virtualize]
│    (6-8h)        (2-3h)
│
└────────────────────────────── IMPACTO BAIXO
  RÁPIDO          LENTO
  (< 5h)          (> 10h)
```

**Recomendação:** Fazer primeiro os quadrantes superiores-esquerdos (impacto alto + rápido), depois trabalhar em impacto alto + lento.

---

## 🗓 Plano de 3 Meses Sugerido

### **Mês 1: Fundações Críticas**

**Semana 1-2: Sistema de Capas**
- [ ] Phase 1: Persistência & Estrutura (4-5h)
- [ ] Phase 2: Integração em 5-6 componentes principais (8-10h)
- [ ] Testing & Polish (2h)
- **Total: 14-17h**

**Semana 3: Relations Editor**
- [ ] Melhorar UI (3h)
- [ ] Implementar wizard (2-3h)
- **Total: 5-6h**

**Semana 4: Home + News**
- [ ] Expandir Newly Added (1-2h)
- [ ] Implementar News Aggregator (2-3h)
- [ ] Testar & Deploy (1h)
- **Total: 4-6h**

### **Mês 2: Notificações (Projeto Grande)**

**Semana 1-2: Phase 1 Notificações**
- [ ] Migration Prisma (2h)
- [ ] API routes (3h)
- [ ] Triggers básicos (3h)
- [ ] Painel UI (2h)
- **Total: 10h**

**Semana 3-4: Phase 2 Notificações**
- [ ] Scheduler com cron (4-5h)
- [ ] Preferences page (3h)
- [ ] Testing (2h)
- **Total: 9-10h**

### **Mês 3: Search + Polish**

**Semana 1: Search Essencial**
- [ ] People tab (3-4h)
- [ ] Indicador status melhorado (2-3h)
- [ ] Seção "Não na lista" (4-5h)
- **Total: 9-12h**

**Semana 2-3: Features Nice-to-Have**
- [ ] Genre Grid (2h)
- [ ] Oscar Section (6-8h)
- [ ] Performance/Virtualization (2-3h)
- **Total: 10-13h**

**Semana 4: Polish Global + Deploy**
- [ ] Testing across all pages (3-4h)
- [ ] Bug fixes (2-3h)
- [ ] Performance audit (2h)
- **Total: 7-9h**

---

## 📋 Checklist Geral de Qualidade

### Antes de cada Phase/Sprint:

- [ ] Código review dos colleagues (se tiver)
- [ ] Testes em 3 breakpoints: Desktop (1920px), Tablet (768px), Mobile (375px)
- [ ] Performance: Lighthouse score >90
- [ ] Acessibilidade: Links, buttons, labels com ARIA corretos
- [ ] SEO: Meta tags, structured data (se aplicável)
- [ ] Cache: TTL apropriado definido
- [ ] Error handling: Fallbacks para falhas de API
- [ ] Visual: Alinhado com design Hades
- [ ] Documentation: README atualizado

---

## 🔗 Relações Entre Documentos

```
┌─────────────────────────────────────────────────────────┐
│ POSTER_SYSTEM (Fundação Global)                         │
│ ├─→ Usado em: HOME, SEARCH, TITLE, PROFILE             │
│ └─→ Necessário antes de relações visuais                │
└─────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────┐
│ TITLE_PAGE (Relations UI)                               │
│ ├─→ Depende: Sistema de Capas funcional                │
│ ├─→ Usa: Poster System para RelCards                    │
│ └─→ Blocks: Nenhuma (independente)                      │
└─────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────┐
│ NOTIFICATIONS (Infraestrutura Backend)                  │
│ ├─→ Depende: Nenhuma                                    │
│ ├─→ Impacta: HOME, PROFILE (badge de notif)            │
│ └─→ Blocks: Nenhuma (paralela)                          │
└─────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────┐
│ HOME (Frontend Agregação)                               │
│ ├─→ Depende: Poster System funcional                   │
│ ├─→ Usa: Todas as libs (weekly-stats, gamif, etc)     │
│ └─→ Blocks: Nenhuma                                     │
└─────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────┐
│ SEARCH_BROWSE (Descoberta)                              │
│ ├─→ Depende: Poster System para cards                   │
│ ├─→ Usa: TMDB API, componentes genéricos                │
│ └─→ Blocks: Nenhuma                                     │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Como Começar

1. **Leia primeiro:** [ROADMAP_POSTER_SYSTEM.md](ROADMAP_POSTER_SYSTEM.md)
   - Entenda o problema
   - Veja a solução arquitetural
   - Implemente os 3 steps

2. **Depois:** [ROADMAP_TITLE_PAGE.md](ROADMAP_TITLE_PAGE.md) — Feature 1.1
   - Relations Editor UI
   - Aproveita sistema de capas funcionando

3. **Em paralelo:** [ROADMAP_NOTIFICATIONS.md](ROADMAP_NOTIFICATIONS.md) — Phase 1
   - Não depende de capas/relations
   - Pode fazer em sprint separado

4. **Frontend:** [ROADMAP_HOME.md](ROADMAP_HOME.md) + [ROADMAP_SEARCH_BROWSE.md](ROADMAP_SEARCH_BROWSE.md)
   - Agora integram o sistema de capas
   - Expandem funcionalidades existentes

---

## 📞 Referências Rápidas

### Arquivos Críticos (Modificar frequentemente)

| Arquivo | Propósito |
|---|---|
| `src/lib/poster-system.ts` | Core de resolução de capas |
| `src/lib/relations-manager.ts` | Gerenciamento de relações |
| `src/lib/notifications.ts` | Geração de notificações |
| `src/app/page.tsx` | Home page principal |
| `src/app/search/page.tsx` | Search/Browse interface |
| `src/app/titles/[id]/page.tsx` | Title detail page |
| `prisma/schema.prisma` | Database schema |

### APIs Principais (Criar/Melhorar)

| Rota | Método | Prioridade |
|---|---|---|
| `/api/posters` | POST/GET | 🔴 P1 |
| `/api/notifications` | GET/POST/PATCH | 🔴 P1 |
| `/api/relations` | GET/POST/DELETE | 🟡 P2 |
| `/api/news` | GET | 🟡 P2 |

### Modelos Prisma (Criar/Atualizar)

| Model | Ação | Prioridade |
|---|---|---|
| `PosterChoice` | ✅ Já existe | - |
| `Notification` | 🆕 Criar | 🔴 P1 |
| `NotificationPreferences` | 🆕 Criar | 🔴 P1 |
| `Relation` | 🔧 Atualizar (add enum) | 🟡 P2 |

---

## 📝 Notas Finais

- **Este índice é vivo** — atualizar conforme progride implementação
- **Cada roadmap é independente** — pode ler/trabalhar em qualquer ordem, mas segue dependências
- **Foque em CRÍTICO primeiro** — Capas, Relations, Notificações abrem porta para resto
- **Tempo total estimado: 80-120 horas** distribuídas nos 3 meses
- **Qualidade > Velocidade** — melhor entregar com qualidade do que rápido com bugs

---

**Última atualização:** Maio 19, 2026  
**Próxima revisão:** Após completar Month 1 (Capas + Relations + News)
