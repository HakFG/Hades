# 🔧 HADES - Correções e Melhorias Pendentes

> **📌 Instruções para IA / Desenvolvedor**  
> - Leia todo o contexto antes de começar.  
> - Siga os critérios de aceitação.  
> - Se algo não estiver claro, peça mais informações.  
> - Prefira soluções que não quebrem compatibilidade retroativa.  
> - Faça commits por tarefa, com mensagens descritivas.

---

## 🏷️ Prioridades
- **P1** – Crítico (impede funcionalidade principal)
- **P2** – Importante (melhoria significativa, mas sem blocker)
- **P3** – Melhoria (desejável, pode esperar)

---

## 🐛 BUGS E ERROS

### 1. Capas das Relations em português na página de título
- **Prioridade**: P2
- **Descrição**: As capas (posters) dos cards de `Relations` na página `/titles/[id]` estão exibindo imagens com texto em português, enquanto deveriam ser em inglês (idioma original).
- **Causa provável**: A URL da imagem é a mesma, mas o texto na imagem pode variar conforme o idioma configurado na chamada da API que buscou a coleção. O componente `RecCard` e `RelCard` usam `poster_path` vindo do TMDB sem forçar `language=en-US` na requisição que buscou os dados da coleção.
- **Solução esperada**:
  - Verificar na `OverviewTab` onde as `relations` são montadas – as imagens vêm dos metadados do TMDB. Garantir que a busca da coleção (ou da temporada) use `language=en-US` para obter os posters originais.
  - No `useEffect` principal, ao buscar `belongs_to_collection`, adicionar `language=en-US` na URL.
- **Arquivos envolvidos**:
  - `src/app/titles/[id]/page.tsx` (bloco `if (md.belongs_to_collection)`)
- **Critério de aceitação**:
  - Os posters das relações (prequel/sequel) devem estar no idioma original inglês.
  - Ao recarregar a página, as imagens não devem mudar para português.
- **Teste manual**:
  - Acessar página de um filme que pertença a uma coleção (ex: “Avatar”).
  - Verificar se o poster da relação (ex: “Avatar 2”) está em inglês.

### 2. Sinopses em inglês – devem estar em português
- **Prioridade**: P1
- **Descrição**: As sinopses (`overview`) na página de título estão sendo exibidas em inglês, mas devem permanecer em português (`pt-BR`).
- **Causa provável**: Você está substituindo o título pelo inglês, mas também está sobrescrevendo a sinopse. A chamada principal `tRes` usa `language=pt-BR`, mas a chamada extra `tResEn` pode estar substituindo o campo `overview` indevidamente. Além disso, a variável `overview` é definida a partir de `seasonDetail?.overview||show?.overview` – se o `show` foi sobrescrito com dados em inglês, a sinopse vira inglês.
- **Solução esperada**:
  - Não substituir `overview` pelo inglês. Manter a `overview` exclusivamente da chamada `pt-BR`.
  - No bloco de filmes, remover qualquer atribuição que sobreponha `md.overview`. Apenas sobrescrever `title` e `original_title`.
  - Nas séries, fazer o mesmo: `sd.name` deve ser o inglês, mas `sd.overview` deve permanecer o português.
- **Arquivos envolvidos**:
  - `src/app/titles/[id]/page.tsx` (fetch de dados e definição de `show`/`movie`)
- **Critério de aceitação**:
  - Sinopse exibida em português, título em inglês.
- **Teste manual**:
  - Acessar página de qualquer filme/série → título em inglês, sinopse em PT-BR.

### 3. Trailers – priorizar versão legendada em português
- **Prioridade**: P2
- **Descrição**: A lista de vídeos (trailers) deve dar prioridade aos vídeos com legenda em português. Se não existir, mostrar os normais.
- **Causa provável**: O filtro atual seleciona vídeos do YouTube sem considerar o idioma das legendas.
- **Solução esperada**:
  - Ordenar os vídeos por: primeiro os que têm `name` contendo "legendado" ou "português" (case-insensitive), depois os demais.
  - Manter a lógica de prioridade `official` (trailers oficiais primeiro).
