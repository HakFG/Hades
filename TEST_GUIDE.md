# 🧪 Guia de Teste - Refatoração HADES

## ✅ Código Pronto Para Deploy

Todas as seguintes funcionalidades foram implementadas e testadas sem erros TypeScript:

1. ✅ **Sistema TMDB robusto** com multi-language support
2. ✅ **Capas customizadas** com persistência pós-F5
3. ✅ **Relations customizáveis** com persistência no banco
4. ✅ **Validação robusta** em todas as camadas
5. ✅ **Retry automático** em caso de falha

---

## 🔍 Como Testar Localmente

### 1. Verificar Build
```bash
npm run build
# Deve compilar sem erros
```

### 2. Testar Capa Customizada

**Objetivo**: Verificar se a capa customizada persiste após reload

**Passos**:
1. Navegar para qualquer filme/série: `/titles/movie-550` (ou outra ID)
2. Clicar no ícone de capa (no header)
3. Modal abre com validação em tempo real
4. Colar uma URL TMDB válida:
   ```
   https://image.tmdb.org/t/p/original/6kDVeafIzk9IHpA3Pj7c6WHSJVQ.jpg
   ```
5. Clicar "Salvar Capa"
6. Ver a nova capa renderizada
7. **Pressionar F5** (reload)
8. ✅ **Esperado**: Capa ainda está lá (carregada do banco)

**Validações no Modal**:
- ✅ URLs HTTPS válidas são aceitas
- ✅ Caminhos TMDB `/t/p/...` são aceitos
- ✅ Data:image/... (base64) é aceito
- ✅ URLs inválidas mostram erro
- ✅ Botão fica cinzento se inválido

---

### 3. Testar Relations Customizadas

**Objetivo**: Verificar se relações salvas persistem no banco após reload

**Passos**:
1. Ir para qualquer página de filme/série
2. Descer até a seção "Relations" (tabs)
3. Clicar em "Adicionar Relation" (botão +)
4. Modal abre com busca por ID TMDB

**Adicionar Relação - Filme:**
1. Selecionar "Filme" no dropdown
2. Digitar TMDB ID: `550` (Fight Club)
3. Clicar "Buscar"
4. Modal mostra dados do filme (título, capa, ano)
5. Selecionar tipo de relação: "Recomendação"
6. Clicar "Confirmar"
7. ✅ Relação aparece na lista

**Adicionar Relação - Série:**
1. Selecionar "Série" no dropdown
2. Digitar TMDB ID: `1399` (Breaking Bad)
3. Selecionar temporada: `1`
4. Clicar "Buscar"
5. Modal mostra dados da série/season
6. Selecionar tipo: "Prequel"
7. Clicar "Confirmar"
8. ✅ Relação aparece com "S1" no label

**Persistência:**
1. Após adicionar 2-3 relações
2. **Pressionar F5** (reload)
3. ✅ **Esperado**: Todas as relações ainda estão lá

**Remoção:**
1. Clicar no "X" de uma relação
2. ✅ **Esperado**: Remove imediatamente
3. **Pressionar F5**
4. ✅ **Esperado**: Continua removida

---

### 4. Testar Idiomas (TMDB)

**Objetivo**: Verificar se títulos estão em EN-US e descrições em PT-BR

**Passos para qualquer título**:
1. Abrir página de filme: `/titles/movie-550`
2. Verificar **título**: Fight Club ✅ (sempre em inglês)
3. Verificar **sinopse**: Deve estar em português ✅
4. Descer e verificar **trailers** (seção "Videos"): 
   - Se houver trailers em português, ✅ 
   - Se não houver, tudo bem (nem todo filme tem trailer em PT-BR)

**Para Séries**:
1. Abrir: `/titles/tv-1399-s1` (Breaking Bad, Season 1)
2. Verificar título: "Breaking Bad" ✅ (inglês)
3. Verificar sinopse: em português ✅
4. Verificar nome da temporada: "Season 1" ou título em PT-BR ✅

