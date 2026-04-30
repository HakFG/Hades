# HADES - Roadmap de Features (Personal Site)

> Sugestoes de funcionalidades baseadas em TMDB endpoints + gamificacao pessoal.  
> **Nenhuma feature social/compartilhamento publico**: foco 100% no uso individual.

**Data de criacao**: 30/04/2026 (revisado)  
**Projeto**: Hades Media Tracker (Next.js + Prisma + TMDB API)

---

## Indice

1. [Analise Atual](#analise-atual)
2. [Features baseadas em TMDB](#features-baseadas-em-tmdb-sem-interacao-social)
3. [Features de Gamificacao Pessoal](#features-de-gamificacao-pessoal)
4. [Features Sugeridas apos Analise do Projeto](#features-sugeridas-apos-analise-do-projeto)
5. [Roadmap Sugerido](#roadmap-sugerido-personal-site)
6. [Exemplos de Implementacao](#exemplos-de-implementacao)
7. [Conclusao](#conclusao)

---

## Analise Atual

### Funcionalidades Existentes (ja implementadas)

**HOME PAGE:**

- Exibicao de series em airing, com proximo episodio.
- Trending TV/Movies weekly.
- Recomendacoes personalizadas por genero.
- Top-rated shows/movies.
- Top favorites do usuario.
- Activity feed, como historico pessoal.

**SEARCH PAGE:**

- Busca por titulo, Movies/TV.
- Filtros avancados por ano, genero, rating e formato.
- Expansao de temporadas para series.
- Integracao com `ListEditor`.

**PROFILE PAGE:**

- Exibicao de estatisticas, incluindo contadores por status.
- Visao por tipo, TV/Movies.
- Favorites ranking pessoal.
- Activity timeline.
- Abas: Overview, Series, Films, Favorites/Favourites e Stats.

**BANCO DE DADOS:**

- `Entry`: media, score, progress, status, favoritos.
- `Relation`: relacoes customizadas entre titulos.
- `Profile`: bio, avatar, banner, uso pessoal.
- `ActivityLog`: historico de mudancas.

**INTEGRACOES:**

- TMDB API: search, trending, details, recommendations e airing.
- Retry logic com exponential backoff.
- Language fallback: en-US / pt-BR.
- Image optimization.

---

## Features baseadas em TMDB (sem interacao social)

### TIER 1: ALTA PRIORIDADE + FACIL IMPLEMENTACAO

#### 1. Pagina de Similar & Recommendations (Enhanced)

**Prioridade**: ALTA  
**Dificuldade**: FACIL  
**Estimado**: 4-6 horas  
**Endpoints TMDB**:

- `/tv/{id}/similar`
- `/movie/{id}/similar`
- `/tv/{id}/recommendations`
- `/movie/{id}/recommendations`

**Descricao:**

Criar uma pagina dedicada para cada titulo mostrando:

- Titulos similares, com filtro por relevancia e rating.
- Recomendacoes personalizadas.
- Comparacao lado-a-lado contra o titulo atual.
- Botao "Add to list" direto de cada card.
- Rating do TMDB vs score pessoal.

**Impacto UX**: 4/5, descoberta de conteudo.  
**Nova Tabela no BD**: nenhuma, apenas queries.

---

#### 2. Trending People & Cast Discovery

**Prioridade**: ALTA  
**Dificuldade**: FACIL  
**Estimado**: 5-7 horas  
**Endpoints TMDB**:

- `/trending/person/week`
- `/person/{id}`
- `/person/{id}/credits`

**Descricao:**

Pagina para descobrir atores/atrizes em alta:

- Trending actors/actresses.
- Filmografia de cada pessoa.
- Titulos ja assistidos vs nao assistidos, com marcacao pessoal.
- Opcao de favoritar ator/atriz, sem interacao com outros usuarios.

**Impacto UX**: 3/5, descoberta e engagement.  
**Nova Tabela no BD**: `FavoritePerson`, apenas para registro pessoal.

```prisma
model FavoritePerson {
  id          String   @id @default(cuid())
  tmdbId      Int      @unique
  name        String
  profilePath String?
  knownFor    String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

#### 3. Watch Providers & Onde Assistir

**Prioridade**: ALTA  
**Dificuldade**: FACIL  
**Estimado**: 3-5 horas  
**Endpoints TMDB**:

- `/tv/{id}/watch/providers`
- `/movie/{id}/watch/providers`

**Descricao:**

Mostrar onde assistir cada titulo:

- Providers disponiveis no Brasil.
- Logo do servico.
- Link direto para o titulo ou link do TMDB.
- Badge de "Gratis com anuncios".
- Aviso de "Coming soon" quando aplicavel.

**Impacto UX**: 4/5, muito util para decidir onde assistir.  
**Nova Tabela no BD**: cache opcional dos providers para evitar chamadas repetidas.

---

### TIER 2: MEDIA PRIORIDADE + DIFICULDADE MEDIA

#### 4. Stats Dashboard Avancado (pessoal)

**Prioridade**: MEDIA  
**Dificuldade**: MEDIA  
**Estimado**: 8-10 horas  
**Endpoints TMDB**: nenhum, apenas dados do BD.

**Descricao:**

Dashboard estatistico tipo AniList, sem comparacao social:

- Graficos de generos favoritos, anos e studios.
- Tempo total assistido em horas.
- Media de score por status.
- Timeline de progresso, com calendario pessoal.
- Generos mais assistidos em barras horizontais.
- Atores/diretores mais assistidos, baseado no historico e favoritos.

**Impacto UX**: 5/5, gamificacao e visao de evolucao.

---

#### 5. Collections & Listas Personalizadas (sem compartilhamento)

**Prioridade**: MEDIA  
**Dificuldade**: MEDIA  
**Estimado**: 10-12 horas  
**Endpoints TMDB**: nenhum.

**Descricao:**

Sistema de colecoes tipo playlists, apenas para uso pessoal:

- Criar colecoes customizadas, como "Top 10 de Terror" ou "Sequencias para Maratonar".
- Arrastar-e-soltar para reordenar.
- Marcar desafios pessoais, como "Assista tudo em 1 mes".
- Estatisticas por colecao, incluindo tempo e notas.

**Impacto UX**: 4/5, organizacao pessoal.

**Schema Prisma:**

```prisma
model Collection {
  id          String   @id @default(cuid())
  name        String
  description String?  @db.Text
  image       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  items       CollectionItem[]
}

model CollectionItem {
  id           String   @id @default(cuid())
  collectionId String
  entryId      String
  order        Int

  collection   Collection @relation(fields: [collectionId], references: [id], onDelete: Cascade)
  entry        Entry      @relation(fields: [entryId], references: [id], onDelete: Cascade)

  @@unique([collectionId, entryId])
}
```

---

## Features de Gamificacao Pessoal

### TIER 2: MEDIA PRIORIDADE + DIFICULDADE MEDIA

#### 6. Achievements & Badges (Gamificacao pessoal)

**Prioridade**: MEDIA  
**Dificuldade**: MEDIA  
**Estimado**: 6-8 horas  
**Endpoints TMDB**: nenhum.

**Descricao:**

Sistema de conquistas pessoais, sem ranking:

- "Cinefilo": assistir 50 filmes.
- "Maratonista": assistir 100 episodios em uma semana.
- "Critico Agucado": dar nota 10 em 5 titulos.
- "Colecionador": criar 10 colecoes.
- "Explorador": assistir 20 generos diferentes.
- "Sequencial": manter streak de 7 dias adicionando ao menos um titulo.

**Impacto UX**: 4/5, motivacao pessoal.

**Schema Prisma:**

```prisma
model Achievement {
  id          String   @id @default(cuid())
  code        String   @unique
  name        String
  description String
  icon        String?
  rarity      String   // "COMMON", "RARE", "EPIC", "LEGENDARY"

  createdAt   DateTime @default(now())
}

model UserAchievement {
  id            String   @id @default(cuid())
  achievementId String
  unlockedAt    DateTime @default(now())

  achievement   Achievement @relation(fields: [achievementId], references: [id], onDelete: Cascade)

  @@unique([achievementId])
}
```

---

### TIER 3: MEDIA/BAIXA PRIORIDADE

#### 7. Calendario Pessoal do Usuario

**Prioridade**: MEDIA  
**Dificuldade**: FACIL  
**Estimado**: 5-6 horas  
**Endpoints TMDB**: nenhum.

**Descricao:**

Calendario visual mostrando:

- Dias em que voce assistiu algo, baseado no `ActivityLog`.
- Cores diferentes para episodios assistidos vs filmes.
- Quantidade de episodios por dia.
- Streak atual de dias consecutivos assistindo.

**Impacto UX**: 4/5, visualizacao de habitos.

---

#### 8. Desafios Pessoais (Challenges)

**Prioridade**: MEDIA  
**Dificuldade**: MEDIA  
**Estimado**: 8-10 horas

**Descricao:**

Desafios individuais como:

- "Assista 5 filmes de terror em 1 semana".
- "De 10 notas 10 este mes".
- "Complete 3 series nesta temporada".
- "Assista 20 episodios de uma unica serie em 3 dias".

**Implementacao:**

- O usuario pode criar seus proprios desafios ou escolher templates.
- Barra de progresso e notificacao ao completar.
- Integracao com achievements: completar desafios rende badges.

**Impacto UX**: 5/5, gamificacao forte e replayability.

---

### TIER 4: FEATURES PREMIUM / AVANCADAS (opcionais)

#### 9. Sistema de Recomendacoes com ML (Basico)

**Prioridade**: BAIXA  
**Dificuldade**: DIFICIL  
**Estimado**: 20-25 horas  
**Endpoints TMDB**: multiplos.

**Descricao:**

Algoritmo de recomendacao baseado em:

- Generos favoritos, com pesos implicitos.
- Scores anteriores.
- Atores favoritos.
- Studios/diretores assistidos.
- Trending vs historico pessoal.

**Impacto UX**: 4/5, personalizacao.

---

## Gamificacao Adicional

Sugestoes de mecanicas puramente pessoais:

- **Niveis de usuario**: baseado em XP acumulado por titulo completado, nota alta, colecao criada etc.
- **Selos de maratona**: "Assistiu todos os filmes de um diretor" ou "Completou todas as temporadas de uma serie".
- **Desbloqueio de temas visuais**: liberar novos estilos de card ou cores de fundo ao atingir certas conquistas.
- **Meta anual**: definir meta, por exemplo 100 filmes, e acompanhar barra de progresso.
- **Relatorio mensal**: resumo do que foi assistido no mes, com generos, horas e scores medios, estilo Spotify Wrapped.

Essas mecanicas aumentam o engajamento sem necessidade de interacao social.

---

## Features Sugeridas apos Analise do Projeto

> Ideias baseadas na estrutura atual do Hades: `Entry`, `Relation`, `ActivityLog`, `Profile`, `NotificationPanel`, filtros da Search Page, progresso por episodio, notas pessoais, favoritos, backup/import e refresh TMDB.

### 10. Next Up Inteligente

**Prioridade**: ALTA  
**Dificuldade**: FACIL/MEDIA  
**Estimado**: 4-6 horas  
**Base atual aproveitada**: `Entry.progress`, `Entry.totalEpisodes`, `Entry.status`, Home Page `Airing Now` e `In Progress`.

**Descricao:**

Criar uma area "Next Up" que responde a pergunta: "o que eu devo assistir agora?"

- Priorizar series `WATCHING` com episodio pendente.
- Separar "continua agora", "quase acabando" e "parado faz tempo".
- Mostrar proximo episodio calculado: `progress + 1`.
- Sugerir filmes curtos quando o usuario nao quer iniciar serie.
- Botao rapido para incrementar episodio ou marcar filme como completo.

**Impacto UX**: 5/5, uso diario direto.

**Nova Tabela no BD**: nenhuma.

---

### 11. Inbox de Episodios e Estreias

**Prioridade**: ALTA  
**Dificuldade**: MEDIA  
**Estimado**: 6-8 horas  
**Base atual aproveitada**: `NotificationPanel`, Home Page `Airing Now`, TMDB next episode, status `WATCHING` e `UPCOMING`.

**Descricao:**

Transformar notificacoes em uma inbox pessoal util:

- Notificar quando uma serie `WATCHING` tiver episodio novo.
- Notificar quando um titulo `UPCOMING` for lancado.
- Agrupar notificacoes por titulo.
- Acao rapida: "marcar episodio como visto", "abrir titulo", "adiar".
- Modo silencioso para titulos pausados/dropped.

**Impacto UX**: 5/5, reduz esquecimento de series em andamento.

**Schema opcional:**

```prisma
model PersonalNotification {
  id        String   @id @default(cuid())
  entryId   String?
  type      String
  title     String
  message   String
  actionUrl String?
  read      Boolean  @default(false)
  snoozedUntil DateTime?
  createdAt DateTime @default(now())
}
```

---

### 12. Health Check da Biblioteca

**Prioridade**: MEDIA  
**Dificuldade**: FACIL  
**Estimado**: 3-5 horas  
**Base atual aproveitada**: `refresh-all`, `Entry.hidden`, `Entry.private`, `customImage`, `imagePath`, `bannerPath`, `Relation`.

**Descricao:**

Pagina ou painel de manutencao para encontrar problemas na biblioteca:

- Titulos sem poster/banner.
- Series sem `totalEpisodes`.
- Entradas com progresso maior que total.
- Temporadas duplicadas ou relacoes quebradas.
- Titulos com metadata antiga.
- Botao "corrigir tudo possivel" usando refresh TMDB.

**Impacto UX**: 4/5, mantem a base limpa e confiavel.

**Nova Tabela no BD**: nenhuma.

---

### 13. Diario de Sessao / Watch Journal

**Prioridade**: MEDIA  
**Dificuldade**: MEDIA  
**Estimado**: 6-9 horas  
**Base atual aproveitada**: `ActivityLog`, `Entry.notes`, datas de inicio/fim e score.

**Descricao:**

Adicionar um diario pessoal mais rico, alem das notas gerais do titulo:

- Registrar uma sessao de watch: data, quantidade de episodios, humor e nota curta.
- Ver historico por titulo.
- Ver historico por dia/semana.
- Diferenciar "progresso tecnico" de "memoria pessoal".
- Permitir buscar frases em notas e diario.

**Impacto UX**: 4/5, deixa o tracker mais pessoal e memoravel.

**Schema opcional:**

```prisma
model WatchSession {
  id          String   @id @default(cuid())
  entryId     String
  watchedAt   DateTime @default(now())
  amount      Int      @default(1)
  kind        String   // "EPISODE", "MOVIE", "REWATCH", "NOTE"
  mood        String?
  note        String?  @db.Text

  entry       Entry    @relation(fields: [entryId], references: [id], onDelete: Cascade)

  @@index([entryId])
  @@index([watchedAt])
}
```

---

### 14. Sistema de Tags Pessoais

**Prioridade**: MEDIA  
**Dificuldade**: MEDIA  
**Estimado**: 5-7 horas  
**Base atual aproveitada**: filtros da Profile/Search, `Entry.notes`, favoritos e collections futuras.

**Descricao:**

Tags criadas pelo usuario para organizar de um jeito que generos TMDB nao cobrem:

- Tags como `comfort`, `obra-prima`, `ver com calma`, `plot twist`, `nostalgia`, `estudar roteiro`.
- Filtro por tags na Profile Page.
- Tags exibidas no editor e no detalhe do titulo.
- Busca combinada: status + score + tag.
- Tags automaticas opcionais: `quase-finalizado`, `sem-score`, `favorito-sem-rank`.

**Impacto UX**: 4/5, organizacao pessoal mais expressiva.

**Schema opcional:**

```prisma
model Tag {
  id        String   @id @default(cuid())
  name      String   @unique
  color     String?
  createdAt DateTime @default(now())

  entries   EntryTag[]
}

model EntryTag {
  id      String @id @default(cuid())
  entryId String
  tagId   String

  entry   Entry @relation(fields: [entryId], references: [id], onDelete: Cascade)
  tag     Tag   @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@unique([entryId, tagId])
}
```

---

### 15. Rewatch Planner

**Prioridade**: MEDIA  
**Dificuldade**: FACIL/MEDIA  
**Estimado**: 4-6 horas  
**Base atual aproveitada**: `rewatchCount`, status `REWATCHING`, `finishDate`, `ActivityLog`.

**Descricao:**

Um planejador para reassistir filmes/series sem baguncar a lista principal:

- Criar fila "quero reassistir".
- Sugerir reassistidas por data: "voce viu isso ha 2 anos".
- Mostrar quantas vezes cada titulo foi reassistido.
- Ao iniciar, mudar para `REWATCHING` e controlar progresso.
- Ao terminar, incrementar `rewatchCount`.

**Impacto UX**: 4/5, muito bom para filmes favoritos e series comfort.

**Nova Tabela no BD**: opcional. Pode comecar apenas com `rewatchCount` + status.

---

### 16. Modo Decidir por Mim

**Prioridade**: MEDIA  
**Dificuldade**: FACIL  
**Estimado**: 3-5 horas  
**Base atual aproveitada**: filtros, status, score, generos, runtime, progress.

**Descricao:**

Um seletor pessoal para quando o usuario nao sabe o que assistir:

- Botao "Escolher algo pra mim".
- Filtros rapidos: filme/serie, curto/longo, genero, nota minima, status.
- Pode priorizar titulos `PLANNING`, filmes nao vistos ou series quase finalizadas.
- Resultado com 3 opcoes: seguro, ousado e rapido.

**Impacto UX**: 5/5, feature divertida e util para uso real.

**Nova Tabela no BD**: nenhuma.

---

### 17. Temporadas e Franquias em Ordem

**Prioridade**: MEDIA  
**Dificuldade**: MEDIA  
**Estimado**: 6-9 horas  
**Base atual aproveitada**: `Relation`, `parentTmdbId`, `seasonNumber`, pagina de detalhes.

**Descricao:**

Melhorar o uso das relacoes para organizar ordem de consumo:

- Linha do tempo de temporadas de uma serie.
- Ordem de filmes de uma franquia.
- Mostrar "anterior" e "proximo" no detalhe do titulo.
- Detectar lacunas: voce assistiu temporada 3 mas nao temporada 2.
- Botao "adicionar proximos da franquia/serie".

**Impacto UX**: 4/5, excelente para organizacao e continuidade.

**Nova Tabela no BD**: nenhuma, aproveita `Relation`.

---

### 18. Relatorio Mensal Automatico

**Prioridade**: MEDIA  
**Dificuldade**: MEDIA  
**Estimado**: 7-10 horas  
**Base atual aproveitada**: `ActivityLog`, Stats Tab, scores, generos, `Profile`.

**Descricao:**

Criar uma pagina de resumo mensal pessoal:

- Filmes assistidos no mes.
- Episodios assistidos.
- Horas aproximadas.
- Melhor nota do mes.
- Genero dominante.
- Serie mais acompanhada.
- Sequencia de dias ativos.
- Texto-resumo automatico para o usuario salvar localmente.

**Impacto UX**: 5/5, recompensa visual e retrospectiva pessoal.

**Nova Tabela no BD**: nenhuma no MVP; pode ser calculado sob demanda.

---

### 19. Metas Pessoais por Periodo

**Prioridade**: MEDIA  
**Dificuldade**: MEDIA  
**Estimado**: 5-8 horas  
**Base atual aproveitada**: `ActivityLog`, Stats, Challenges.

**Descricao:**

Metas configuraveis sem qualquer ranking:

- Assistir 100 filmes no ano.
- Completar 12 series no ano.
- Assistir 30 episodios no mes.
- Reduzir backlog `PLANNING`.
- Dar score para todos os completados sem nota.

**Impacto UX**: 4/5, transforma estatisticas em direcao.

**Schema opcional:**

```prisma
model PersonalGoal {
  id        String   @id @default(cuid())
  name      String
  metric    String   // "MOVIES_COMPLETED", "EPISODES", "SERIES_COMPLETED", "BACKLOG_REDUCTION"
  target    Int
  period    String   // "MONTH", "YEAR", "CUSTOM"
  startDate DateTime
  endDate   DateTime
  createdAt DateTime @default(now())
}
```

---

### 20. Busca Avancada Dentro da Minha Lista

**Prioridade**: ALTA  
**Dificuldade**: FACIL/MEDIA  
**Estimado**: 4-6 horas  
**Base atual aproveitada**: Profile filters, Search Page filters, `Entry.notes`, `genres`, `studio`, `staff`.

**Descricao:**

Uma busca focada na biblioteca pessoal, nao no TMDB:

- Buscar por titulo, genero, studio, nota, status, ano.
- Buscar dentro das notas pessoais.
- Filtro "sem nota", "sem data de termino", "sem poster", "favorito sem rank".
- Ordenacoes salvas: melhor nota, mais recente, maior progresso, mais antigo sem atualizar.
- Exportar resultado filtrado como JSON.

**Impacto UX**: 5/5, melhora muito a manutencao e uso do acervo.

**Nova Tabela no BD**: nenhuma.

---

## Roadmap Sugerido (Personal Site)

### Fase 1: Foundation (Semanas 1-2)

**Foco:** features rapidas com alto impacto e baixa dificuldade.

**Semana 1:**

- Next Up Inteligente (Feature #10): 6h.
- Busca Avancada Dentro da Minha Lista (Feature #20): 6h.
- Modo Decidir por Mim (Feature #16): 4h.
- **Total:** ~16h, cerca de 2 dias.

**Semana 2:**

- Watch Providers (Feature #3): 4h.
- Inbox de Episodios e Estreias (Feature #11): 8h.
- Health Check da Biblioteca (Feature #12): 5h.
- Similar & Recommendations (Feature #1): 6h.
- Trending People (Feature #2): 6h.
- **Total:** ~29h, cerca de 3-4 dias.

### Fase 2: Organizacao e Estatisticas (Semanas 3-4)

**Foco:** organizar melhor a biblioteca pessoal e transformar dados em decisao.

**Semana 3:**

- Stats Dashboard (Feature #4): 10h.
- Collections API (Feature #5): 8h.
- Sistema de Tags Pessoais (Feature #14): 7h.
- Temporadas e Franquias em Ordem (Feature #17): 8h.
- **Total:** ~33h, cerca de 4 dias.

**Semana 4:**

- Diario de Sessao / Watch Journal (Feature #13): 8h.
- Rewatch Planner (Feature #15): 6h.
- Relatorio Mensal Automatico (Feature #18): 8h.
- Metas Pessoais por Periodo (Feature #19): 6h.
- **Total:** ~28h, cerca de 3-4 dias.

### Fase 3: Gamificacao Avancada (Semanas 5-6)

**Foco:** desafios, calendario, achievements e progressao individual.

**Semana 5:**

- Achievements Backend (Feature #6): 8h.
- Personal Calendar (Feature #7): 6h.
- Challenges System (Feature #8): 10h.
- **Total:** ~26h, cerca de 3 dias.

**Semana 6:**

- Integracao de conquistas com desafios (Feature #8 + #6): 8h.
- Level/XP System: 6h.
- Desbloqueio de temas visuais por conquistas: 6h.
- Barra de meta anual: 4h.
- **Total:** ~24h, cerca de 3 dias.

### Fase 4: Refinamento e ML (Semanas 7+)

- Recomendacoes ML basica (Feature #9).
- Melhorias visuais e de performance.
- Exportacao de dados e backup das listas.

---

## Exemplos de Implementacao

### Exemplo 1: Endpoint de Trending People com Filmografia (sem social)

```typescript
// src/app/api/trending-people/route.ts
import { prisma } from '@/lib/prisma';

const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const timeWindow = searchParams.get('timeWindow') || 'week';

  try {
    const trendingRes = await fetch(
      `${BASE_URL}/trending/person/${timeWindow}?api_key=${API_KEY}`,
      { next: { revalidate: 3600 } }
    );
    const trendingData = await trendingRes.json();

    const people = await Promise.all(
      trendingData.results.slice(0, 10).map(async (person: any) => {
        const creditsRes = await fetch(
          `${BASE_URL}/person/${person.id}/combined_credits?api_key=${API_KEY}`,
          { next: { revalidate: 7200 } }
        );
        const creditsData = await creditsRes.json();
        return {
          ...person,
          credits: creditsData.cast?.slice(0, 5) || [],
        };
      })
    );

    const tmdbIds = people.flatMap(p => p.credits.map((c: any) => c.id)).filter(Boolean);
    const userEntries = await prisma.entry.findMany({
      where: { tmdbId: { in: tmdbIds } },
      select: { tmdbId: true, status: true, score: true },
    });

    const enrichedPeople = people.map(person => ({
      ...person,
      credits: person.credits.map((credit: any) => {
        const userEntry = userEntries.find(e => e.tmdbId === credit.id);
        return {
          ...credit,
          userStatus: userEntry?.status || null,
          userScore: userEntry?.score || null,
        };
      }),
    }));

    return Response.json(enrichedPeople);
  } catch (error) {
    console.error('Error fetching trending people:', error);
    return Response.json({ error: 'Failed' }, { status: 500 });
  }
}
```

---

### Exemplo 2: Componente de Collections com Drag & Drop (pessoal)

```tsx
'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

interface CollectionItem {
  id: string;
  order: number;
  entry: {
    title: string;
    imagePath: string | null;
  };
}

interface Collection {
  id: string;
  name: string;
  description: string | null;
  items: CollectionItem[];
}

export function CollectionEditor({ collectionId }: { collectionId: string }) {
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/collections/${collectionId}`)
      .then(r => r.json())
      .then(setCollection)
      .finally(() => setLoading(false));
  }, [collectionId]);

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination || source.index === destination.index) return;
    if (!collection) return;

    const newItems = Array.from(collection.items);
    const [moved] = newItems.splice(source.index, 1);
    newItems.splice(destination.index, 0, moved);
    setCollection({ ...collection, items: newItems.map((item, idx) => ({ ...item, order: idx })) });

    await fetch(`/api/collections/${collectionId}/reorder`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: draggableId, newOrder: destination.index }),
    });
  };

  if (loading) return <div>Carregando...</div>;
  if (!collection) return <div>Colecao nao encontrada</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      <h1>{collection.name}</h1>
      <p>{collection.description}</p>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="collection">
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: '16px',
                padding: '16px',
                background: snapshot.isDraggingOver ? 'rgba(61, 180, 242, 0.1)' : undefined,
                borderRadius: '8px',
              }}
            >
              {collection.items.map((item, index) => (
                <Draggable key={item.id} draggableId={item.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={{
                        ...provided.draggableProps.style,
                        borderRadius: '8px',
                        overflow: 'hidden',
                        opacity: snapshot.isDragging ? 0.5 : 1,
                        cursor: 'grab',
                      }}
                    >
                      <img
                        src={`https://image.tmdb.org/t/p/w300${item.entry.imagePath}`}
                        alt={item.entry.title}
                        style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover' }}
                      />
                      <div style={{
                        padding: '8px',
                        background: 'rgb(58, 55, 55)',
                        textAlign: 'center',
                        fontSize: '12px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {item.entry.title}
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
```

---

## Conclusao

O roadmap revisado mantem:

- 20 features detalhadas, apenas TMDB + organizacao pessoal + gamificacao individual.
- Organizacao por prioridade e dificuldade.
- Exemplos de implementacao em TypeScript/React.
- Schema Prisma util apenas para uso individual.
- Cronograma realista de 4-5 semanas.

**Proximos passos recomendados:**

1. Comecar pela Fase 1: Next Up, busca interna e Modo Decidir por Mim. Sao features muito conectadas ao uso diario do app.
2. Em seguida, evoluir para Watch Providers, Inbox de Episodios, Health Check, Similar/Recommendations e Trending People.
3. Depois investir em Stats Dashboard, Collections, Tags, Journal, Rewatch Planner, Relatorio Mensal e Metas.
4. Finalizar com Achievements, Challenges, Calendar, XP e temas desbloqueaveis, criando gamificacao consistente sem necessidade de interacao social.

O resultado sera um tracker pessoal poderoso, com descoberta de conteudo, organizacao, gamificacao e estatisticas, tudo focado na experiencia individual.

---

## Resumo das Remocoes

- Todas as secoes de features sociais foram excluidas.
- Achievements e desafios que dependiam de seguidores/comparacao com outros foram adaptados para uso individual.
- Mencoes a publico, compartilhavel, seguidores, grupos, foruns, comentarios, mensagens diretas, newsletter e leaderboard global foram eliminadas.
- A estrutura, endpoints TMDB uteis e exemplos tecnicos relevantes foram preservados ou adaptados.
