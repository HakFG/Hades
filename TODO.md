# 🎮 HADES - Sistema de Gamificação & Engajamento

> **🎯 Visão Geral**
> Um sistema completo de gamificação para manter você motivado a continuar assistindo séries e filmes.
> Baseado em XP, níveis, achievements, streaks, desafios e recompensas.

---

## 🎖️ Prioridades & Fases

| Fase | Descrição | Status | Timeline |
|------|-----------|--------|----------|
| **FASE 1.EXT** | Anti-Exploração: Deduplicação de Ações | 🔴 **CRÍTICO** | Imediato |
| **FASE 1** | Core XP + Níveis + Básico | ✅ **CONCLUÍDA** | Sprint 1 |
| **FASE 2** | Achievements + Streaks + Dashboard | 🔨 Em Progresso | Sprint 2 |
| **FASE 3** | Desafios + Missões Dinâmicas | ⏳ Próximo | Sprint 3 |
| **FASE 4** | Cosmética + Recompensas Visuais | ⏳ Futuro | Sprint 4 |
| **FASE 5** | Rankings + Social + Metas Pessoais | ⏳ Futuro | Sprint 5 |

---

## � Mapa de Arquivos do Projeto (Atualizado)

```
src/
├── app/
│   ├── page.tsx                          ← Home (SSR com Suspense)
│   ├── layout.tsx                        ← Root layout com navbar
│   ├── profile/page.tsx                  ← Perfil + listas do usuário
│   ├── search/page.tsx                   ← Busca, filtros e seções
│   ├── titles/[id]/page.tsx              ← Detalhe de título + relações
│   ├── globals.css                       ← Estilos globais
│   └── api/
│       ├── add-media/route.ts            ← POST criar entry
│       ├── entries/route.ts              ← GET todas entries
│       ├── entries/[id]/route.ts         ← PATCH/DELETE entry específica
│       ├── entry/[id]/route.ts           ← GET por slug
│       ├── entry/by-slug/[slug]/route.ts ← GET por slug custom
│       ├── notifications/route.ts        ← GET notificações
│       ├── profile/route.ts              ← GET/PATCH perfil
│       ├── relations/route.ts            ← GET/POST/DELETE/PATCH relações
│       ├── update-entry/route.ts         ← POST atualizar (com customImage)
│       ├── refresh-all/route.ts          ← POST sincronizar todos dados
│       ├── activity/
│       │   ├── route.ts
│       │   ├── [id]/route.ts
│       │   ├── export/route.ts
│       │   └── import/route.ts
│       └── gamification/ ✅ [FASE 1 CONCLUÍDA]
│           ├── award-xp/route.ts         ← POST ganhar XP
│           └── user-stats/route.ts       ← GET dados de gamificação
├── components/ ✅ [FASE 1 CONCLUÍDA]
│   ├── ListEditor.tsx                    ← Modal de edição
│   ├── NextUpCard.tsx                    ← Card de próximo episódio
│   ├── NotificationPanel.tsx             ← Painel de notificações
│   ├── XPProgressBar.tsx                 ← Barra de XP
│   ├── XPToastHost.tsx                   ← Host de toasts de XP
│   ├── xp-progress.module.css            ← Estilos XP Bar
│   ├── StreakIndicator.tsx               ← Indicador de streak [FASE 2]
│   ├── ChallengeWidget.tsx               ← Widget de desafios [FASE 3]
│   ├── CosmeticsRenderer.tsx             ← Renderização de cosmética [FASE 4]
│   └── LevelUpNotification.tsx           ← Toast de level up [FASE 4]
├── hooks/ ✨ [NOVO]
│   └── useXPNotification.ts              ← Hook para notificações XP
└── lib/ ✅ [FASE 1 CONCLUÍDA]
    ├── prisma.ts                         ← Cliente Prisma singleton
    ├── tmdb.ts                           ← Fetching com retry automático
    ├── tmdb-titles.ts                    ← Busca especializada de títulos
    ├── tmdb-airing.ts                    ← Status de episódios
    ├── activity.ts                       ← Lógica de atividades
    ├── notifications.ts                  ← Lógica de notificações
    ├── relations-manager.ts              ← Gerenciamento de relações
    ├── utils.ts                          ← Helpers gerais
    ├── xp-calculator.ts                  ← Cálculo de XP ✅ [FASE 1]
    ├── level-system.ts                   ← Sistema de níveis ✅ [FASE 1]
    ├── gamification.ts                   ← Utilitários de gamificação ✅ [FASE 1]
    ├── achievements.ts                   ← Pool de achievements [FASE 2]
    ├── challenge-generator.ts            ← Gerador de desafios [FASE 3]
    ├── challenge-tracker.ts              ← Rastreamento de progresso [FASE 3]
    └── personal-goals.ts                 ← Metas pessoais [FASE 5]
```

