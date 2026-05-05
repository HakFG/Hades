# HADES - Análise e Soluções (Mai 2026)

## 📋 Índice
1. [BUGS](#bugs)
2. [MELHORIAS VISUAIS](#melhorias-visuais)
3. [NOVAS FEATURES](#novas-features)

---

## 🐛 BUGS

### 1. Sistema de Personal Goals - Auto-Completion Bug (CRÍTICO)

**Localização:** `/src/app/profile/page.tsx` > aba `goals` + `/src/lib/personal-goals.ts`

**Problema:**
- Goals salvos automaticamente se marcam como "completos" ao sair e voltar na aba
- Não há persistência confiável do estado `completed` no banco de dados
- Lógica de atualização pode estar invocando validações automáticas indevidas

**Raiz Provável:**
1. **Validação automática ao carregar:** O componente `PersonalGoalsSection.tsx` pode estar disparando uma validação automática de progresso quando goals são recarregados
2. **Falta de controle de estado:** O campo `completed` no modelo Prisma pode estar sendo atualizado automaticamente por triggers ou middleware não intencionais
3. **Race condition em múltiplas requisições:** Se há atualização via API, pode haver inconsistência entre estado local e servidor
4. **Hook useEffect problemático:** Possível re-render que dispara validação automática

**Análise da Estrutura Atual:**
- `PersonalGoalsSection.tsx` - Carrega e exibe goals
- `PersonalGoalModal.tsx` - Modal de edição
- `personal-goals.ts` - Lógica de cálculo (goalProgressPercent, goalDaysLeft)
- **Faltando:** Arquivo de API route para goals (`/src/app/api/goals/` não existe)

**Soluções Recomendadas:**

#### Solução 1: Auditoria do Fluxo de Estado (RÁPIDA - 1-2h)
```
1. Verificar se há rota API para atualizar goals
   - Se SIM: analisar se há lógica de auto-completion
   - Se NÃO: criar rota `/api/goals/[id]/route.ts` com PUT/PATCH controlada
   
2. Adicionar logs em PersonalGoalsSection.tsx:
   - Log ao carregar goals
   - Log ao disparar atualização
   - Log de toda mudança no campo `completed`
   
3. Verificar schema Prisma:
   - Campo `completedAt` pode estar com trigger automático?
   - Campo `updatedAt` pode estar causando recálculos?
```

#### Solução 2: Separar Estados de Leitura/Escrita (ROBUSTA - 2-3h)
```
1. Criar dois hooks distintos:
   - useGoalsRead: apenas para carregar goals (sem side effects)
   - useGoalsWrite: para atualizar, com validação explícita
   
2. Adicionar campo no schema:
   - `lastManualUpdate?: DateTime` - marca quando usuário atualizou manualmente
   - Sistema não pode mudar `completed` sem ser por ação explícita do usuário
   
3. Implementar validação de intenção:
   - Botão "Marcar como Completo" separado
   - Checkbox com confirmação antes de marcar completo
```

#### Solução 3: Revisar Lógica de Cálculo (INVESTIGATIVA - 1h)
```
1. Função goalProgressPercent() em personal-goals.ts:
   - Verificar se retorna 100% quando current === target
   - Se SIM e função retorna 100%: há código que pode estar completando automaticamente?
   
2. Componente GoalCard:
   - Verificar se há onClick automático ou listener acidental
   - Verificar se existe fetch() sendo disparado sem consentimento
```

---

## 🎨 MELHORIAS VISUAIS

### 1. Cards de Airing Now / In Progress / Next Up - Layout e Grid

**Localização:** 
- `/src/app/page.tsx` - Renderização dos cards
- `/src/components/AiringProgressCard.tsx`
- `/src/components/NextUpCard.tsx`

**Problema Atual:**
- Cards muito grandes quebram em 1 título por linha
- Layout não responsivo
- Incompatível com a visão de 5+ títulos simultâneos

---

### 2. Referência Visual Exata — AniList (ANÁLISE COMPLETA)

> Esta seção documenta com precisão o comportamento visual do AniList observado nas capturas de tela fornecidas, servindo como especificação fiel para implementação.

---

#### 2.1 Grid de Cards — Estado Normal (sem hover)

**Referência:** Imagem 1 (Airing Now com 5 cards) + Imagem 10 (Upcoming)

O AniList exibe os cards em um grid horizontal de **5 colunas** em desktop. Cada card é um **poster vertical** com proporção **2:3**. O conteúdo abaixo do poster, fora do card, exibe:

```
[POSTER - proporção 2:3]
Ep 7              ← linha 1: número do episódio (fonte ~12px, bold, cor branca/cinza claro)
6d 18h 6m         ← linha 2: tempo até o próximo episódio (fonte ~11px, cor #e85d75 / vermelho-rosa)
```

- O texto de episódio e tempo fica **fora do poster**, abaixo dele, com fundo transparente (mesma cor do fundo da página)
- Não há overlay no estado normal — o poster é limpo, sem gradiente
- O gap entre cards é de aproximadamente **12-16px**
- **Dot de status** (bolinha colorida) aparece no **canto superior esquerdo** do poster, sobreposto à imagem:
  - 🟢 Verde → status "Watching" / "Currently Airing" (em andamento sendo assistido)
  - 🟠 Laranja → status "Upcoming" / "Plan to Watch" (planejado/em breve)
  - Tamanho da bolinha: ~10px de diâmetro
  - Posição: `top: 6px; left: 6px` (absoluta, sobre o poster)
  - Sem borda, sem sombra — apenas a bolinha sólida colorida

**CSS do grid (desktop-first):**
```css
.cards-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

@media (max-width: 1024px) {
  .cards-grid { grid-template-columns: repeat(4, 1fr); }
}

@media (max-width: 768px) {
  .cards-grid { grid-template-columns: repeat(3, 1fr); }
}

@media (max-width: 480px) {
  .cards-grid { grid-template-columns: repeat(2, 1fr); }
}

.card-wrapper {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.card-poster {
  position: relative;
  aspect-ratio: 2 / 3;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
}

.card-poster img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* Dot de status — sobreposto ao poster */
.status-dot {
  position: absolute;
  top: 6px;
  left: 6px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  z-index: 2;
}

.status-dot.watching   { background-color: #4cca74; } /* verde   */
.status-dot.upcoming   { background-color: #e8872d; } /* laranja */
.status-dot.completed  { display: none; }             /* sem dot */

/* Texto abaixo do poster */
.card-ep-label {
  font-size: 12px;
  font-weight: 600;
  color: #c9d1d9;
  line-height: 1.3;
}

.card-time-label {
  font-size: 11px;
  color: #e85d75;
  line-height: 1.2;
}
```

---

#### 2.2 Estado Hover — Overlay sobre o Card

**Referência:** Imagem 2 (hover em "Tongari Boushi no Atelier")

Ao passar o mouse sobre o poster, um **overlay escuro** cobre toda a área do card:

```
┌──────────────────────────┐
│ [thumbnail pequena]      │  ← imagem reduzida no canto esquerdo (≈ 40x55px)
│  1 episode behind        │  ← estado/mensagem (fonte 12px, bold, branco)
│  Tongari Boushi no…      │  ← título (fonte 13px, branco, truncado 1 linha)
│  ████████░░░░░  5+       │  ← barra de progresso verde + badge de episódios
│  Progress: 5/13          │  ← progresso textual (fonte 11px, cinza claro)
└──────────────────────────┘
```

**Detalhes do hover:**
- Background do overlay: `rgba(0, 0, 0, 0.85)` cobrindo 100% do poster
- Transição suave: `opacity: 0 → 1` com `transition: opacity 0.2s ease`
- O thumbnail pequeno à esquerda é a mesma imagem do poster em miniatura (≈ 40px largura)
- A mensagem de estado ("1 episode behind", "Up to date", etc.) aparece acima do título em destaque
- Barra de progresso: cor verde `#4cca74`, height `4px`, border-radius `2px`, fundo `rgba(255,255,255,0.2)`
- O badge `5+` à direita da barra indica episódios disponíveis não assistidos

**CSS do overlay:**
```css
.card-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  opacity: 0;
  transition: opacity 0.2s ease;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 10px;
  gap: 4px;
}

.card-poster:hover .card-overlay {
  opacity: 1;
}

.overlay-status-msg {
  font-size: 12px;
  font-weight: 700;
  color: #ffffff;
}

.overlay-title {
  font-size: 13px;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.overlay-progress-bar-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
}

.overlay-progress-bar {
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.2);
  overflow: hidden;
}

.overlay-progress-bar-fill {
  height: 100%;
  background: #4cca74;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.overlay-ep-badge {
  font-size: 11px;
  font-weight: 700;
  color: #4cca74;
  white-space: nowrap;
}

.overlay-progress-text {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
}
```

---

#### 2.3 Título Finalizado na Aba "In Progress"

**Referência:** Imagem 3 (cards Trigun Stampede + título em japonês)

Títulos com status **completado** que ainda aparecem na listagem seguem este padrão:

- Card exibido em **formato retangular/landscape** (não poster vertical), proporção ~**16:9 ou 3:2**
- Dois cards lado a lado, ocupando aproximadamente metade da largura cada
- Sem overlay automático — overlay aparece apenas no hover (mesmo comportamento)
- **Sem dot de status** — títulos completados não exibem bolinha colorida
- O título aparece como texto abaixo do card (igual ao padrão dos outros)

```css
/* Card de título completado — sem dot de status */
.card-poster.completed .status-dot {
  display: none;
}

.card-poster.completed {
  opacity: 0.85; /* leve desaturação opcional para indicar concluído */
}
```

---

#### 2.4 Dots de Status — Bolinha no Canto Superior do Poster

**Referência:** Imagem 9 (card Re:Zero com dot verde) + Imagem 10 (cards com dot laranja)

O AniList possui um sistema de **dots coloridos** sobrepostos ao canto superior esquerdo de cada poster para indicar o status do título na lista do usuário. Este sistema deve ser implementado de forma idêntica no HADES:

**Mapeamento de cores por status:**

| Status no HADES        | Cor do Dot  | Hex       | Descrição visual      |
|------------------------|-------------|-----------|----------------------|
| Watching / Airing Now  | 🟢 Verde    | `#4cca74` | Assistindo ativamente |
| Upcoming / Plan Watch  | 🟠 Laranja  | `#e8872d` | Planejado / em breve  |
| On Hold / Paused       | 🔵 Azul     | `#02a9ff` | Em pausa              |
| Dropped                | 🔴 Vermelho | `#e13333` | Dropado               |
| Completed              | *(sem dot)* | —         | Sem bolinha           |

**Implementação do componente StatusDot:**
```tsx
// /src/components/StatusDot.tsx

type StatusType = 'watching' | 'upcoming' | 'on_hold' | 'dropped' | 'completed'

const STATUS_COLORS: Record<StatusType, string | null> = {
  watching:  '#4cca74',
  upcoming:  '#e8872d',
  on_hold:   '#02a9ff',
  dropped:   '#e13333',
  completed: null,
}

interface StatusDotProps {
  status: StatusType
}

export function StatusDot({ status }: StatusDotProps) {
  const color = STATUS_COLORS[status]
  if (!color) return null

  return (
    <span
      style={{
        position: 'absolute',
        top: '6px',
        left: '6px',
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        backgroundColor: color,
        zIndex: 2,
        display: 'block',
        pointerEvents: 'none',
      }}
    />
  )
}
```

**Onde adicionar o StatusDot:**
- `AiringProgressCard.tsx` — dot verde se `status === 'watching'`
- `NextUpCard.tsx` — dot laranja se `status === 'upcoming'`, verde se `status === 'watching'`
- Cards de resultado de busca, listagens de staff/studio e qualquer poster na home

---

### 3. Solução Recomendada — Implementação dos Cards

#### AiringProgressCard.tsx — Comportamento Completo
```
ESTADO NORMAL (sem hover):
- Poster limpo sem overlay, sem gradiente
- StatusDot no canto superior esquerdo (verde se watching)
- Nenhum texto sobre o poster

Abaixo do poster (fora dele):
- Linha 1: "Ep X" — fonte 12px, bold, cor #c9d1d9
- Linha 2: "Xd Xh Xm" — fonte 11px, cor #e85d75

HOVER (overlay sobre o poster):
- Background: rgba(0,0,0,0.85) cobrindo 100% do poster
- Thumbnail miniatura à esquerda (~40px)
- Mensagem de estado: "1 episode behind" / "Up to date" / "X episodes behind"
- Título do anime (1 linha, overflow: ellipsis, 13px)
- Barra de progresso verde (4px) + badge "X+" à direita
- Texto: "Progress: X/Y" em 11px cinza claro
- Transição: opacity 0.2s ease
```

#### NextUpCard.tsx — Comportamento Completo
```
ESTADO NORMAL (sem hover):
- Poster limpo sem overlay
- StatusDot colorido no canto superior esquerdo
  (laranja se upcoming, verde se watching)
- Nenhum texto sobre o poster

Abaixo do poster:
- Título (1 linha, truncado, 12px, cor #c9d1d9)
- Score ou contador de ep (11px, cinza)

HOVER:
- Overlay rgba(0,0,0,0.85)
- Linha 1: Ep number (ex: "Ep 5" ou "Resume • Ep 8")
- Linha 2: Título (truncado em 1 linha)
- Linha 3: Barra de progresso verde (4px)
- Linha 4: "X/Y" — progresso textual
- Transição: opacity 0.2s ease
```

#### Estrutura de Arquivos
```
/src/components/
├── AiringProgressCard.tsx
├── AiringProgressCard.module.css   (NOVO)
├── NextUpCard.tsx
├── NextUpCard.module.css           (NOVO)
├── StatusDot.tsx                   (NOVO — componente reutilizável)
```

#### Grid Principal em app/page.tsx
```
Seção "Airing Now":
- Grid 5 colunas, gap 12px
- Cada item: wrapper flex-col com poster + texto abaixo

Seção "In Progress":
- Mesmo grid
- Completados: sem dot, opacity 0.85

Seção "Next Up":
- Mesmo grid
- Ordenado por urgência/prioridade
- Dot laranja para upcoming, verde para watching
```

---

## ✨ NOVAS FEATURES

### 1. Página de Staff (Pessoas — Atores, Diretores, etc.)

**Conceito:** Sistema completo de gestão de pessoas (staff/crew) com integração TMDB, similar ao AniList.

**Localização:** 
- Novo: `/src/app/staff/` (page.tsx, [id]/page.tsx)
- Novo: `/src/components/StaffComponents/` (vários)
- Novo: `/src/lib/staff.ts` (lógica de staff)
- Novo: `/src/app/api/staff/` (rotas API)

---

#### 1.1 Design do Header de Pessoa — Referência AniList Exata

**Referência:** Imagem 4 (Yuuki Tabata — anilist.co/staff/110063/Yuuki-Tabata)

O header de uma página de staff do AniList segue este layout preciso:

```
┌─────────────────────────────────────────────────────────────┐
│  [FOTO]  │  Yuuki Tabata                    [✏️] [❤️ 696]  │
│  200x280 │  田島裕基  ← nome nativo (japonês, menor, cinza)  │
│          │                                                   │
│          │  Birth: Jul 30, 1984                             │
│          │  Age: 41                                         │
│          │  Gender: Male                                    │
│          │  Years active: 2001-Present                      │
│          │  Hometown: Koga, Fukuoka Prefecture, Japan       │
│          │                                                   │
│          │  [Bio — texto completo, fonte 13px]             │
└─────────────────────────────────────────────────────────────┘
```

**Detalhes visuais precisos (Imagem 4):**
- Foto da pessoa: ~**200×280px**, `border-radius: 4px`, sem borda
- Nome principal: fonte **~28-32px**, bold, cor `#e5e5e5`
- Metadados (Birth, Age, etc.): fonte **13px**, label em `#c9d1d9` (bold), valor em `rgba(255,255,255,0.7)`, lista vertical com ~6px entre itens
- Bio: fonte **13px**, cor `rgba(255,255,255,0.7)`, exibida por completo (ou com "Read More" se muito longa)
- Botão favoritar: canto **superior direito**, formato `❤️ 696` — fundo `#e85d75`, texto branco, `border-radius: 4px`, `padding: 6px 14px`
- Fundo do header: sem background especial — usa o fundo padrão da página
- Layout: `display: grid; grid-template-columns: 200px 1fr; gap: 32px; padding: 24px 0;`

**CSS do Header:**
```css
.staff-header {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 32px;
  padding: 24px 0;
  align-items: flex-start;
}

.staff-photo {
  width: 200px;
  height: 280px;
  object-fit: cover;
  border-radius: 4px;
  display: block;
}

.staff-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.staff-name-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.staff-name {
  font-size: 30px;
  font-weight: 700;
  color: #e5e5e5;
  margin: 0;
  line-height: 1.2;
}

.staff-native-name {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.45);
  margin: 2px 0 12px 0;
}

.staff-favorite-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 16px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: background 0.2s ease, transform 0.15s ease;
  flex-shrink: 0;
}

.staff-favorite-btn.favorited {
  background: #e85d75;
  color: #ffffff;
}

.staff-favorite-btn.not-favorited {
  background: rgba(255, 255, 255, 0.08);
  color: #8ba0b2;
}

.staff-favorite-btn:hover {
  filter: brightness(1.1);
}

.staff-favorite-btn.pulse {
  animation: favPulse 0.2s ease;
}

@keyframes favPulse {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.12); }
  100% { transform: scale(1); }
}

.staff-meta-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin: 8px 0;
}

.staff-meta-item {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
}

.staff-meta-item strong {
  color: #c9d1d9;
  font-weight: 600;
}

.staff-bio {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.6;
  margin-top: 10px;
  max-width: 600px;
}

/* Links na bio (nomes clicáveis) */
.staff-bio a {
  color: #67b7d1;
  text-decoration: none;
}

.staff-bio a:hover {
  text-decoration: underline;
}
```

---

#### 1.2 Grid de Roles — Referência AniList Exata

**Referência:** Imagem 5 (Anime Staff Roles) + Imagem 6 (Manga Staff Roles)

Após o header, as produções são exibidas em **seções separadas por tipo de mídia**, cada uma com seu próprio grid:

```
ANIME STAFF ROLES           ← título da seção (uppercase, 13px, #8ba0b2)
─────────────────────────────────────────────────────────────────
[Poster] [Poster] [Poster] [Poster] [Poster] [Poster]   ← 6 colunas
🟢 Título  🟠 Título  Título  Título  🟢 Título  Título  ← dot + nome (12px)
  Role       Role     Role    Role     Role     Role     ← função (11px, cinza)
```

**Detalhes visuais precisos:**
- Grid: **6 colunas** (diferente da home que usa 5)
- Cada card: poster vertical (2:3) + texto abaixo (fora do card)
- Linha 1 abaixo do poster: dot colorido + título da produção — fonte **12px**, cor `#c9d1d9`
- Linha 2: role/função — fonte **11px**, cor `rgba(255,255,255,0.5)`
- **Dot colorido aparece antes do título** (inline, não sobre o poster):
  - 🟢 Verde (`#4cca74`) → produção lançada / em exibição
  - 🟠 Laranja (`#e8872d`) → não lançada / TBA
- Hover: apenas `transform: scale(1.03)` — **sem overlay escuro** nas páginas de staff

**Diferença importante entre a home e a página de staff:**

| Característica      | Home (Airing Now)          | Página de Staff (Roles)      |
|---------------------|----------------------------|------------------------------|
| Nº de colunas       | 5                          | 6                            |
| Dot de status       | Sobre o poster (absoluto)  | Antes do título (inline)     |
| Hover               | Overlay escuro completo    | Apenas scale(1.03), sem overlay |
| Texto abaixo        | Ep + tempo                 | Título + role/função         |

**CSS do grid de roles:**
```css
.roles-section-title {
  font-size: 13px;
  font-weight: 700;
  color: #8ba0b2;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 28px 0 14px 0;
}

.roles-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
}

@media (max-width: 1200px) {
  .roles-grid { grid-template-columns: repeat(5, 1fr); }
}
@media (max-width: 900px) {
  .roles-grid { grid-template-columns: repeat(4, 1fr); }
}
@media (max-width: 600px) {
  .roles-grid { grid-template-columns: repeat(3, 1fr); }
}

.role-card-wrapper {
  display: flex;
  flex-direction: column;
  gap: 5px;
  cursor: pointer;
}

.role-card-poster {
  aspect-ratio: 2 / 3;
  border-radius: 4px;
  overflow: hidden;
  transition: transform 0.15s ease;
}

.role-card-poster:hover {
  transform: scale(1.03);
}

.role-card-poster img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* Título inline com dot */
.role-card-title-row {
  display: flex;
  align-items: center;
  gap: 5px;
}

.role-card-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.role-card-dot.airing   { background: #4cca74; }
.role-card-dot.upcoming { background: #e8872d; }

.role-card-title {
  font-size: 12px;
  color: #c9d1d9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.role-card-role {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.2;
  padding-left: 13px; /* alinhar com o título após o dot */
}
```

---

#### 1.3 Design da Página de Studio — Referência AniList Exata

**Referência:** Imagem 7 (Aniplex — anilist.co/studio/17/Aniplex) + Imagem 8 (listagem por ano)

```
┌──────────────────────────────────────────────────────────────────┐
│  Aniplex                                         [❤️ 2257]      │
│                                                                  │
│                              [☐ On My List]  [↕ Newest ▾]      │
├──────────────────────────────────────────────────────────────────┤
│  TBA                                                             │
│  [Poster] [NO IMAGE] [Poster] [Poster] [Poster] [Poster]        │
│                                                                  │
│  2027                                                            │
│  [Poster] [Poster] [Poster] [Poster]                            │
│  🟠 Título  Título  🟠 Título  Título                            │
│                                                                  │
│  2026                                                            │
│  [Poster] [Poster] [Poster] [Poster] [Poster]                   │
└──────────────────────────────────────────────────────────────────┘
```

**Detalhes visuais precisos (Imagens 7 e 8):**
- Nome do studio: fonte **~24px**, bold, cor `#e5e5e5`, alinhado à esquerda
- Botão favoritar: mesmo estilo da página de pessoa — `❤️ 2257`, fundo `#e85d75`, canto superior direito
- **Sem foto/avatar** e **sem metadados** — studio tem apenas nome + favorito
- Filtros: checkbox "On My List" + dropdown "Newest" — fonte 13px, cor cinza
- Agrupamento por **ano** como header de seção: fonte ~**18px**, bold, cor `#e5e5e5`
- Seção "TBA" aparece primeiro, antes dos anos
- Grid: **6 colunas** (igual ao de roles)
- Placeholder "NO IMAGE": fundo `#2b3547`, texto "NO IMAGE" centralizado em `rgba(255,255,255,0.3)`
- Dot antes do título (inline, igual ao padrão de roles)
- Hover: apenas `transform: scale(1.03)` — sem overlay

**CSS do Studio:**
```css
.studio-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 24px 0 16px 0;
}

.studio-name {
  font-size: 24px;
  font-weight: 700;
  color: #e5e5e5;
  margin: 0;
}

.studio-filters {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 16px 0;
  justify-content: flex-end;
}

.studio-filter-checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #8ba0b2;
  cursor: pointer;
}

.studio-sort-select {
  font-size: 13px;
  color: #8ba0b2;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}

.studio-year-header {
  font-size: 18px;
  font-weight: 700;
  color: #e5e5e5;
  margin: 28px 0 14px 0;
}

.no-image-placeholder {
  width: 100%;
  aspect-ratio: 2 / 3;
  background: #2b3547;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.3);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
```

---

#### 1.4 Favoritar Staff — Feature no Profile do Usuário

**Conceito:** O usuário pode favoritar pessoas de staff da página de staff, e esses favoritos ficam visíveis no seu perfil — idêntico ao sistema do AniList.

**Arquivos:**
```
Novo:      /src/app/api/staff/[id]/favorite/route.ts
Novo:      /src/app/api/staff/favorites/route.ts
Novo:      /src/components/StaffFavoriteButton.tsx
Modificar: /src/app/profile/page.tsx — adicionar seção "Favorite Staff"
Modificar: /src/lib/staff.ts — funções toggleFavoriteStaff, getFavoriteStaff
```

**Schema Prisma — Extensão:**
```prisma
model FavoriteStaff {
  id       String @id @default(cuid())
  userId   String
  personId String

  user     User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  person   Person @relation(fields: [personId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())

  @@unique([userId, personId])
  @@index([userId])
}
```

**API Routes:**
```
POST   /api/staff/[id]/favorite   → adicionar aos favoritos
DELETE /api/staff/[id]/favorite   → remover dos favoritos
GET    /api/staff/favorites        → listar favoritos do usuário autenticado
```

**Componente StaffFavoriteButton:**
```tsx
// /src/components/StaffFavoriteButton.tsx
// Visual: ❤️ + contagem de favoritos globais
// Estado: preenchido (favoritado) ou vazio (não favoritado)
// Animação: pulse ao clicar
// Atualização: otimista (sem esperar resposta da API)

interface StaffFavoriteButtonProps {
  personId: string
  totalFavorites: number      // total global de usuários que favoritaram
  isFavorited: boolean        // se o usuário atual favoritou
  onToggle: () => void
}
```

**Exibição no Profile do Usuário:**
```
Nova seção em /src/app/profile/page.tsx:

┌──────────────────────────────────────────┐
│  FAVORITE STAFF                          │
│  ──────────────────────────────────────  │
│  [Foto] [Foto] [Foto] [Foto] [Foto]     │
│  Nome   Nome   Nome   Nome   Nome        │
│  Role   Role   Role   Role   Role        │
└──────────────────────────────────────────┘

- Grid de 5 colunas (mesmas regras responsivas dos outros grids)
- Foto da pessoa: 120x120px, border-radius: 50% (circular)
- Nome: 13px, bold, centralizado, cor #c9d1d9
- Role (knownForDepartment): 12px, cinza, centralizado
- Hover: scale(1.03) + link para /staff/[id]
- Ordenado por: data de adição (mais recente primeiro)
```

---

#### 1.5 Arquitetura de Dados

**Schema Prisma (Completo):**
```prisma
model Person {
  id        String   @id @default(cuid())
  tmdbId    Int      @unique
  
  // Dados Básicos
  name          String
  nativeName    String?  // nome no idioma original (ex: 田島裕基)
  biography     String?  @db.Text
  gender        Int?     // 0=notset, 1=female, 2=male
  birthDate     String?  // "YYYY-MM-DD"
  deathDate     String?  // "YYYY-MM-DD" ou null
  age           Int?
  yearsActive   String?  // ex: "2001-Present"
  hometown      String?  // cidade/país de origem
  
  // Mídias Sociais & Links
  imdbId    String?
  homepage  String?
  
  // Imagens
  profilePath String?
  
  // Metadados TMDB
  knownForDepartment String?
  popularity         Float?
  
  // Relações
  filmRoles      FilmRole[]      @relation("ActorFilmRoles")
  seriesRoles    SeriesRole[]    @relation("ActorSeriesRoles")
  favoritedBy    FavoriteStaff[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([name])
  @@index([popularity])
}

model FilmRole {
  id       String @id @default(cuid())
  personId String
  person   Person @relation("ActorFilmRoles", fields: [personId], references: [id], onDelete: Cascade)
  
  tmdbMovieId Int
  title       String
  posterPath  String?
  releaseDate String?
  status      String?  // "Released", "In Production", "Planned" etc.
  
  character   String?
  department  String?
  job         String?
  order       Int?
  
  createdAt DateTime @default(now())
  @@unique([personId, tmdbMovieId])
}

model SeriesRole {
  id       String @id @default(cuid())
  personId String
  person   Person @relation("ActorSeriesRoles", fields: [personId], references: [id], onDelete: Cascade)
  
  tmdbSeriesId Int
  title        String
  posterPath   String?
  firstAirDate String?
  status       String?  // "Returning Series", "Ended", "In Production" etc.
  
  character    String?
  department   String?
  job          String?
  episodeCount Int?
  
  createdAt DateTime @default(now())
  @@unique([personId, tmdbSeriesId])
}

model FavoriteStaff {
  id       String @id @default(cuid())
  userId   String
  personId String

  user     User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  person   Person @relation(fields: [personId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())

  @@unique([userId, personId])
  @@index([userId])
}
```

---

#### 1.6 Fluxo de Dados

**1. Busca de Pessoa (Search):**
```
Usuário → Text Input → TMDB API
TMDB retorna: [{ id, name, profilePath, knownForDepartment, popularity }]
→ Mostrar resultados em grid
```

**2. Ao Clicar em Pessoa:**
```
GET /api/staff/{tmdbId}
1. Verificar se Person já existe no DB
2. Se NÃO: fazer request TMDB + salvar no DB
3. Buscar roles:
   - GET /3/person/{tmdbId}/movie_credits
   - GET /3/person/{tmdbId}/tv_credits
4. Salvar/atualizar todos os dados
5. Retornar dados compilados
```

**3. Renderizar Página do Staff:**
```
Layout:
┌─────────────────────────────────────────┐
│ [Foto 200x280] │ Nome                   │
│                │ Nome nativo (menor)    │
│                │                        │
│                │ Birth: ...             │
│                │ Age: ...               │
│                │ Gender: ...            │
│                │ Years active: ...      │
│                │ Hometown: ...          │
│                │                        │
│                │ [Bio]     [❤️ X]       │
├─────────────────────────────────────────┤
│ ANIME STAFF ROLES                       │
│ Grid 6 colunas (dot + título + role)    │
├─────────────────────────────────────────┤
│ MANGA STAFF ROLES                       │
│ Grid 6 colunas (dot + título + role)    │
└─────────────────────────────────────────┘
```

---

#### 1.7 API Routes Necessárias

**GET `/api/staff/search`**
```
Query: ?q=john&type=person
Response: Array<{ id, name, profilePath, knownForDepartment }>
```

**GET `/api/staff/[id]`**
```
Response: {
  person: Person,
  filmRoles: FilmRole[],
  seriesRoles: SeriesRole[],
  totalFavorites: number,
  isFavoritedByCurrentUser: boolean,
  stats: { totalCredits, filmCount, seriesCount, departmentCounts }
}
```

**POST `/api/staff/[id]/favorite`**
```
Response: { success, isFavorited: true, totalFavorites: number }
```

**DELETE `/api/staff/[id]/favorite`**
```
Response: { success, isFavorited: false, totalFavorites: number }
```

**POST `/api/staff/[id]/refresh`**
```
Força recarga de dados do TMDB
Response: { success, updatedAt }
```

**GET `/api/staff/favorites`**
```
Response: Array<{ person: Person, addedAt: DateTime }>
Ordenado por: addedAt DESC
```

---

#### 1.8 Componentes Necessários

**1. `/src/app/staff/page.tsx` — Lista + Search**
```
- Search input com TMDB autocomplete
- Grid de pessoas visitadas recentemente
- Popular people carousel
- Filtro: Atuações / Direção / Roteiro / Produção
```

**2. `/src/app/staff/[id]/page.tsx` — Perfil Individual**
```
- StaffHeader
- Seções: "Anime Staff Roles" / "Manga Staff Roles"
- RolesGrid (6 colunas com dots de status inline)
- Filtros opcionais por ano e departamento
```

**3. `/src/components/StaffHeader.tsx`**
```
- Foto (200x280px, border-radius: 4px)
- Nome principal + nome nativo (menor, cinza)
- Lista de metadados (Birth, Age, Gender, Years active, Hometown)
- Bio com "Read More" se longa
- StaffFavoriteButton no canto superior direito
- Botão de edição (ícone ✏️) para admins
```

**4. `/src/components/RoleCard.tsx`**
```
- Poster vertical 2:3
- Hover: apenas scale(1.03), sem overlay
- Abaixo do poster:
  - [dot inline] + Título (12px, #c9d1d9)
  - Role/função (11px, cinza, indentado)
```

**5. `/src/components/RolesGrid.tsx`**
```
- Grid 6 colunas (responsivo)
- Seções separadas por tipo (Anime / Manga / Film)
- Header de seção em uppercase, cor #8ba0b2
```

**6. `/src/components/StaffFavoriteButton.tsx`**
```
- ❤️ + número de favoritos globais
- Estado: preenchido/vazio
- Animação pulse ao clicar
- Atualização otimista
```

**7. `/src/components/StatusDot.tsx`** *(reutilizado na home também)*
```
- Bolinha 10px sobre o poster (posição absoluta) para cards da home
- Bolinha 8px inline antes do título para cards de roles/studio
- Verde (#4cca74) → watching/airing
- Laranja (#e8872d) → upcoming/planned
- Azul (#02a9ff) → on hold
- Vermelho (#e13333) → dropped
- Sem dot → completed
```

---

#### 1.9 Timeline de Implementação

| Fase | Tarefas | Tempo |
|------|---------|-------|
| 1 | Schema Prisma (Person, FilmRole, SeriesRole, FavoriteStaff) + migrations | 1-2h |
| 2 | API routes (search, get, favorite, refresh, favorites) | 1-2h |
| 3 | Componente StatusDot.tsx + integração nos cards da home | 1h |
| 4 | Componentes UI (StaffHeader, RoleCard, RolesGrid, StaffFavoriteButton) | 2-3h |
| 5 | Páginas (staff/page.tsx, staff/[id]/page.tsx) | 2-3h |
| 6 | Integração com TMDB (search + credits) | 1-2h |
| 7 | Seção "Favorite Staff" no profile do usuário | 1h |
| 8 | Styling + Responsividade | 1-2h |
| 9 | Testes e Otimizações | 1h |
| **Total** | | **11-17h** |

---

## 📝 Resumo Executivo

### Prioridades

**🔴 CRÍTICO (Fazer Primeiro):**
1. Bug de Personal Goals — Sistema completando automaticamente
   - Impacto: Dados incorretos
   - Esforço: 2-4h
   - Risco: Alto se não corrigir

**🟠 IMPORTANTE (Fazer Depois):**
2. Melhorias Visuais dos Cards — Grid de 5 colunas, estado normal AniList-like
   - Impacto: UX significante
   - Esforço: 3-5h
   - Risco: Baixo

3. Componente StatusDot — Bolinha verde/laranja sobre o poster
   - Impacto: Informação visual imediata
   - Esforço: 1h
   - Risco: Muito baixo

4. Hover Overlay — Estilo AniList nos cards de Airing/In Progress
   - Impacto: UX muito melhor
   - Esforço: 2-3h
   - Risco: Baixo

**🟡 DESEJÁVEL (Médio Prazo):**
5. Nova Feature: Staff/People Page + Studio Page
   - Impacto: Funcionalidade nova completa
   - Esforço: 11-17h
   - Risco: Médio (integração TMDB)

6. Favoritar Staff no Profile
   - Impacto: Personalização do perfil
   - Esforço: 2-3h (após staff page pronta)
   - Risco: Baixo

### Checklist de Implementação

```
BUGS:
☐ Auditoria do fluxo de state de goals
☐ Adicionar logs em PersonalGoalsSection.tsx
☐ Verificar/criar rota API /api/goals/
☐ Testar: salvar, sair, voltar, verificar estado

MELHORIAS VISUAIS:
☐ Criar componente StatusDot.tsx (verde=watching, laranja=upcoming, azul=on_hold, vermelho=dropped)
☐ Implementar grid responsivo (5 col desktop, gap 12px)
☐ Atualizar AiringProgressCard.tsx:
  ☐ Estado normal: poster limpo + StatusDot (10px, absoluto top-left) + texto abaixo (Ep X / Xd Xh Xm)
  ☐ Hover: overlay rgba(0,0,0,0.85) + mensagem de estado + título + barra de progresso verde (4px)
☐ Atualizar NextUpCard.tsx:
  ☐ Estado normal: poster limpo + StatusDot colorido
  ☐ Hover: overlay com ep + título + barra de progresso
☐ Completados: sem dot + opacity 0.85
☐ Adicionar CSS modules para cards
☐ Testar em múltiplos breakpoints

STAFF PAGE:
☐ Criar migrations Prisma (Person, FilmRole, SeriesRole, FavoriteStaff)
☐ Adicionar campo nativeName e hometown no model Person
☐ Implementar API routes (/api/staff/*)
☐ Criar StaffHeader.tsx (foto 200x280 + nome + nativo + metadados + bio + botão favoritar)
☐ Criar RoleCard.tsx (poster 2:3 + hover scale apenas + dot inline + título + role)
☐ Criar RolesGrid.tsx (6 col, seções por tipo: Anime / Manga / Film)
☐ Criar StaffFavoriteButton.tsx (❤️ + contagem global + pulse animation)
☐ Criar páginas staff/page.tsx e staff/[id]/page.tsx
☐ Integrar busca TMDB (search + credits)
☐ Adicionar seção "Favorite Staff" no profile (grid 5 col, foto circular 120px)
☐ Adicionar links de navegação no menu principal
☐ Testes e otimizações
```

---

**Documento Gerado:** 4 de Maio de 2026  
**Versão:** 2.0  
**Status:** Pronto para Implementação