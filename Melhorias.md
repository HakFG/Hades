aqui está um .md com algumas melhorias e mudanças que tem que ocorrer no Hades, é um documento mais simples, apenas com mudanças e adições especificas que eu quero aplicar dentro do site para que ele fique melhor, lembre-se que a prioridade é não rachar nenhum sistema existente, pois o sistema do site em si já está extremamente robusto, a segunda coisa é tentar reutilizar arquivos que já existe, então se você quiser fazer códigos, procure um arquivo que se adeque, se não, crie um novo mesmo, lembrando que a partir desse momento você tem que ser o mais profissional mais possível, use 100% da sua capacidade.

Obs: Você tem acesso total ao meu projeto, pode mexer aonde for, não precisa nem me perguntar, pode executar tudo.

1. - Home `app/page.tsx`

- na área de Em Exibição e Em Andamento refatore completamente o visual dos cards e do título que aparece em baixo dos cards, deixe os cards com bordas arredondadas e diminua na metade do tamanho o tamanho do título.
- na área de Notícias de Filmes e Séries adicione novos links, só tem links do cinepop ali, vou mandar outros links:   - https://www.omelete.com.br/ - https://www.adorocinema.com/ - https://www.tecmundo.com.br/minha-serie - https://x.com/SeriesTWBZ - https://x.com/tuaseriebr 

2. - Search / Browse — `app/search/page.tsx`

- quando eu pesquiso algum filme, o sistema de bolinhas para mostrar o status do projeto não está imbutido, porém no de séries está perfeito, coloque o sistema de bolinhas na aba de filmes novamente por favor.
- quero que deixe o Academy Awards/Emmy Awards mais inteligente possível, mostre literalmente todos os filmes, séries e pessoas que concorreram a qualquer uma das premiações OSCAR e EMMY, literalmente quero todos os participantes aparecendo, desde 2026 até a primeira vez de ambos os eventos, também quero que em todos os anos mostre os ganhadores de cada categoria, e também mostre em que eles ganharam, todos os participantes tem que estar aparecendo ali
- adicione animações para sempre que eu passar o mouse por cima de qualquer título dessa aba de search/browser, quero uma animação bem profissional.

3. - Profile — `app/profile/page.tsx`

- na aba de stats em Release Year onde aparece os dados dos filmes que eu vi em cada ano que ele foi lançado, eu quero que você mude o sistema para ele pegar a data que eu finalizei qualquer firme, a data pessoal que eu adiciono quando coloco um filme, mude o nome para algo que faça sentido e refatore somente essa área
- retire totalmente a área de goals, pode apagar por completo, é um sistema que não funciona e está só ocupando espaço no projeto.

4. - Mudanças importantes e complexas no site (Ler o projeto completo)

- a coisa mais importante que esse site ainda não tem, é que as capas não estão completamente conectadas globalmente, por exemplo, quando eu pesquiso uma série no browser, a capa que tem ali é completamente diferente da que está no meu profile, e isso é o que não pode acontecer, tem que existir uma conexão global com TODAS as capas usadas no site, em qualquer lugar do projeto, se existe algum lugar onde tenha a capa, ela tem que ser a mesma que eu selecionei, lembre-se que o sistema de escolher capas em titles/[id]/page.tsx é o sistema absoluto, ali, se eu selecionar uma capa, ela se torna absoluta para o site completo.:

### Comportamento esperado:
- A capa definida (ou sobrescrita) em `title/[id]` é a **fonte de verdade global**
- Qualquer componente do site que exibir um card de título deve usar a capa dessa fonte
- Isso se aplica a: Relations, Browse, Newly Added, Trending, Search Results, Home cards etc.

- os pop ups de xp precisam estar em qualquer ação que estiver dito, por exemplo, quando eu clico em atualizar um episódio na área de Em Exibição e Em Andamento nenhum pop up aparece.
- deixar o sistema de notificações mais inteligente, ele haje de acordo com o meu profile, então por exemplo, se Widows Bay receber uma continuação no site themoviedatabase, ele vai me alertar, se Duna ganhar uma continuação, ele também vai me notificar, essa é a parte mais importante inclusive, vou deixar uma lista que eu fiz:

### Notificações inteligentes — o que deve ser notificado:

| Evento | Prioridade | Detalhe |
|---|---|---|
| Novo episódio de série na lista |  Sempre que um episódio novo for ao ar de uma série com `status: WATCHING` |
| Série/filme adicionado ao TMDB que é continuação de algo na lista |  Nova temporada anunciada, sequel, spin-off |
| Qualquer alteração em título da lista |  Mudança de status, novas informações, data de estreia atualizada |
| Novo título adicionado ao site (Newly Added) 

### Comportamento esperado:
- Notificações agrupadas por título (não uma por episódio)
- Painel de notificações com marcação de lida / não lida
- Possibilidade futura de configurar quais tipos receber

---