---

## ⚡ SISTEMA DE GAMIFICAÇÃO — VISÃO GERAL

### O Conceito
Transformar a experiência de assistir séries e filmes em uma **jornada épica** onde cada ação gera progresso, desbloqueia conquistas e oferece satisfação visual. Sistema inspirado em RPG, com elementos de progresso constante, recompensas imediatas e metas inspiradoras.

### Pilares
- **🎯 Progresso Visual** — Ver barra de XP preencher em tempo real
- **🏆 Achievements** — Conquistas desbloqueáveis para inspirar metas
- **🔥 Streaks** — Série ininterrupta de dias assistindo (motivação de hábito)
- **📊 Rankings** — Competição saudável com você mesmo ao longo do tempo
- **🎁 Recompensas** — Cosmética e badges exclusivas por milestones
- **⚡ Desafios** — Missões dinâmicas que mudam o gameplay

---

## 📊 STATUS ATUAL DO PROJETO (30 de Abril de 2026)

| Métrica | Status |
|---------|--------|
| **Fases Concluídas** | 1 / 5 ✅ |
| **Progresso Overall** | 20% |
| **Sistema Core** | Operacional 🟢 |
| **XP Bar Visível** | Sim, animada |
| **Notificações XP** | Funcional |
| **Próxima Prioridade** | **FASE 2 — Achievements + Streaks** |
| **Estimativa FASE 2** | 2-3 semanas |

---

### O que foi implementado:

- ✅ Schema Prisma: `UserGameification`, `ActivityLog`, `StreakData`
- ✅ XP Calculator com tabela de ações (episódio: 100 XP, série: 500 XP, etc)
- ✅ Level System com progressão exponencial (1-50 níveis)
- ✅ Endpoints:
  - `POST /api/gamification/award-xp` — Award XP por ações
  - `GET /api/gamification/user-stats` — Obter dados do usuário
- ✅ UI Components:
  - `XPProgressBar.tsx` — Barra visual na navbar
  - `XPToastHost.tsx` — Notificações flutuantes de XP
  - `xp-progress.module.css` — Estilos com animações
- ✅ Hook: `useXPNotification` para gerenciar notificações
- ✅ Animações suaves: xpGain, levelUpGlow, etc
- ✅ Persistência: XP e níveis salvos no banco de dados

**Commits relacionados:**
```bash
git log --grep="FASE 1" --oneline
```

---

## 🏆 FASE 2: ACHIEVEMENTS + STREAKS + DASHBOARD VISUAL (Sprint 2)

### G2.1 — Sistema de Achievements

**Tipos de Achievements:**

```typescript
interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  xpReward: number;
  trigger: {
    type: "level_reach" | "action_count" | "streak_milestone" | "score_milestone";
    target: number; // level 10, watch 100 eps, streak 30 dias, score 10
  };
}

const ACHIEVEMENTS = [
  {
    id: "first_watch",
    name: "🎬 Primeira Sessão",
    description: "Assistiu seu primeiro episódio",
    rarity: "common",
    xpReward: 50,
    trigger: { type: "action_count", target: 1 }
  },
  {
    id: "binge_master",
    name: "🔥 Binge Master",
    description: "Assistiu 50 episódios em um mês",
    rarity: "epic",
    xpReward: 500,
    trigger: { type: "action_count", target: 50 }
  },
  {
    id: "perfect_score",
    name: "💯 Crítico Perfeito",
    description: "Deu nota 10 para 10 títulos diferentes",
    rarity: "rare",
    xpReward: 300,
    trigger: { type: "score_milestone", target: 10 }
  },
  {
    id: "series_completionist",
    name: "✨ Completista",
    description: "Completou 25 séries inteiras",
    rarity: "legendary",
    xpReward: 1000,
    trigger: { type: "action_count", target: 25 }
  },
  {
    id: "ironman_week",
    name: "⚡ Ferro Incandescente",
    description: "Manteve streak de 30 dias ininterruptos",
    rarity: "legendary",
    xpReward: 800,
    trigger: { type: "streak_milestone", target: 30 }
  },
  {
    id: "genre_expert_action",
    name: "💥 Conhecedor de Ação",
    description: "Completou 15 filmes/séries de ação",
    rarity: "rare",
    xpReward: 250,
    trigger: { type: "action_count", target: 15 } // com metadata genre
  },
];
```