- **Arquivos envolvidos**:
  - `src/app/titles/[id]/page.tsx` (filtro `uniqueVideos`)
- **Critério de aceitação**:
  - Se houver um trailer com "Legendado" no nome, ele aparece primeiro na lista.
- **Teste manual**:
  - Acessar página de um filme que tenha múltiplos trailers (ex: “Duna”).
  - Verificar se os legendados aparecem antes.

### 4. Relações – Ao adicionar, apaga outras relações e persiste errado
- **Prioridade**: P1
- **Descrição**: Ao adicionar uma relação manualmente, a relação vai para o perfil e apaga todas as relações automáticas que existiam. Além disso, após F5 a relação some visualmente (não persiste). A tabela `Relation` já existe, mas o fluxo de adição/remoção não está correto.
- **Causa provável**: 
  - A função `addRelation` está substituindo a lista inteira de `relations` ao invés de apenas adicionar a nova.
  - A função `fetchRelations` (ou o recarregamento) está sobrescrevendo o estado com apenas as relações do banco, removendo as automáticas que não estão salvas.
  - A lógica de “gerar automáticas” está sendo executada mesmo quando existem relações salvas, ou está usando o fallback incorreto.
- **Solução esperada**:
  - `addRelation` deve apenas adicionar a nova relação (sem remover as existentes).
  - O carregamento inicial (`useEffect`) deve mesclar: relações salvas no banco + relações automáticas (TMDB) que **não estejam em conflito**.
  - Ao salvar uma relação manual, ela deve ser persistida no banco e **nunca** ser removida por atualizações automáticas.
  - O botão de remover deve chamar a API e atualizar o estado local adequadamente.
- **Arquivos envolvidos**:
  - `src/app/titles/[id]/page.tsx` (funções `addRelation`, `removeRelation`, `fetchRelations`, `useEffect`)
  - `src/app/api/relations/route.ts` (POST, DELETE, GET)
- **Critério de aceitação**:
  - Relações automáticas (TMDB) e manuais convivem lado a lado.
  - Adicionar uma relação não apaga as outras.
  - Após F5, as relações automáticas voltam (se não foram removidas) e as manuais persistem.
- **Teste manual**:
  - Acessar página de um título com relações automáticas (ex: “O Poderoso Chefão”).
  - Adicionar uma relação manual. As automáticas devem continuar visíveis.
  - Recarregar a página → todas as relações ainda estão lá.
  - Remover a relação manual → apenas ela some, as automáticas permanecem.

### 5. Search – “Airing Now” mostra títulos finalizados
- **Prioridade**: P2
- **Descrição**: Na seção "Popular Now" (TV), séries que já foram finalizadas continuam aparecendo, mesmo não estando mais no ar.
- **Causa provável**: O endpoint `/tv/on_the_air` retorna séries com base na programação futura, mas séries recentemente finalizadas ainda podem constar. Além disso, a função `expandLatest` pega a última temporada, mesmo que a série já tenha acabado.
- **Solução esperada**:
  - Adicionar filtro adicional: só incluir séries onde `in_production === true` **ou** a última temporada tenha `air_date` no futuro (ou nos últimos 30 dias).
  - Outra abordagem: buscar `/tv/on_the_air` e, para cada série, verificar se a última temporada tem algum episódio com `air_date` >= data atual.
- **Arquivos envolvidos**:
  - `src/app/search/page.tsx` (função `expandLatest` ou nova lógica em `loadInitialSections`)
- **Critério de aceitação**:
  - Séries encerradas (ex: “Breaking Bad”) não aparecem em "Popular Now".
  - Apenas séries com episódios futuros ou em produção aparecem.
- **Teste manual**:
  - Mudar para aba TV Shows, abrir a seção "Popular Now".
  - Confirmar que séries finalizadas não estão na lista.

