# 🔧 HADES - Correções e Melhorias Pendentes

---

## 🐛 BUGS

### 1. Relations (titles) não persistem após F5
- **Problema**: Relations adicionadas/removidas manualmente voltam ao estado original do TMDB depois de recarregar a página.
- **Solução proposta**: Criar tabela `Relation` no banco de dados, associada a `Entry`, e usá-la para salvar relações customizadas. A UI deve priorizar os dados do banco e, se vazio, usar fallback automático (prequel/sequel via coleção ou temporadas).

### 2. Notas (score) desaparecem no perfil após F5
- **Problema**: Ao inserir uma nota decimal (ex: 8.4) e recarregar a página, o valor volta a ser 0 ou inteiro.
- **Solução proposta**: Verificar se `PATCH /api/entries/[id]` está salvando `score` como `Float` (banco já atualizado). Garantir que `GET /api/entries` retorne o valor correto. No front-end, após salvar, atualizar o estado local com o valor retornado pela API.
- ✅ **CORRIGIDO**

### 3. Filtros da Search – inconsistências
- **Defeito A**: Buscar texto + ano (ex: "Invencível" + 2020) ainda retorna a série, quando deveria não retornar nada (filtro AND).
- **Defeito B**: Filtrar por ano traz todas as temporadas de uma série, não apenas a que lançou naquele ano.
- **Defeito C**: Na seção "Airing Now", temporadas antigas de séries que ainda estão no ar (ex: Euphoria S1, S2) aparecem junto com a temporada atual.
- **Solução proposta**: 
  - Cada temporada é um card independente; o filtro de ano deve agir sobre a `air_date` da temporada.
  - Na busca textual + ano, aplicar o filtro de ano APENAS à temporada, não à série pai.
  - Para "Airing Now", buscar apenas a última temporada de cada série que esteja "em produção" ou com próximo episódio agendado.

---

## 🚀 MELHORIAS

### 1. Internacionalização parcial (inglês para títulos, capas e banners)
- **Objetivo**: Nomes de séries/filmes, capas (`poster_path`) e banners (`backdrop_path`) devem vir sempre em inglês (idioma original). Sinopses e descrições permanecem em português.
- **Solução proposta**: Nas chamadas ao TMDB, usar `language=pt-BR` apenas para `overview`; para `title`/`name` usar `language=en-US`. Imagens não dependem de idioma.

### 2. Perfil – botões + / - para episódios
- **Objetivo**: Adicionar botões de incremento e decremento ao lado do contador de episódios nos cards de série (`EntryCard`), com tamanho proporcional à fonte do número.
- **Solução proposta**: Botões com `width: 24px`, `height: 24px`, animação sutil (scale/opacity). Ao clicar, atualizar o progresso via `PATCH /api/entries/[id]` e refletir no estado local.

### 3. Perfil – exibição do último episódio
- **Objetivo**: Quando `progresso == totalEpisodes`, exibir apenas o número total (ex: `12`), sem a barra (`12/12`).
- **Solução proposta**: Modificar a condição de exibição no componente `EntryCard`.

### 4. Search – ordenação inteligente por popularidade
- **Objetivo**: Ao aplicar filtros (gênero, formato, etc.), as temporadas de uma mesma série não devem ficar agrupadas; a ordenação deve ser global por um score de popularidade combinado (popularidade TMDB + votos + atualidade).
- **Solução proposta**: Calcular `rankingScore = popularity * 0.7 + (vote_count/1000) * 0.2 + (1/(yearsSinceRelease+1)) * 0.1`. Ordenar todos os cards de resultado por esse score decrescente. Aplicar mesma lógica nas seções "Trending", "Popular Now", "All Time Popular".

---

## 📌 Nota

- Prioridade sugerida: **Corrigir bugs 1 e 2 primeiro** (afetam diretamente persistência de dados).  
- Em seguida, implementar as melhorias na ordem que preferir.