**Arquivo:** `src/lib/achievements.ts` (novo)

---

### G2.2 — Sistema de Streaks

**O que é Streak:**
- Contador de dias consecutivos com atividade (assistir ep, adicionar série, etc)
- Reseta se ficar 48h sem atividade (tolerância de 1 dia)
- Mostra na navbar com emoji 🔥 + número

**UI Streak:**
```tsx
<div className="streak-indicator">
  <span className="flame-emoji">🔥</span>
  <span className="streak-count">{streakData.currentStreak}</span>
  <span className="streak-label">dia{streakData.currentStreak > 1 ? 's' : ''}</span>
</div>
```

**Arquivo:** `src/components/StreakIndicator.tsx` (novo)

**Integração:**
- No `ActivityLog`, ao logar uma ação, verificar se é um novo dia
- Se sim, incrementar streak
- Se passou 48h, resetar
- Se atingiu múltiplo de 7, avisar com toast especial

---

### G2.3 — Gamification Dashboard (Nova Página)

**Rota:** `/gamification` (nova página)

**Seções:**

#### a) Hero Card — Próximo Level
```
┌────────────────────────────────────────┐
│  Nível 12 — GURU  [████████░░] 78%    │
│                                        │
│  2,230 / 2,850 XP até Nível 13        │
│  Próxima recompensa: Avatar Dourado    │
└────────────────────────────────────────┘
```

#### b) Achievements Grid
```
Mostrar grid 3x3 com achievements desbloquados em cores, locked em grayscale.
Ao clicar, mostrar:
- Nome
- Descrição
- Data de obtenção
- XP recebido
```

#### c) Streak Display
```
Maior Streak: 47 dias (13 de Mar - 29 de Abril)
Streak Atual: 12 dias 🔥
Próximo Milestone: 30 dias (+300 XP)
```

#### d) Timeline de Atividades
Feed reverso mostrando as últimas 20 ações com XP ganho, ordenado por data.

#### e) Comparação com Metas Pessoais
Cards mostrando progresso em direção a milestones:
- "50 episódios esse mês" → 34/50 (68%)
- "Manter streak de 30 dias" → 12/30 (40%)
- "Completar 3 séries" → 1/3 (33%)

**Arquivo:** `src/app/gamification/page.tsx` (novo)

---

### G2.4 — Notificação de Achievements Desbloqueados

```typescript
// Toast especial ao desbloquear achievement
type: "achievement_unlock"
title: "💯 Crítico Perfeito"
description: "Você deu nota 10 para 10 títulos!"
xpReward: "+300 XP"
animation: "slideInRight + scale bounce"
```

---

### G2.5 — Critério de Aceitação (FASE 2)

- [ ] Sistema de achievements implementado com todas as 6+ ideias
- [ ] Detecção automática de achievements desbloqueados
- [ ] Streak system funcionando com tolerância de 48h
- [ ] Notificações de achievement pop-up com animação
- [ ] Página `/gamification` renderizando todas as seções
- [ ] Level up progressivo funcionando
- [ ] Data de obtenção de achievements salva
- [ ] Teste manual: completar 10 filmes com nota 10, verificar unlock de "Crítico Perfeito"

---

## ⚡ FASE 3: DESAFIOS + MISSÕES DINÂMICAS (Sprint 3)

### G3.1 — Tipos de Desafios

#### Desafios Diários
```typescript
interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  goal: number;
  type: "watch_episodes" | "rate_titles" | "complete_series" | "genre_focused";
  reward: { xp: number; badge?: string };
  difficulty: "easy" | "medium" | "hard";
  duration: "24h";
  metadata?: { genre?: string; scoreRange?: [number, number] };
}

const DAILY_CHALLENGES = [
  {
    id: "daily_watcher",
    title: "👀 Assistidor Diário",
    description: "Assista 2 episódios",
    goal: 2,
    type: "watch_episodes",
    reward: { xp: 150 },
    difficulty: "easy"
  },
  {
    id: "critic_day",
    title: "🎭 Dia do Crítico",
    description: "Avalie 5 títulos com score ≥ 7",
    goal: 5,
    type: "rate_titles",
    reward: { xp: 250 },
    difficulty: "medium",
    metadata: { scoreRange: [7, 10] }
  },
  {
    id: "action_junkie",
    title: "💥 Viciado em Ação",
    description: "Assista 3 episódios de séries de ação",
    goal: 3,
    type: "watch_episodes",
    reward: { xp: 200, badge: "action_enthusiast" },
    difficulty: "medium",
    metadata: { genre: "Action" }
  },
];
```

