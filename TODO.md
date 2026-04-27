# 🔧 HADES - Correções e Melhorias Pendentes

---

## 🐛 BUGS

### 1. Relations (titles) não persistem após F5
- **Problema**: Relations adicionadas/removidas manualmente voltam ao estado original do TMDB depois de recarregar a página.
- **Solução proposta**: Criar tabela `Relation` no banco de dados, associada a `Entry`, e usá-la para salvar relações customizadas. A UI deve priorizar os dados do banco e, se vazio, usar fallback automático (prequel/sequel via coleção ou temporadas).

### 3. Filtros da Search – inconsistências
- **Defeito C**: Na seção "Airing Now", temporadas antigas de séries que ainda estão no ar (ex: Euphoria S1, S2) aparecem junto com a temporada atual.
- **Solução proposta**: Buscar apenas a última temporada de cada série que esteja "em produção" ou com próximo episódio agendado.

---

## 🚀 MELHORIAS

### 1. Internacionalização parcial (inglês para títulos, capas e banners)
- **Objetivo**: Nomes de séries/filmes, capas (`poster_path`) e banners (`backdrop_path`) devem vir sempre em inglês (idioma original). Sinopses e descrições permanecem em português.
- **Solução proposta**: Nas chamadas ao TMDB, usar `language=pt-BR` apenas para `overview`; para `title`/`name` usar `language=en-US`. Imagens não dependem de idioma.
- **Pendente**: Ajustar as chamadas de capas no `page.tsx` da página de título (`titles/[id]`) para garantir que os posters e banners correspondam ao idioma original (embora as URLs sejam as mesmas, garantir que não haja sobreposição de textos em português).

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

- Prioridade sugerida: **Corrigir bug 1 primeiro** (afeta diretamente persistência de dados).  
- Em seguida, implementar as melhorias na ordem que preferir.