### 6. Search – Títulos e capas de filmes ainda em português
- **Prioridade**: P1
- **Descrição**: Os nomes dos filmes e as capas (posters) na página de busca estão em português, assim como os resultados de filmes.
- **Causa provável**: A chamada de busca (`/search/movie`) e de descoberta (`/discover/movie`) usam `language=pt-BR`. As imagens são as mesmas, mas o título (texto) está em português.
- **Solução esperada**:
  - Altere o parâmetro `language` para `en-US` em todas as requisições de filmes (search e discover).
  - As capas (poster_path) continuarão as mesmas, mas o título associado a cada card virá em inglês.
- **Arquivos envolvidos**:
  - `src/app/search/page.tsx` (funções `performSearch`, `handleTextSearch`, `movieToCard`)
- **Critério de aceitação**:
  - Títulos de filmes em inglês, sinopse em português (se exibida em algum lugar).
- **Teste manual**:
  - Buscar por um filme conhecido (ex: “The Matrix”) → título em inglês, capa normal.

### 7. ListEditor.tsx não sincronizado com o perfil
- **Prioridade**: P2
- **Descrição**: O componente `ListEditor.tsx` (usado na busca e em outros lugares) não possui as mesmas funcionalidades do editor dentro do perfil (que usa `ListEditor` do próprio profile). Assim, eles estão fora de sincronia.
- **Causa provável**: Existem duas implementações diferentes: uma em `components/ListEditor.tsx` e outra dentro de `profile/page.tsx`. Elas não compartilham lógica.
- **Solução esperada**:
  - Refatorar para que ambos usem o mesmo componente centralizado (ex: unificar em `components/ListEditor.tsx` e remover o duplicado).
  - Garantir que o `ListEditor` unificado aceite todas as props e funcionalidades (status, score decimal, progresso, datas, rewatch, notes, hidden, deletar).
- **Arquivos envolvidos**:
  - `src/components/ListEditor.tsx`
  - `src/app/profile/page.tsx` (função `ListEditor` local)
- **Critério de aceitação**:
  - Ao editar um título pela busca, as mesmas opções do perfil estão disponíveis.
  - As alterações salvam e refletem no perfil e vice-versa.
- **Teste manual**:
  - Na busca, adicionar/editar um título e salvar.
  - Verificar no perfil se as alterações apareceram.

---

## 🚀 NOVAS FEATURES

### 1. Melhorias visuais no layout global (navbar, fontes, animações)
- **Prioridade**: P3
- **Descrição**: Aprimorar o estilo global, especialmente o `NavLink` com o título “Hades”. Uma fonte mais grega, ícones flutuantes animados e transições suaves.
- **Solução esperada**:
  - Substituir a fonte do logo por uma como “Cinzel”, “Trajan Pro” ou “League Spartan”.
  - Adicionar ícones (ex: SVG animados) como chamas, escudo, capacete.
  - Criar animações de hover nos links (subida suave, brilho).
- **Arquivos envolvidos**:
  - `src/app/layout.tsx` (componente NavLink)
  - `src/app/globals.css` (ou CSS global)
- **Critério de aceitação**:
  - Logo “HADES” com fonte grega elegante.
  - Ícones animados ao lado do nome.
  - Links do menu têm transição suave.
- **Teste manual**:
  - Navegar pelo site, observar a navbar.

### 2. Recent Activity – agrupar múltiplos episódios em uma única entrada
- **Prioridade**: P2
- **Descrição**: Quando o usuário atualizar vários episódios de uma vez (ex: do 4 ao 7), o log deve mostrar “Assistiu episódios 4–7 de Daredevil: Born Again” em vez de 4 entradas separadas.
- **Solução esperada**:
  - No momento de `pushActivity`, verificar a última atividade da mesma `entryId`.
  - Se for do mesmo tipo (progress) e o novo progresso for consecutivo, em vez de criar uma nova entrada, atualizar a última com o intervalo.
  - Exemplo: armazenar `progressStart` e `progressEnd` na `ActivityLog`.
- **Arquivos envolvidos**:
  - `src/app/profile/page.tsx` (função `pushActivity`, interface `ActivityLog`)
- **Critério de aceitação**:
  - Ao avançar múltiplos episódios (ex: de 3 para 5), aparece apenas um log: “Episódios 3–5 de Título”.
  - Cada episódio individual continua gerando log separado se não forem consecutivos.