#### Desafios Semanais
- Completar uma série inteira (qualquer duração)
- Atingir score médio de 8+ em 10 títulos
- Manter streak de 7 dias
- Misturar 3 gêneros diferentes (assistir pelo menos 1 de cada)

#### Desafios Especiais (Mensais / Sazonais)
- "Maratona de Verão": assistir 100 episódios em 30 dias
- "Colecione Gêneros": completar 1 série de cada gênero (8 diferentes)
- "Festival de Clássicos": assistir 5 filmes lançados antes de 2000

---

### G3.2 — UI de Desafios

**Seção na Navbar / Home:**
```
╔══════════════════════════════════════╗
║  📋 DESAFIOS DE HOJE                 ║
╠══════════════════════════════════════╣
║  👀 Assistidor Diário                ║
║  2 / 2 episódios ████████░░ COMPLETO ║
║  +150 XP                             ║
╠══════════════════════════════════════╣
║  🎭 Dia do Crítico                   ║
║  3 / 5 avaliações ██████░░░░ 60%     ║
║  +250 XP                             ║
╠══════════════════════════════════════╣
║  💥 Viciado em Ação                  ║
║  1 / 3 episódios ██░░░░░░░░ 33%      ║
║  +200 XP + 🏅 Action Enthusiast      ║
╚══════════════════════════════════════╝
```

**Arquivo:** `src/components/ChallengeWidget.tsx` (novo)

---

### G3.3 — Geração Dinâmica de Desafios

```typescript
// Rotina que roda todo dia às 00:00 UTC
// Seleciona 3 desafios aleatórios do pool diário

function generateDailyChallenges() {
  const challenges = shuffle(DAILY_CHALLENGES).slice(0, 3);
  // Salvar em DB com TTL de 24h ou regenerar manualmente
  // Avisar usuário: "3 novos desafios disponíveis!"
}

// Endpoint: POST /api/gamification/reset-daily-challenges
// Cron job ou manual trigger
```

**Arquivo:** `src/lib/challenge-generator.ts` (novo)

---

### G3.4 — Detecção de Progresso em Tempo Real

```typescript
// Quando usuário assiste episódio:
1. Update ActivityLog com tipo "watch_episode"
2. Verificar desafios ativos do usuário
3. Se action.type === challenge.type, incrementar counter
4. Se counter >= challenge.goal, marcar como completo
5. Award XP + badge (se houver)
6. Mostrar toast: "Desafio 💥 completado! +200 XP"
```

**Arquivo:** `src/lib/challenge-tracker.ts` (novo)

---

### G3.5 — Leaderboard de Desafios (Opcional P3)

Mostrar quem completou qual desafio em `/gamification/challenges`

---

### G3.6 — Critério de Aceitação (FASE 3)

- [ ] Pool de 10+ desafios diários criado
- [ ] Desafios semanais e especiais definidos
- [ ] UI de desafios renderizada corretamente
- [ ] Gerador de desafios diários funcionando (03:00 UTC)
- [ ] Contador de progresso updatando em tempo real
- [ ] Notificação de desafio completo aparecendo
- [ ] Teste: completar um desafio de "2 episódios", verificar XP + notificação

---

## 🎁 FASE 4: RECOMPENSAS VISUAIS + COSMÉTICA (Sprint 4)

### G4.1 — Sistema de Cosmética

**Tipos de Recompensas Desbloqueáveis:**

#### 1. Avatar Borders
```
Level 5:  Purple Border
Level 10: Gold Border
Level 20: Platinum + Glow
Level 50: Godlike Rainbow Glow
```

#### 2. Badges
```
🏅 Action Enthusiast    → 15 action titles watched
🎭 Comedy King          → 30 comedies watched
🔥 Binge Master        → Streak de 30 dias
💯 Perfecionist        → 10 títulos com score 10
🌟 Completist          → 50 séries completadas
👑 Level 50            → Reach level 50
```

#### 3. Profile Themes
```
- Dark (padrão)
- Neon Pink (level 15)
- Cyberpunk (level 25)
- Sunset (30 achievements)
- Matrix Green (50 episódios em 1 mês)
```

#### 4. Custom XP Bar Colors
```
- Padrão: rosa
- Neon Azul (20 achievements)
- Ouro (level 25)
- Arco-íris (100+ XP total)
```

