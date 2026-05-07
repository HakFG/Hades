# HADES - Análise e Soluções (Mai 2026)

## 📋 Índice
1. [BUGS](#bugs)
2. [MELHORIAS VISUAIS](#melhorias-visuais)
3. [NOVAS FEATURES](#novas-features)

--

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