- **Teste manual**:
  - No perfil, selecionar uma série e clicar + várias vezes rapidamente.
  - Verificar se o log agrupa os incrementos consecutivos.

### 3. Recent Activity – descrições inteligentes por ação
- **Prioridade**: P2
- **Descrição**: As mensagens do log devem ser mais humanas e variadas conforme a ação:  
  - “Assistiu o episódio X de Y” (para séries)  
  - “Completou o filme X” (ao marcar 100% ou status COMPLETED)  
  - “Começou a assistir X” (primeiro episódio ou status WATCHING)  
  - “Reassistiu X” (rewatch)  
  - “Adicionou X à lista” (status PLANNING)
- **Solução esperada**:
  - No `pushActivity`, gerar uma string de texto (`activityText`) baseada no `status` e `progress`.
  - Armazenar essa string no `ActivityLog` ou calcular na hora da exibição.
- **Arquivos envolvidos**:
  - `src/app/profile/page.tsx` (interface `ActivityLog`, componente `ActivityItem`, função `pushActivity`)
- **Critério de aceitação**:
  - Cada ação tem uma descrição específica e adequada.
  - Filmes: “Completou Matrix” / “Começou a assistir Matrix”.
  - Séries: “Assistiu episódio 3 de Stranger Things S4”.
- **Teste manual**:
  - Realizar várias ações diferentes (adicionar, assistir, completar, rewatch) e verificar as mensagens.

### 4. Perfil – filtro de ano com slider único (faixa contínua)
- **Prioridade**: P2
- **Descrição**: Substituir os dois sliders (min/max) por um único slider que define um ano específico. O usuário move a bolinha para um ano e a lista filtra apenas os títulos cujo `releaseYear` **seja igual** àquele ano.
- **Solução esperada**:
  - Em `MediaListTab`, unificar `yearMin` e `yearMax` em um único estado `selectedYear`.
  - O slider terá valor de `TMDB_MIN_YEAR` a `TMDB_MAX_YEAR`.
  - Na filtragem, alterar para `releaseYear(e) === selectedYear`.
- **Arquivos envolvidos**:
  - `src/app/profile/page.tsx` (componente `MediaListTab`)
- **Critério de aceitação**:
  - Um único controle deslizante, mostrando o ano selecionado.
  - A lista exibe apenas títulos lançados exatamente naquele ano.
- **Teste manual**:
  - No perfil, aba “Series List” ou “Film List”, mover o slider do ano.
  - Verificar que apenas títulos daquele ano aparecem.

### 5. Perfil – borda do avatar some ao usar imagem PNG
- **Prioridade**: P3
- **Descrição**: Quando o usuário faz upload de uma imagem de avatar (especialmente PNG com transparência), o fundo quadrado (background color) não deve aparecer – a imagem deve preencher completamente o círculo/quadrado.
- **Solução esperada**:
  - No componente `ProfileEditor`, se `avatarUrl` for uma imagem (não um `avatarColor`), aplicar `background: transparent` e remover o fallback color.
  - Garantir que a div que exibe o avatar tenha `backgroundColor` somente quando não há imagem.
- **Arquivos envolvidos**:
  - `src/app/profile/page.tsx` (componente `ProfileEditor` e na exibição do perfil)
- **Critério de aceitação**:
  - Avatar com imagem PNG transparente → sem borda colorida.
  - Quando não há imagem, usa a cor de fallback.
- **Teste manual**:
  - Fazer upload de uma imagem PNG com transparência.
  - Verificar que o avatar aparece sem nenhum fundo colorido ao redor.

---

## 📌 Nota para o desenvolvedor/IA

- **Antes de iniciar uma tarefa**, verifique se há dependências.  
- **Commits recomendados**: uma tarefa por commit, com mensagem clara.  
- **Se encontrar ambiguidade**, peça esclarecimentos no próprio TODO.md ou abra uma issue.  
- Para as tarefas P1, priorize a entrega com qualidade; para P3, pode fazer em lote.