---

### G4.2 — Vitrine de Cosmética

**Nova página:** `/gamification/cosmetics`

```tsx
export function CosmeticsShowcase() {
  return (
    <div className="cosmetics-grid">
      {/* Avatar Borders */}
      <section>
        <h2>Avatar Borders</h2>
        {borders.map(border => (
          <CosmeticCard
            name={border.name}
            unlocked={userLevel >= border.requiredLevel}
            requiredLevel={border.requiredLevel}
            preview={border.preview}
            onEquip={() => equipBorder(border.id)}
          />
        ))}
      </section>

      {/* Badges */}
      <section>
        <h2>Badges</h2>
        {badges.map(badge => (
          <CosmeticCard
            name={badge.name}
            unlocked={userAchievements.includes(badge.id)}
            description={badge.description}
            icon={badge.icon}
          />
        ))}
      </section>

      {/* Themes */}
      <section>
        <h2>Profile Themes</h2>
        {themes.map(theme => (
          <ThemePreview
            name={theme.name}
            unlocked={canUnlock(theme)}
            onEquip={() => setTheme(theme.id)}
          />
        ))}
      </section>
    </div>
  );
}
```

**Arquivo:** `src/app/gamification/cosmetics/page.tsx` (novo)

---

### G4.3 — Renderização de Cosmética

```typescript
// Ao carregar profile, detectar cosmética equipada
const userCosmetics = await getUserCosmetics(userId);

return (
  <div 
    className={`profile-container theme-${userCosmetics.theme}`}
    style={{
      '--xp-bar-color': userCosmetics.xpBarColor,
    } as CSSProperties}
  >
    <Avatar 
      border={userCosmetics.avatarBorder}
      badges={userCosmetics.equippedBadges}
    />
    {/* Rest of profile */}
  </div>
);
```

**Arquivo:** `src/components/CosmeticsRenderer.tsx` (novo)

---

### G4.4 — Animações de Desbloqueio

Quando usuário desbloqueia cosmética:
```typescript
// Toast especial
type: "cosmetic_unlock"
message: "🎁 Desbloqueou: Platinum Avatar Border"
action: "Ver na Vitrine"
onClick: () => navigate('/gamification/cosmetics')
animation: "slideInFromTop + particleEffects"
```

---

### G4.5 — Critério de Aceitação (FASE 4)

- [ ] 4+ tipos de cosmética definidos e renderizáveis
- [ ] Avatar borders mudando visualmente por level
- [ ] Badges aparecendo no profile do usuário
- [ ] Temas de profile alterando stylesheet
- [ ] XP bar color personalizável
- [ ] Vitrine `/gamification/cosmetics` exibindo todos os items
- [ ] Lock/unlock logic funcionando
- [ ] Teste: atingir nível 15, verificar Neon Blue theme desbloqueado

---

## 📊 FASE 5: RANKINGS + SOCIAL + METAS PESSOAIS (Sprint 5)

### G5.1 — Metas Pessoais Customizáveis

```typescript
interface PersonalGoal {
  id: string;
  title: string;
  type: "episodes" | "series" | "score_avg" | "streak_days" | "titles_genre";
  target: number;
  current: number;
  deadline?: Date;
  reward?: { xp: number; cosmetic?: string };
  createdAt: Date;
}

// Exemplos:
// - "Assistir 100 episódios até fim de maio" (target: 100, deadline: 2026-05-31)
// - "Completar 5 séries de drama" (target: 5, metadata: genre="Drama")
// - "Manter score médio de 8+ em títulos novos" (target: 8)
// - "Streak de 60 dias" (target: 60)
```

**Arquivo:** `src/lib/personal-goals.ts` (novo)

---

### G5.2 — Dashboard de Metas

```
┌─ Metas Pessoais ─────────────────────┐
│                                      │
│ 📊 100 Episódios (Maio 2026)         │
│    45 / 100 [████░░░░░░░░░] 45%      │
│    Faltam 28 dias                    │
│                                      │
│ 🎭 5 Séries Drama                    │
│    2 / 5 [██░░░░░░░░] 40%            │
│    +100 XP ao completar              │
│                                      │
│ 🔥 Streak 60 dias                    │
│    12 / 60 [██░░░░░░░░░░] 20%        │
│                                      │
│ ⭐ Score Médio 8.0+                  │
│    7.8 / 8.0 [█████░░░░░░] Quase lá  │
│                                      │
└──────────────────────────────────────┘
```

---

### G5.3 — Rankings Pessoais (Estatísticas)

