# Funcionalidades da Parte de Staff

Este documento descreve todas as funcionalidades relacionadas à seção de "Staff" (pessoas) do projeto Hades, que permite buscar e visualizar informações sobre atores, diretores e equipe de produção de filmes e séries de TV, utilizando dados do The Movie Database (TMDB).

## Visão Geral

A seção de Staff é inspirada no estilo do AniList e permite aos usuários:
- Buscar pessoas por nome
- Visualizar perfis detalhados com biografia e metadados
- Explorar créditos em filmes e séries de TV
- Favoritar pessoas para acesso rápido

## Estrutura de Arquivos

### Páginas (src/app/staff/)

#### `page.tsx` - Página de Busca de Staff
- **Localização**: `src/app/staff/page.tsx`
- **Funcionalidade**: Página principal para buscar pessoas do TMDB.
- **Características**:
  - Campo de busca com debounce (320ms) para evitar requisições excessivas
  - Busca por nome (mínimo 2 caracteres)
  - Exibe resultados em grid responsivo
  - Cada resultado mostra foto do perfil, nome e departamento conhecido
  - Links para páginas individuais de cada pessoa
  - Indicador de carregamento durante busca
  - Mensagem quando não há resultados

#### `[id]/page.tsx` - Página de Detalhes do Staff
- **Localização**: `src/app/staff/[id]/page.tsx`
- **Funcionalidade**: Página dinâmica que exibe detalhes completos de uma pessoa específica.
- **Características**:
  - Carrega dados da pessoa e seus créditos via API
  - Exibe cabeçalho com foto e informações básicas
  - Mostra seções separadas para créditos em filmes e TV
  - Estados de carregamento e erro
  - Fallback quando não há créditos disponíveis