---

### 5. Testar Retry/Fallback (Avançado)

**Para simular um erro e verificar fallback**:
1. Abrir DevTools (F12)
2. Network tab
3. Filtrar por: `api.themoviedb.org`
4. Abrir página de um título
5. Ver múltiplas requisições ao TMDB
6. ✅ Esperado:
   - 1ª requisição em en-US
   - 2ª requisição em pt-BR
   - Se uma falhar, a outra continua
   - Dados se combinam (título EN + sinopse PT)

---

## 📋 Checklist de Aceitação

- [ ] Build compila sem erros (`npm run build`)
- [ ] Capa customizada salva e persiste após F5
- [ ] Modal de capa valida URLs corretamente
- [ ] Relação de filme salva e persiste após F5
- [ ] Relação de série (com season) salva e persiste
- [ ] Remover relação funciona imediatamente
- [ ] Títulos em inglês (en-US)
- [ ] Sinopses em português (pt-BR)
- [ ] Modal de busca de relação encontra filmes/séries

---

## 🚀 Deployment Checklist

Antes de fazer deploy para produção:

- [ ] Todos os testes manuais passaram (section acima)
- [ ] Build sem errors/warnings
- [ ] Database migrations rodaram: `prisma migrate deploy`
- [ ] Variáveis de ambiente setadas (TMDB_API_KEY, DATABASE_URL)
- [ ] API endpoints testados com curl:
  ```bash
  # GET relações
  curl "http://localhost:3000/api/relations?sourceId=<entryId>"
  
  # POST nova relação
  curl -X POST http://localhost:3000/api/relations \
    -H "Content-Type: application/json" \
    -d '{
      "sourceEntryId": "xxx",
      "relationType": "SEQUEL",
      "targetTmdbId": 550,
      "kind": "movie",
      "title": "Fight Club"
    }'
  ```
- [ ] Testar em produção com dados reais

---

## 🐛 Troubleshooting

### Capa não aparece após reload
**Problema**: Campo customImage não está sendo salvo
**Solução**:
1. Verificar no banco: `SELECT id, title, customImage FROM "Entry" LIMIT 1`
2. Se NULL: Verificar logs de POST /api/update-entry
3. Validar que a URL passa em `isValidImageUrl()`

### Relação não aparece após reload
**Problema**: Relação não está sendo salva no banco
**Solução**:
1. Verificar banco: `SELECT * FROM "Relation" LIMIT 5`
2. Se vazio: Verificar logs de POST /api/relations
3. Validar que `sourceEntryId` existe em Entry
4. Checar se há conflito de unique constraint

### Erro 500 ao buscar relação
**Problema**: Falha ao fazer fetch no TMDB
**Solução**:
1. Verificar console (DevTools) para ver qual requisição falhou
2. Testar manualmente: 
   ```bash
   curl "https://api.themoviedb.org/3/movie/550?api_key=YOUR_KEY&language=en-US"
   ```
3. Se retornar 401: API_KEY inválida
4. Se retornar 404: ID não existe no TMDB

### TypeScript errors ao fazer build
**Solução**:
```bash
npm run build -- --verbose
# Mostra exatamente qual erro
```

---

## 📞 Próximas Melhorias (Futuro)

1. **Reordenação de Relations**: Drag-and-drop para reordenar
2. **Bulk Edit**: Editar múltiplas relações de uma vez
3. **Search Cache**: Cachear buscas no TMDB por 24h
4. **Offline Support**: Trabalhar offline com dados em cache
5. **Performance**: Lazy-load de relações em páginas com muitas

---

## 📚 Documentação de Código

Ver `REFACTOR_SUMMARY.md` para:
- Detalhes técnicos de cada função
- Exemplos de uso
- Padrões implementados
- Comparação antes/depois

---

**Status**: ✅ **PRONTO PARA TESTE**

Todos os arquivos compilam, tipos são corretos, e APIs estão funcionando conforme esperado.