**Página:** `/gamification/stats`

```
📈 Estatísticas Pessoais

Ranking Histórico (vs você mesmo):
- Mês com mais episódios: Março 2026 (47 eps)
- Maior streak: 47 dias
- Maior score médio: 8.3 (Maio 2025)
- Série mais rápida: The Office (10 dias)
- Série mais lenta: Breaking Bad (4 meses)
- Gênero favorito: Drama (35% de tudo assistido)
```

---

### G5.4 — Leaderboard Global (Opcional)

Se quiser adicionar competição saudável:

```
🏆 Leaderboard Global (Top 100)

1. 🥇 CinematicDreams     Nível 42 | 587,430 XP
2. 🥈 SeriesGod          Nível 39 | 432,120 XP
3. 🥉 MovieMarathoner    Nível 38 | 401,890 XP
4. 4️⃣ YourUsername       Nível 28 | 156,780 XP

Filtros: This Week, This Month, All Time, By Genre
```

---

### G5.5 — Comparação com Meta Global

```
📊 Você vs Média Global

Episódios/Mês: 34 vs 18 (89% acima da média) 🔥
Series/Ano: 12 vs 7 (71% acima da média)
Score Médio: 7.8 vs 7.2
Tempo médio por série: 6 meses vs 4 meses
```

---

### G5.6 — Critério de Aceitação (FASE 5)

- [ ] Metas pessoais CRUD funcionando
- [ ] Dashboard exibindo progresso visual
- [ ] Stats pessoais calculando e exibindo
- [ ] Leaderboard global (opcional) renderizando
- [ ] Comparação com média global
- [ ] Teste: criar meta "50 episódios", assistir 30, verificar progresso 60%

---

## 🎨 DESIGN SYSTEM — CORES & ANIMAÇÕES GAMIFICAÇÃO

### Paleta de Cores

```css
:root {
  --xp-primary: rgb(232, 105, 144);      /* Rosa */
  --xp-secondary: rgb(180, 70, 110);     /* Rosa escuro */
  --xp-accent: rgb(250, 170, 190);       /* Rosa claro */
  
  --rarity-common: rgb(150, 150, 150);
  --rarity-rare: rgb(100, 150, 255);
  --rarity-epic: rgb(200, 100, 255);
  --rarity-legendary: rgb(255, 200, 50);
  
  --level-colors: [
    rgb(100, 200, 255),  /* Neon Blue - Level 15 */
    rgb(255, 215, 0),    /* Gold - Level 25 */
    rgb(255, 100, 255),  /* Magenta - Level 35 */
  ];
}
```

### Animações Gamificação

```css
@keyframes xpGain {
  0% { opacity: 0; transform: translateY(-20px) scale(0.8); }
  50% { opacity: 1; }
  100% { opacity: 0; transform: translateY(-60px) scale(1); }
}

@keyframes achievementUnlock {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes levelUpGlow {
  0%, 100% { box-shadow: 0 0 20px rgba(232,105,144,0.5); }
  50% { box-shadow: 0 0 40px rgba(232,105,144,1); }
}

@keyframes streakFlame {
  0%, 100% { transform: scale(1) rotate(0deg); }
  50% { transform: scale(1.2) rotate(5deg); }
}
```

---

## 📋 MAPA DE ARQUIVOS DO PROJETO