#### `staff.module.css` - Estilos da Seção Staff
- **Localização**: `src/app/staff/staff.module.css`
- **Funcionalidade**: Estilos CSS específicos para as páginas de staff.
- **Características**:
  - Layout escuro inspirado no AniList (#3a3737 background)
  - Grid responsivo para resultados de busca
  - Estilos para cartões de pessoa, cabeçalhos, seções de créditos
  - Animações para botões de favorito
  - Tipografia consistente com fonte Overpass

### Componentes (src/components/StaffComponents/)

#### `StaffHeader.tsx` - Cabeçalho do Perfil
- **Localização**: `src/components/StaffComponents/StaffHeader.tsx`
- **Funcionalidade**: Componente que renderiza o cabeçalho da página de detalhes de uma pessoa.
- **Características**:
  - Exibe foto do perfil (ou placeholder se não houver)
  - Nome principal e nome alternativo (se disponível)
  - Botão de favorito integrado
  - Lista de metadados: nascimento, idade, gênero, anos ativos, local de nascimento, departamento conhecido
  - Biografia com funcionalidade de "ler mais" (collapse após 520 caracteres)
  - Formatação de datas em formato americano

#### `StaffRolesSection.tsx` - Seção de Créditos
- **Localização**: `src/components/StaffComponents/StaffRolesSection.tsx`
- **Funcionalidade**: Componente que exibe uma seção de créditos (filmes ou TV) para uma pessoa.
- **Características**:
  - Título da seção ("Movie credits" ou "TV credits")
  - Grid de cartões de títulos
  - Cada cartão mostra poster, título, indicador de status (lançado/TBA), e papéis desempenhados
  - Links para páginas de títulos individuais
  - Não renderiza se não houver créditos

#### `StaffFavoriteButton.tsx` - Botão de Favorito
- **Localização**: `src/components/StaffComponents/StaffFavoriteButton.tsx`
- **Funcionalidade**: Componente interativo para favoritar/desfavoritar pessoas.
- **Características**:
  - Armazenamento em localStorage com chave 'hades_staff_favorites'
  - Estado visual diferente para favoritado/não favoritado
  - Animação de pulso ao clicar
  - Texto dinâmico ("Salvo" / "Favoritar")
  - Ícone de coração (❤)
  - Persistência entre sessões

### APIs (src/app/api/staff/)

#### `search/route.ts` - API de Busca
- **Localização**: `src/app/api/staff/search/route.ts`
- **Funcionalidade**: Endpoint GET para buscar pessoas no TMDB.
- **Características**:
  - Parâmetro de query `q` (obrigatório, mínimo 2 caracteres)
  - Busca em português brasileiro ('pt-BR')
  - Retorna array de resultados com id, nome, caminho do perfil, departamento e popularidade
  - Tratamento de erros com fallback para array vazio

#### `[id]/route.ts` - API de Detalhes
- **Localização**: `src/app/api/staff/[id]/route.ts`
- **Funcionalidade**: Endpoint GET para obter detalhes completos de uma pessoa.
- **Características**:
  - Validação do ID (deve ser número positivo)
  - Busca dados da pessoa em português, com fallback para inglês se biografia estiver vazia
  - Busca créditos combinados (filmes + TV)
  - Normaliza dados da pessoa e calcula anos ativos
  - Separa créditos em filmes e TV
  - Tratamento de erros 404 e 500

### Biblioteca (src/lib/staff.ts)

- **Localização**: `src/lib/staff.ts`
- **Funcionalidade**: Biblioteca central com tipos TypeScript, funções utilitárias e integração com TMDB.
- **Características principais**:

#### Tipos de Dados
- `StaffMediaKind`: 'movie' | 'tv'
- `TmdbPersonRaw`: Dados brutos da pessoa do TMDB
- `TmdbCombinedCreditItem`: Item de crédito combinado
- `StaffRoleCard`: Cartão de papel normalizado para UI
- `StaffPersonPayload`: Payload normalizado da pessoa

#### Funções Utilitárias
- `fetchTmdbJson()`: Busca dados do TMDB com cache (revalidate 3600s)
- `personProfileUrl()` / `posterUrl()`: Constrói URLs de imagens do TMDB
- `genderToLabel()`: Converte código de gênero para label
- `computeAge()`: Calcula idade baseada em datas de nascimento/morte
- `stripBioHtml()`: Remove HTML da biografia
- `isCreditReleased()`: Verifica se crédito foi lançado
- `buildTitleSlug()`: Constrói slug para títulos
- `normalizePerson()`: Normaliza dados brutos da pessoa
- `formatYearsActive()`: Formata período de atividade profissional
- `combinedToRoleCards()`: Converte créditos em cartões para UI

#### Configuração TMDB
- Base URL: `https://api.themoviedb.org/3`
- Chave API via `NEXT_PUBLIC_TMDB_API_KEY`
- URLs de imagem: `https://image.tmdb.org/t/p`

## Fluxo de Funcionalidades

### 1. Busca de Pessoas
1. Usuário acessa `/staff`
2. Digita nome no campo de busca (mínimo 2 caracteres)
3. Após debounce, requisição para `/api/staff/search`
4. API busca no TMDB e retorna resultados
5. Resultados exibidos em grid com links para `/staff/{id}`

### 2. Visualização de Perfil
1. Usuário clica em pessoa nos resultados
2. Página `/staff/[id]` carrega
3. Requisição para `/api/staff/[id]`
4. API busca pessoa e créditos do TMDB
5. Dados normalizados e exibidos:
   - Cabeçalho com foto e metadados
   - Biografia (com expandir/colapsar)
   - Botão de favorito
   - Seções de créditos para filmes e TV

### 3. Sistema de Favoritos
1. Botão de favorito no cabeçalho do perfil
2. Estado armazenado em localStorage
3. Visual feedback com animação
4. Persistente entre sessões do navegador

## Integração com TMDB

- **Fonte de dados**: The Movie Database (TMDB)
- **Idioma principal**: Português brasileiro ('pt-BR')
- **Fallback**: Inglês ('en-US') para biografias vazias
- **Cache**: 1 hora (3600 segundos) para reduzir chamadas à API
- **Imagens**: Servidas via CDN do TMDB com diferentes tamanhos

## Considerações Técnicas

- **Framework**: Next.js 13+ com App Router
- **Linguagem**: TypeScript
- **Estilização**: CSS Modules
- **Estado**: React hooks (useState, useEffect)
- **Armazenamento local**: localStorage para favoritos
- **Responsividade**: Grid CSS com minmax para cartões
- **Performance**: Debounce na busca, cache de API, lazy loading implícito

## Possíveis Extensões Futuras

- Sistema de avaliação/rating para pessoas
- Comparação entre pessoas
- Filtros avançados na busca (departamento, popularidade)
- Integração com sistema de notificações
- Cache local para dados offline
- Sincronização de favoritos com conta do usuário</content>
<parameter name="filePath">STAFF_FUNCTIONALITY.md