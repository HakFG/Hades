# HADES — Roadmap SISTEMA DE NOTIFICAÇÕES (Global)

> **Última atualização:** Maio 2026  
> **Status:** Parcialmente implementado  
> **Arquivos associados:** `src/lib/notifications.ts`, `src/components/NotificationPanel.tsx`, `src/app/api/notifications/`

---

## 📊 Índice

1. [Análise Atual do Estado](#análise-atual-do-estado)
2. [Tipos de Notificações](#tipos-de-notificações)
3. [Implementações Já Existentes](#implementações-já-existentes)
4. [Arquitetura Completa Recomendada](#arquitetura-completa-recomendada)
5. [Sistema de Triggers](#sistema-de-triggers)
6. [Painel de Notificações](#painel-de-notificações)
7. [Plano de Implementação](#plano-de-implementação)

---

## Análise Atual do Estado

### 🎯 O que o Sistema de Notificações já é

`src/lib/notifications.ts` é uma **lib que gera notificações** para o usuário. Características atuais:

- **Tipos suportados**: NEW_EPISODE, PREMIERE, RELATED_ADDED
- **Dados**: Vem de `prisma.entry` (watchlist do usuário)
- **Triggers**: Busca manual via `/api/notifications` endpoint
- **Persistência**: Não persistente — recalcula a cada vez
- **Painel**: `NotificationPanel.tsx` renderiza notificações
- **Estado**: Não há state global — cada request é fresh

### ✅ O que já funciona

#### 4.1 **Tipo: NEW_EPISODE** (JÁ IMPLEMENTADO)
- **Trigga**: Série em `WATCHING` tem novo episódio disponível
- **Lógica**: Busca `next_episode_to_air` do TMDB, compara com hoje
- **Notificação**: "Episódio X de [Série]"
- **Status**: ✅ Funcional

#### 4.2 **Tipo: PREMIERE** (JÁ IMPLEMENTADO)
- **Trigger**: Título em `PLANNING` vai estrear logo
- **Lógica**: Compara `releaseDate` do TMDB com hoje
- **Notificação**: "[Série] estreia em X dias"
- **Status**: ✅ Funcional

#### 4.3 **Tipo: RELATED_ADDED** (JÁ IMPLEMENTADO)
- **Trigger**: Uma continuação de algo na lista foi adicionada ao TMDB
- **Lógica**: Busca seque/spin-off de títulos WATCHING
- **Notificação**: "Nova temporada de [Série] foi anunciada"
- **Status**: ✅ Funcional

#### 4.4 **Painel de Notificações** (BÁSICO)
- Componente: `NotificationPanel.tsx`
- Renderiza: Lista de notificações com ícone, mensagem, data
- Status badge: Lida/não lida
- **Status**: ⏳ Existe mas é básico

---

## Tipos de Notificações

### Categorias Completas Recomendadas

| Tipo | Prioridade | Descrição | Exemplo |
|---|---|---|---|
| `NEW_EPISODE` | 🔴 Alta | Episódio novo disponível hoje/ontem | "Novo episódio: Breaking Bad S5E14" |
| `UPCOMING_EPISODE` | 🟡 Média | Episódio sai em 1-7 dias | "Breaking Bad S5E15 sai em 3 dias" |
| `SERIES_PREMIERE` | 🔴 Alta | Série nova estreia | "The Last of Us estreia hoje" |
| `SEASON_PREMIERE` | 🔴 Alta | Nova temporada começa | "Stranger Things S5 estreia em 2 semanas" |
| `RELATED_RELEASED` | 🔴 Alta | Sequel/spin-off/prequel foi adicionado | "Breaking Bad: Better Call Saul agora na lista" |
| `RELATED_ANNOUNCED` | 🟡 Média | Sequel/spin-off foi anunciado | "Confirmado: Breaking Bad prequel em produção" |
| `SERIES_CANCELLED` | 🔴 Alta | Série cancelada após temporada atual | "The Expanse foi cancelada após S6" |
| `SERIES_RENEWED` | 🟢 Baixa | Série renovada (positiva) | "Stranger Things renovada para S5" |
| `MILESTONE_REACHED` | 🟢 Baixa | Usuário atingiu milestone | "Você assistiu 100 episódios!" |
| `ACHIEVEMENT_UNLOCKED` | 🟢 Baixa | Novo badge desbloqueado | "Achievement: Completou 5 filmes de Horror" |
| `WATCHLIST_REMINDER` | 🟢 Baixa | Lembrança de série em pausa | "Você parou em The Office S7" |

---

## Implementações Já Existentes

### Libs & Componentes

| Arquivo | Tipo | Propósito | Status |
|---|---|---|---|
| `src/lib/notifications.ts` | Lib | Geração de notificações | ✅ |
| `src/components/NotificationPanel.tsx` | Component | Renderiza painel | ✅ |
| `src/app/api/notifications/route.ts` | API | Endpoint GET/POST | ✅ |
| `src/hooks/useXPNotification.ts` | Hook | Toast de XP (relacionado) | ✅ |
| `src/components/XPToastHost.tsx` | Component | Host de toasts | ✅ |

### Database Models

```prisma
// Não existe modelo de notificação persistente ainda!
// Recomendação: Criar modelo Notification para histórico
```

### APIs Existentes

| Rota | Método | Propósito |
|---|---|---|
| `/api/notifications` | GET | Retorna notificações atuais |
| `/api/notifications` | POST | Marca como lida |

---

## Arquitetura Completa Recomendada

### 🔴 CRÍTICO: Persistência de Notificações

**Problema atual**: Notificações não são persistentes. Cada refresh recalcula.

**Solução**: Criar modelo `Notification` no Prisma:

```prisma
model Notification {
  id String @id @default(cuid())
  
  // Tipo e conteúdo
  type NotificationType
  title String
  message String
  
  // Relativos
  entryId String?
  tmdbId Int?
  
  // Status
  read Boolean @default(false)
  readAt DateTime?
  
  // Prioridade
  priority NotificationPriority @default(MEDIUM)
  
  // Agrupamento
  groupKey String?  // Para agrupar notificações similares
  
  // Timestamps
  createdAt DateTime @default(now())
  expiresAt DateTime?  // Notificações expiram após 30 dias
  
  @@index([type])
  @@index([read])
  @@index([entryId])
  @@index([createdAt])
}

enum NotificationType {
  NEW_EPISODE
  UPCOMING_EPISODE
  SERIES_PREMIERE
  SEASON_PREMIERE
  RELATED_RELEASED
  RELATED_ANNOUNCED
  SERIES_CANCELLED
  SERIES_RENEWED
  MILESTONE_REACHED
  ACHIEVEMENT_UNLOCKED
  WATCHLIST_REMINDER
  CUSTOM
}

enum NotificationPriority {
  HIGH
  MEDIUM
  LOW
}
```

---

### 🎯 Sistema de Triggers

#### Trigger 1: NEW_EPISODE (Diário)
```typescript
/**
 * Job: Roda diariamente às 00:00 UTC
 * Busca: Todas as séries WATCHING
 * Lógica: Verifica se episódio novo saiu
 * Cria: Notificação NEW_EPISODE
 */
export async function checkNewEpisodes() {
  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
  const watching = await prisma.entry.findMany({ 
    where: { status: 'WATCHING', type: 'TV_SEASON' } 
  });

  for (const entry of watching) {
    const tmdbId = entry.parentTmdbId ?? entry.tmdbId;
    const res = await fetch(
      `https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${apiKey}`
    );
    const data = await res.json();
    
    if (data.next_episode_to_air) {
      const airDate = new Date(data.next_episode_to_air.air_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (airDate <= today) {
        // Episode saiu!
        await prisma.notification.create({
          data: {
            type: 'NEW_EPISODE',
            title: entry.title,
            message: `Episódio ${data.next_episode_to_air.episode_number} "${data.next_episode_to_air.name}" disponível!`,
            entryId: entry.id,
            tmdbId: entry.tmdbId,
            priority: 'HIGH',
            groupKey: `new-ep-${entry.tmdbId}`,
          }
        });
      }
    }
  }
}
```

#### Trigger 2: UPCOMING_EPISODE (Semanal)
```typescript
export async function checkUpcomingEpisodes() {
  const watching = await prisma.entry.findMany({ 
    where: { status: 'WATCHING', type: 'TV_SEASON' } 
  });

  for (const entry of watching) {
    const tmdbId = entry.parentTmdbId ?? entry.tmdbId;
    const res = await fetch(`https://api.themoviedb.org/3/tv/${tmdbId}`);
    const data = await res.json();
    
    if (data.next_episode_to_air) {
      const airDate = new Date(data.next_episode_to_air.air_date);
      const today = new Date();
      const daysUntil = Math.ceil((airDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntil > 0 && daysUntil <= 7) {
        // Episódio sai em 1-7 dias
        await prisma.notification.create({
          data: {
            type: 'UPCOMING_EPISODE',
            title: entry.title,
            message: `Episódio ${data.next_episode_to_air.episode_number} sai em ${daysUntil} dias`,
            entryId: entry.id,
            tmdbId: entry.tmdbId,
            priority: 'MEDIUM',
            groupKey: `upcoming-ep-${entry.tmdbId}`,
          }
        });
      }
    }
  }
}
```

#### Trigger 3: RELATED_RELEASED (Real-time via cron)
```typescript
export async function checkRelatedReleased() {
  const watching = await prisma.entry.findMany({ 
    where: { status: 'WATCHING' } 
  });

  for (const entry of watching) {
    const relations = await prisma.relation.findMany({
      where: { sourceEntryId: entry.id }
    });

    for (const rel of relations) {
      // Busca TMDB para ver se tornou disponível
      const tmdbRes = await fetch(`https://api.themoviedb.org/3/${rel.kind}/${rel.targetTmdbId}`);
      const tmdbData = await tmdbRes.json();
      
      if (tmdbData.status === 'Released' || tmdbData.status === 'Returning Series') {
        const existingNotif = await prisma.notification.findFirst({
          where: {
            type: 'RELATED_RELEASED',
            groupKey: `related-${rel.targetTmdbId}`,
          }
        });

        if (!existingNotif) {
          await prisma.notification.create({
            data: {
              type: 'RELATED_RELEASED',
              title: rel.title,
              message: `${rel.title} agora foi lançado! Adicione à sua lista.`,
              entryId: entry.id,
              tmdbId: rel.targetTmdbId,
              priority: 'HIGH',
              groupKey: `related-${rel.targetTmdbId}`,
            }
          });
        }
      }
    }
  }
}
```

#### Trigger 4: MILESTONE_REACHED
```typescript
export async function checkMilestones() {
  const gamification = await prisma.userGamification.findFirst({});
  if (!gamification) return;

  const watching = await prisma.entry.findMany({
    where: { status: 'COMPLETED' }
  });

  const milestones = [
    { count: 10, label: '10 Títulos' },
    { count: 25, label: '25 Títulos' },
    { count: 50, label: '50 Títulos' },
    { count: 100, label: '100 Títulos' },
    { count: 250, label: '250 Títulos' },
  ];

  for (const milestone of milestones) {
    if (watching.length === milestone.count) {
      const existingNotif = await prisma.notification.findFirst({
        where: {
          type: 'MILESTONE_REACHED',
          groupKey: `milestone-${milestone.count}`,
        }
      });

      if (!existingNotif) {
        await prisma.notification.create({
          data: {
            type: 'MILESTONE_REACHED',
            title: 'Parabéns!',
            message: `Você completou ${milestone.label}!`,
            priority: 'LOW',
            groupKey: `milestone-${milestone.count}`,
          }
        });
      }
    }
  }
}
```

---

### 🔧 Sistema de Scheduler

Criar `src/app/api/notifications/scheduler.ts`:

```typescript
import { CronJob } from 'node-cron';

export function initializeNotificationScheduler() {
  // 00:00 - Diariamente: Novos episódios
  CronJob.from({
    cronTime: '0 0 * * *',
    onTick: async () => {
      console.log('[Cron] Checking new episodes...');
      await checkNewEpisodes();
    },
    start: true,
    timezone: 'UTC'
  });

  // 08:00 - Semanalmente: Episódios próximos
  CronJob.from({
    cronTime: '0 8 * * 1',  // Segunda-feira às 8:00
    onTick: async () => {
      console.log('[Cron] Checking upcoming episodes...');
      await checkUpcomingEpisodes();
    },
    start: true,
    timezone: 'UTC'
  });

  // 12:00 - Diariamente: Relacionados lançados
  CronJob.from({
    cronTime: '0 12 * * *',
    onTick: async () => {
      console.log('[Cron] Checking related releases...');
      await checkRelatedReleased();
    },
    start: true,
    timezone: 'UTC'
  });

  // 06:00 - Diariamente: Milestones
  CronJob.from({
    cronTime: '0 6 * * *',
    onTick: async () => {
      console.log('[Cron] Checking milestones...');
      await checkMilestones();
    },
    start: true,
    timezone: 'UTC'
  });

  // Cleanup: Remover notificações expiradas
  CronJob.from({
    cronTime: '0 */6 * * *',  // A cada 6 horas
    onTick: async () => {
      console.log('[Cron] Cleaning up expired notifications...');
      await prisma.notification.deleteMany({
        where: {
          expiresAt: { lt: new Date() }
        }
      });
    },
    start: true,
    timezone: 'UTC'
  });
}
```

---

## Painel de Notificações

### UI Recomendada

Melhorar `src/components/NotificationPanel.tsx`:

```typescript
interface NotificationPanelProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onClear: () => void;
}

export default function NotificationPanel({
  notifications,
  onMarkAsRead,
  onClear,
}: NotificationPanelProps) {
  const [filter, setFilter] = useState<NotificationType | 'all'>('all');
  
  const grouped = groupNotifications(notifications);
  const filtered = filter === 'all' 
    ? grouped 
    : grouped.filter(n => n.type === filter);

  return (
    <div className="notification-panel">
      <div className="panel-header">
        <h3>Notificações ({notifications.filter(n => !n.read).length})</h3>
        <div className="header-actions">
          <button onClick={onClear}>Limpar</button>
        </div>
      </div>

      {/* Filtros */}
      <div className="notification-filters">
        <button 
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          Todas
        </button>
        {notificationTypes.map(type => (
          <button
            key={type}
            className={filter === type ? 'active' : ''}
            onClick={() => setFilter(type)}
          >
            {getNotificationLabel(type)}
          </button>
        ))}
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="notification-empty">Sem notificações</div>
      ) : (
        <div className="notification-list">
          {filtered.map(notif => (
            <NotificationItem
              key={notif.id}
              notification={notif}
              onRead={() => onMarkAsRead(notif.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function NotificationItem({ notification, onRead }) {
  const icon = getNotificationIcon(notification.type);
  const color = getPriorityColor(notification.priority);

  return (
    <div 
      className={`notification-item ${!notification.read ? 'unread' : ''}`}
      onClick={onRead}
    >
      <div className="notification-icon" style={{ color }}>
        {icon}
      </div>
      <div className="notification-content">
        <h4>{notification.title}</h4>
        <p>{notification.message}</p>
        <span className="notification-time">
          {formatRelativeTime(notification.createdAt)}
        </span>
      </div>
      {!notification.read && <div className="unread-indicator" />}
    </div>
  );
}
```

### Integração Global

Adicionar ao layout global (`src/app/layout.tsx`):

```typescript
'use client';

import { useEffect, useState } from 'react';
import NotificationPanel from '@/components/NotificationPanel';

export default function RootLayout({ children }) {
  const [showPanel, setShowPanel] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function loadNotifications() {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    }

    loadNotifications();
    // Poll a cada 5 minutos
    const interval = setInterval(loadNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <html>
      <body>
        {/* Header com notification bell */}
        <header>
          <button 
            className="notification-bell"
            onClick={() => setShowPanel(!showPanel)}
          >
            🔔
            {unreadCount > 0 && (
              <span className="badge">{unreadCount}</span>
            )}
          </button>
        </header>

        {/* Painel que aparece ao lado */}
        {showPanel && (
          <NotificationPanel
            notifications={notifications}
            onMarkAsRead={async (id) => {
              await fetch(`/api/notifications/${id}`, { method: 'PATCH' });
              loadNotifications();
            }}
            onClear={async () => {
              await fetch('/api/notifications/clear', { method: 'POST' });
              loadNotifications();
            }}
          />
        )}

        {children}
      </body>
    </html>
  );
}
```

---

## Configurações de Notificação (Preferências do Usuário)

### Modelo no Prisma

```prisma
model NotificationPreferences {
  id String @id @default("main")
  userId String @unique
  
  // Por tipo
  enableNewEpisode Boolean @default(true)
  enableUpcomingEpisode Boolean @default(true)
  enableSeriesPremiere Boolean @default(true)
  enableSeasonPremiere Boolean @default(true)
  enableRelatedReleased Boolean @default(true)
  enableRelatedAnnounced Boolean @default(false)
  enableSeriesCancelled Boolean @default(true)
  enableSeriesRenewed Boolean @default(false)
  enableMilestones Boolean @default(true)
  enableAchievements Boolean @default(true)
  
  // Geral
  emailNotifications Boolean @default(false)
  pushNotifications Boolean @default(true)
  soundEnabled Boolean @default(true)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### UI de Preferências

Adicionar página `src/app/settings/notifications/page.tsx`:

```typescript
export default function NotificationSettingsPage() {
  const [prefs, setPrefs] = useState<NotificationPreferences>(null);

  return (
    <div className="settings-page">
      <h1>Preferências de Notificações</h1>
      
      <section>
        <h3>Por Tipo</h3>
        <label>
          <input 
            type="checkbox"
            checked={prefs?.enableNewEpisode}
            onChange={(e) => updatePrefs({ enableNewEpisode: e.target.checked })}
          />
          Novo episódio
        </label>
        {/* ... outros tipos ... */}
      </section>

      <section>
        <h3>Canais</h3>
        <label>
          <input type="checkbox" checked={prefs?.emailNotifications} />
          Email
        </label>
        <label>
          <input type="checkbox" checked={prefs?.pushNotifications} />
          Push
        </label>
        <label>
          <input type="checkbox" checked={prefs?.soundEnabled} />
          Som
        </label>
      </section>

      <button onClick={() => savePreferences(prefs)}>Salvar</button>
    </div>
  );
}
```

---

## Plano de Implementação

### 🗓 Fases Recomendadas

**Phase 1 (Imediato)** — Persistência & Estrutura
- [ ] Criar modelo `Notification` no Prisma
- [ ] Criar model `NotificationPreferences`
- [ ] Implementar API routes básicas (GET, POST, PATCH)
- [ ] Migration: `npx prisma migrate dev`

**Phase 2 (1 semana)** — Triggers & Scheduler
- [ ] Implementar 4 triggers principais (NEW_EPISODE, UPCOMING, RELATED, MILESTONE)
- [ ] Setup scheduler com node-cron
- [ ] Testar com dados reais

**Phase 3 (2 semanas)** — UI & UX
- [ ] Melhorar `NotificationPanel.tsx`
- [ ] Adicionar filtros e agrupamento
- [ ] Implementar página de preferences
- [ ] Integrar bell icon no header

**Phase 4+ (Nice-to-have)**
- [ ] Email notifications
- [ ] Push notifications (service worker)
- [ ] Sound alerts
- [ ] Desktop notifications

---

## Checkpoints de Qualidade

- [ ] Notificações persistem após refresh
- [ ] Scheduler dispara 4 principais tipos corretamente
- [ ] Preferences respeitadas ao criar notificações
- [ ] Painel visível e funcional
- [ ] Agrupamento de notificações similares
- [ ] Limpeza automática de notificações expiradas
- [ ] Performance: <100ms para carregar painel

---

## Referências

- Node-cron: https://www.npmjs.com/package/node-cron
- Prisma: https://www.prisma.io/docs
- TMDB TV Endpoint: https://developer.themoviedb.org/docs/get-tv-details
- Toast Notifications Pattern: https://ui.shadcn.com/docs/components/toast