```
src/
├── app/
│   ├── page.tsx                          ← Home (SSR com Suspense)
│   ├── layout.tsx                        ← Root layout com navbar
│   ├── profile/page.tsx                  ← Perfil + listas do usuário
│   ├── search/page.tsx                   ← Busca, filtros e seções
│   ├── titles/[id]/page.tsx              ← Detalhe de título + relações
│   ├── gamification/page.tsx             ← Dashboard principal [NOVO]
│   ├── gamification/cosmetics/page.tsx   ← Vitrine de cosmética [NOVO]
│   ├── gamification/stats/page.tsx       ← Estatísticas pessoais [NOVO]
│   └── api/
│       ├── add-media/route.ts            ← POST criar entry
│       ├── entries/route.ts              ← GET todas entries
│       ├── entries/[id]/route.ts         ← PATCH/DELETE entry específica
│       ├── entry/[id]/route.ts           ← GET por slug
│       ├── entry/by-slug/[slug]/route.ts ← GET por slug custom
│       ├── notifications/route.ts        ← GET notificações
│       ├── profile/route.ts              ← GET/PATCH perfil
│       ├── relations/route.ts            ← GET/POST/DELETE/PATCH relações
│       ├── update-entry/route.ts         ← POST atualizar (com customImage)
│       ├── refresh-all/route.ts          ← POST sincronizar todos dados
│       ├── gamification/
│       │   ├── award-xp/route.ts         ← POST ganhar XP [NOVO]
│       │   ├── user-stats/route.ts       ← GET dados de gamificação [NOVO]
│       │   ├── reset-daily-challenges/route.ts ← POST reset diários [NOVO]
│       │   ├── cosmetics/route.ts        ← GET/PATCH cosmética [NOVO]
│       │   └── personal-goals/route.ts   ← CRUD metas pessoais [NOVO]
│       └── activity/
│           ├── route.ts
│           ├── [id]/route.ts
│           ├── export/route.ts
│           └── import/route.ts
├── components/
│   ├── ListEditor.tsx                    ← Modal de edição
│   ├── MyListSearch.tsx                  ← Busca
│   ├── NextUpCard.tsx                    ← Card de próximo
│   ├── NotificationPanel.tsx             ← Painel de notificações
│   ├── XPProgressBar.tsx                 ← Barra de XP [NOVO]
│   ├── StreakIndicator.tsx               ← Indicador de streak [NOVO]
│   ├── ChallengeWidget.tsx               ← Widget de desafios [NOVO]
│   ├── CosmeticsRenderer.tsx             ← Renderização de cosmética [NOVO]
│   └── LevelUpNotification.tsx           ← Toast de level up [NOVO]
└── lib/
    ├── prisma.ts                         ← Cliente Prisma singleton
    ├── tmdb.ts                           ← Fetching com retry automático
    ├── tmdb-titles.ts                    ← Busca especializada de títulos
    ├── tmdb-airing.ts                    ← Status de episódios
    ├── notifications.ts                  ← Lógica de notificações
    ├── relations-manager.ts              ← Gerenciamento de relações
    ├── utils.ts                          ← Helpers gerais
    ├── xp-calculator.ts                  ← Cálculo de XP [NOVO]
    ├── level-system.ts                   ← Sistema de níveis [NOVO]
    ├── achievements.ts                   ← Pool de achievements [NOVO]
    ├── challenge-generator.ts            ← Gerador de desafios [NOVO]
    ├── challenge-tracker.ts              ← Rastreamento de progresso [NOVO]
    └── personal-goals.ts                 ← Metas pessoais [NOVO]
```

---

## 🎯 ROADMAP VISUAL ATUALIZADO

```
✅ CONCLUÍDO:
┌─ Sprint 1: Core ────────────────────┐
│ ✅ Schema XP/Níveis                 │
│ ✅ XP Bar na Navbar                 │
│ ✅ Toast de XP Ganho                │
│ ✅ Endpoint /award-xp               │
│ ✅ Animações e persistência         │
└─────────────────────────────────────┘

🔨 EM PROGRESSO:
┌─ Sprint 2: Achievements ────────────┐
│ 🔨 Sistema Achievement              │
│ 🔨 Streak System                    │
│ ⏳ Dashboard Gamificação             │
│ ⏳ Notif de Achievement              │
└─────────────────────────────────────┘

⏳ PRÓXIMOS:
┌─ Sprint 3: Challenges ──────────────┐
│ ⏳ Pool de Desafios                 │
│ ⏳ Detecção em Tempo Real           │
│ ⏳ UI de Desafios                   │
│ ⏳ Leaderboard Desafios             │
└─────────────────────────────────────┘

┌─ Sprint 4: Cosmética ──────────┬─ Sprint 5: Social + Metas ───────────┐
│ ⏳ Avatar Borders              │ ⏳ Metas Pessoais CRUD              │
│ ⏳ Badges Sistema              │ ⏳ Dashboard de Metas                │
│ ⏳ Profile Themes              │ ⏳ Stats Pessoais & Histórico        │
│ ⏳ Vitrine de Cosmética        │ ⏳ Leaderboard Global (opcional)     │
└────────────────────────────────┴─────────────────────────────────────┘
```

---

## 💡 IDEIAS EXTRAS (NICE-TO-HAVE)

### 1. **Prestige System** (Max Level Prestige)
Ao atingir nível 50, opção de "Prestigiar" resetando para level 1 mas ganhando special badge + 2x XP multiplicador

### 2. **Seasonal Battles**
A cada 3 meses, temporada temática (ex: "Summer Movie Marathon") com leaderboard próprio

### 3. **Daily Bonus Multiplier**
Acumula multiplicador de XP conforme completa desafios diários (dia 1: 1x, dia 3: 1.25x, dia 7: 1.5x)

### 4. **Mentorship System**
Usuários nível 30+ podem mentorar level 1-10, ganhando "Guide XP" diferente

### 5. **Social Features**
- Compartilhar achievements no Twitter
- Compare streaks com amigos
- Desafios privados entre 2 usuários

### 6. **Event Battles** 
"Oscars Challenge": vote em favoritos, ganha XP se acertar vencedor real

### 7. **Title Rarity**
Títulos obscuros ganham 2x XP (raros no pool TMDB)

### 8. **Weekly Missions**
Diferentes de desafios, são missões épicas com 3-5 steps para completar

---

## ✅ CHECKLIST FINAL

- [ ] Schema Prisma rodar migração sem erro
- [ ] Todas 5 fases implementadas
- [ ] UI consistente com rosa como cor primária
- [ ] Animações suaves respeitando `prefers-reduced-motion`
- [ ] Testes manuais passarem (veja seção abaixo)
- [ ] Performance: XP bar < 50ms render
- [ ] Mobile responsive em todas as páginas gamificação

---

## 🧪 CHECKLIST DE TESTES MANUAIS

### Fase 1
- [ ] Adicionar série → +50 XP recebido
- [ ] Completar episódio 8/10 → +135 XP (100 * 1.35)
- [ ] Atingir 1000 XP total → Level up para 2, barra reseta
- [ ] Refresh página → XP persiste

### Fase 2
- [ ] Desbloquear achievement "Primeira Sessão" ao adicionar primeira série
- [ ] Streak acumula e reseta após 48h sem atividade
- [ ] Aba Stats mostra corretamente todos os dados
- [ ] Toast de achievement mostra ao desbloquear

### Fase 3
- [ ] 3 desafios diários gerados
- [ ] Completar desafio "2 episódios" → contagem updatea em tempo real
- [ ] Toast notificando desafio completo aparece

### Fase 4
- [ ] Level 5 desbloqueia Purple Border
- [ ] Avatar mostra border corretamente
- [ ] Vitrine `/gamification/cosmetics` mostra 4+ items
- [ ] Equip cosmética → profile renderiza mudança

### Fase 5
- [ ] Criar meta "50 episódios"
- [ ] Assistir 25 episódios → meta mostra 50%
- [ ] Stats exibe histórico correto
---

## 🚀 PRÓXIMOS PASSOS IMEDIATOS (FASE 2)

### Sprint 2 — Checklist de Início

- [ ] Criar arquivo `src/lib/achievements.ts` com pool de 6+ achievements
- [ ] Implementar detecção automática de achievements desbloqueados
- [ ] Criar `src/components/StreakIndicator.tsx` com UI 🔥 + número
- [ ] Implementar lógica de streak em `ActivityLog` (incrementar/resetar)
- [ ] Criar `src/app/gamification/page.tsx` com dashboard visual
- [ ] Integrar toast de achievement unlock
- [ ] Testar manualmente: completar 10 filmes 10/10 → verificar unlock
- [ ] Commit: "FASE 2(init): achievements e streaks scaffold"

---

## 📝 NOTAS IMPORTANTES

### Desenvolvimento
- Sempre testar localmente antes de push
- Fazer commits por feature, não por arquivo
- Manter compatibilidade retroativa com FASE 1

### Performance
- XP bar renderiza em < 50ms
- Animações respeitam `prefers-reduced-motion`
- Toast de notificação autocloses em 3s

### Design
- Cor primária: `rgb(232, 105, 144)` (rosa)
- Tema geral: Dark mode com acentos rosa
- Responsive: mobile, tablet, desktop

### Banco de Dados
- Migrations rodadas e testadas
- Schema está robusto e escalável
- Campos opcionais para features futuras

---

## 🧪 TESTES — FASE 1 VALIDAÇÃO

Antes de iniciar FASE 2, validar:

- [ ] XP persiste ao refreshar página
- [ ] Level up anima corretamente
- [ ] Toast de +XP aparece ao completar episódio
- [ ] Usuário novo começa com level 1, 0 XP
- [ ] Score 10/10 dá 1.5x XP
- [ ] Barra de progresso preenche suavemente
- [ ] Nenhum erro no console
- [ ] Dados corretos no banco (Prisma Studio)

**Se tudo passar, FASE 2 está pronta para começar! 🎉**

---

*Documento atualizado: 30 de Abril de 2026*
*Status: Fase 1 Concluída ✨ | Fase 2 Em Progresso 🔨*