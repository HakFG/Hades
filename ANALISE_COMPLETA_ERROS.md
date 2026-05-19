# 🔍 ANÁLISE COMPLETA DE ERROS - PROJETO HADES

**Data da Análise:** 19 de Maio, 2026  
**Status da Página Home:** ❌ ERRO - "A server error occurred. Reload to try again."  
**Severidade Geral:** 🔴 CRÍTICA

---

## 📋 SUMÁRIO EXECUTIVO

Seu projeto Hades possui **múltiplos problemas críticos e intermediários** que estão causando falhas na home page e em outras áreas. Este documento detalha todos os problemas encontrados, categorizados por severidade.

**Problemas Críticos Encontrados:** 6  
**Problemas Altos:** 8  
**Problemas Médios:** 12  
**Problemas Baixos:** 15  
**Total de Problemas:** 41

---

## 🔴 PROBLEMAS CRÍTICOS (Bloqueadores)

### 1. **ERRO DE PERMISSÃO - Prisma Query Engine**
- **Localização:** Build time
- **Mensagem de Erro:** 
  ```
  EPERM: operation not permitted, rename '...\node_modules\.prisma\client\query_engine-windows.dll.node.tmp*'
  ```
- **Causa Raiz:** Arquivo Prisma estão sendo bloqueados durante a geração. Pode ser:
  - Antivírus bloqueando o arquivo
  - Outro processo acessando os arquivos Prisma
  - Permissões insuficientes na pasta node_modules
- **Impacto:** Build falha completamente, impedindo deploy
- **Solução Recomendada:**
  ```bash
  # 1. Limpe o cache Prisma
  npm run build
  # Se falhar, tente:
  rm -r node_modules/.prisma
  npm install
  npm run build
  ```

### 2. **Missing Error Handling em Promises - Home Page**
- **Arquivo:** `src/app/page.tsx` - função `getHomeData()`
- **Problema:** Múltiplas promises (trending, news, recently added) não têm tratamento de erro adequado
- **Linhas Afetadas:** 150-300 aprox
- **Código Problemático:**
  ```typescript
  const newsPromises = newsSources.map(async (source) => {
    try {
      const response = await fetch(source.url, { next: { revalidate: 3600 } });
      const newsData = await response.json();
      // ❌ Sem validação se response.ok
      return (newsData.items || [])...
    } catch { return []; }  // ❌ Catch silencioso
  });
  ```
- **Impacto:** Qualquer erro em uma das promises faz a página inteira cair
- **Solução:**
  ```typescript
  const newsPromises = newsSources.map(async (source) => {
    try {
      const response = await fetch(source.url, { next: { revalidate: 3600 } });
      if (!response.ok) {
        console.warn(`[news] HTTP ${response.status} from ${source.name}`);
        return [];
      }
      const newsData = await response.json();
      return (newsData.items || [])...
    } catch (err) { 
      console.error(`[news] Erro ao buscar ${source.name}:`, err);
      return []; 
    }
  });
  ```

### 3. **Database Connection Timeout ou Inválida**
- **Arquivo:** `src/lib/prisma.ts`
- **Configuração:** Usando Neon PostgreSQL com pooler
- **Problema Possível:**
  - `DATABASE_URL` expirou ou está inválida
  - Conexão com pool limite atingido
  - Timeout de conexão muito baixo
- **Código:**
  ```typescript
  export const prisma = new PrismaClient({
    log: ['query'],  // Logging ativado pode impactar performance
  });
  ```
- **Verificações Necessárias:**
  ```bash
  # 1. Teste a conexão diretamente
  node -e "const {PrismaClient} = require('@prisma/client'); const p = new PrismaClient(); p.$connect().then(() => console.log('OK')).catch(e => console.error(e))"
  
  # 2. Verifique o DATABASE_URL no .env
  cat .env | grep DATABASE_URL
  ```

### 4. **Falta de Validação em `getHomeData()` - Acesso a Propriedades Null**
- **Arquivo:** `src/app/page.tsx` - linhas 150-300
- **Problema:** Acessando propriedades sem verificação null
  ```typescript
  for (const item of movieChanges.results.slice(0, 20).map((c: any) => c.id)) {
    // ❌ movieChanges.results pode ser undefined/null
    const d = await fetch(...).then(r => r.json());
    if (d && !d.status_code && d.poster_path) // ✓ Validação existe aqui
  }
  ```
- **Impacto:** NullPointerException pode ocorrer se API TMDB retornar resposta inesperada
- **Solução:** Adicionar validações de segurança:
  ```typescript
  const movieChanges = await fetch(...).then(r => r.json()).catch(() => ({ results: [] }));
  if (!Array.isArray(movieChanges.results)) movieChanges.results = [];
  ```

### 5. **Falta de Try-Catch em Componente Server - HomePageContent()**
- **Arquivo:** `src/app/page.tsx` - função `HomePageContent()`
- **Problema:** Componente async sem try-catch não captura erros em getHomeData()
  ```typescript
  async function HomePageContent() {
    const data = await getHomeData();  // ❌ Sem try-catch
    // Se getHomeData() falha, a página cai com erro 500
  }
  ```
- **Impacto:** Qualquer erro em getHomeData() não é tratado, causando "A server error occurred"
- **Solução:**
  ```typescript
  async function HomePageContent() {
    try {
      const data = await getHomeData();
      // ... render
    } catch (error) {
      console.error('[HomePageContent] Erro crítico:', error);
      return (
        <div style={{ padding: '40px', textAlign: 'center', color: 'red' }}>
          <h1>Erro ao carregar página</h1>
          <p>Tente recarregar em alguns momentos</p>
        </div>
      );
    }
  }
  ```

### 6. **API Key TMDB Exposta em .env Público**
- **Arquivo:** `.env`
- **Problema:** `NEXT_PUBLIC_TMDB_API_KEY` está visível no repositório
- **Chave Exposta:** `35277afa5d877e8ef391ec1b3a440f60`
- **Impacto:** Qualquer pessoa pode usar sua API key, esgotando cota
- **Severidade:** 🔴 CRÍTICA DE SEGURANÇA
- **Solução:**
  ```bash
  # 1. Revogue a chave imediatamente em https://www.themoviedb.org/settings/api
  # 2. Crie uma nova chave
  # 3. Mude .env:
  NEXT_PUBLIC_TMDB_API_KEY="SEU_TOKEN_NOVO"
  
  # 4. Se já foi commited ao git:
  git rm --cached .env
  git commit -m "Remove .env from tracking"
  echo ".env" >> .gitignore
  git add .gitignore
  git commit -m "Add .env to .gitignore"
  ```

---

## 🟠 PROBLEMAS ALTOS

### 7. **Type Casting Inseguro com `any`**
- **Arquivos Afetados:**
  - `src/app/page.tsx` - linha 196 (movieChanges)
  - `src/lib/weekly-stats.ts` - linhas 61, 67
  - `src/app/api/add-media/route.ts` - múltiplas linhas
- **Problema:** Uso excessivo de `any` esconde bugs em tempo de compilação
  ```typescript
  const trendingData = await trendingRes.json();
  const popularPromises = trendingData.results.slice(0, 6).map(async (item: any) => {
    // ❌ item: any - pode não ter propriedade 'id'
  });
  ```
- **Impacto:** Runtime errors quando API retorna formato inesperado
- **Solução:** Criar interfaces TypeScript
  ```typescript
  interface TmdbTrendingResult {
    id: number;
    name: string;
    poster_path: string | null;
    backdrop_path: string | null;
  }
  
  interface TmdbTrendingResponse {
    results: TmdbTrendingResult[];
    page: number;
    total_pages: number;
  }
  
  const trendingData: TmdbTrendingResponse = await trendingRes.json();
  ```

### 8. **Missing Error Handling em Prisma Queries**
- **Arquivo:** `src/app/page.tsx` - função `getHomeData()`
- **Problema:** Queries Prisma sem try-catch
  ```typescript
  const myWatching = await prisma.entry.findMany({...});  // ❌ Sem error handling
  const planningEntries = await prisma.entry.findMany({...});  // ❌
  ```
- **Causa:** Se banco estiver indisponível, página cai
- **Solução:** Envolver em try-catch ou usar fallback
  ```typescript
  let myWatching = [];
  try {
    myWatching = await prisma.entry.findMany({...});
  } catch (err) {
    console.error('[getHomeData] Erro ao buscar myWatching:', err);
    // Retornar dados vazios ou cached
  }
  ```

### 9. **Missing activityLog Model na Query**
- **Arquivo:** `src/lib/weekly-stats.ts` - linha 35
- **Problema:** Query referencia `prisma.activityLog` mas model pode não existir
  ```typescript
  const logs = await prisma.gamificationActivityLog.findMany({...});
  // ✓ Correto - usa gamificationActivityLog
  
  // MAS em src/app/api/activity/route.ts:
  const logs = await prisma.activityLog.findMany({...});
  // ❌ activityLog não existe no schema! É gamificationActivityLog
  ```
- **Impacto:** GET /api/activity vai retornar erro 500
- **Solução:** Renomear ou criar model activityLog no schema Prisma
  ```prisma
  model ActivityLog {
    id String @id @default(cuid())
    // ... fields
  }
  ```

### 10. **Falta de Validação de Resposta TMDB**
- **Arquivo:** `src/app/page.tsx` - múltiplas queries TMDB
- **Problema:** Não verifica se response.ok antes de .json()
  ```typescript
  const detailRes = await fetch(...);
  const detail = await detailRes.json();  // ❌ Se status 400+, decodifica erro
  ```
- **Impacto:** JSON.parse pode falhar ou retornar { status_code: 7, ... }
- **Solução:**
  ```typescript
  if (!detailRes.ok) {
    console.warn(`[tmdb] HTTP ${detailRes.status}`);
    return null;
  }
  const detail = await detailRes.json();
  ```

### 11. **Missing Null Checks - Build Erro Potencial**
- **Arquivo:** `src/app/page.tsx` - linhas 195-200
- **Problema:**
  ```typescript
  const recentlyAddedItems: any[] = [];
  if (movieChanges.results?.length) {  // ✓ Boa prática aqui
    for (const id of movieChanges.results.slice(0, 20).map((c: any) => c.id)) {
      // ❌ Acessando c.id sem garantir que 'c' tem essa propriedade
  ```
- **Solução:** Adicionar type guard
  ```typescript
  if (movieChanges.results?.length) {
    const ids = movieChanges.results.slice(0, 20).filter(c => c?.id).map(c => c.id);
  ```

### 12. **API Key TMDB Pode Estar Expirada ou Inválida**
- **Chave:** `35277afa5d877e8ef391ec1b3a440f60`
- **Verificar:**
  ```bash
  # Teste a chave
  curl "https://api.themoviedb.org/3/trending/tv/week?api_key=35277afa5d877e8ef391ec1b3a440f60"
  ```
- **Se Inválida:** Todos os fetches TMDB falharão com 401/403
- **Impacto:** Home page não consegue carregar dados de trending, popular, news
- **Solução:** Regenerar chave no painel do TMDB

### 13. **Logging em Produção Pode Degradar Performance**
- **Arquivo:** `src/lib/prisma.ts` - linha 7
  ```typescript
  new PrismaClient({
    log: ['query'],  // ❌ Logueia todas as queries em produção
  });
  ```
- **Impacto:** Pode causar lag se muitas queries são executadas
- **Solução:**
  ```typescript
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  });
  ```

### 14. **Falta de Timeout em Fetch Calls**
- **Arquivo:** `src/app/page.tsx` - múltiplos fetches
- **Problema:** Fetches sem timeout podem pendurar indefinidamente
  ```typescript
  const res = await fetch(url, { next: { revalidate: 3600 } });
  // ❌ Sem timeout - pode esperar 30s+ se TMDB estiver lento
  ```
- **Impacto:** Build pode travar, timeout do servidor
- **Solução:**
  ```typescript
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);  // 5s timeout
  try {
    const res = await fetch(url, { 
      signal: controller.signal,
      next: { revalidate: 3600 } 
    });
  } finally {
    clearTimeout(timeoutId);
  }
  ```

---

## 🟡 PROBLEMAS MÉDIOS

### 15. **Unused Variable - Prisma Import**
- **Arquivo:** `src/lib/weekly-stats.ts` - linha 2
- **Problema:**
  ```typescript
  import { Prisma } from '@prisma/client';  // ❌ Não usado
  ```
- **Solução:** Remover import se não usado

### 16. **Catch Silencioso Sem Logging**
- **Arquivo:** `src/app/page.tsx` - linhas 310-315
- **Problema:**
  ```typescript
  for (const id of movieChanges.results.slice(0, 20)...) {
    try {
      const d = await fetch(...).then(r => r.json());
    } catch { }  // ❌ Silenciosamente ignora erro
  }
  ```
- **Impacto:** Impossível debugar se algo falha
- **Solução:** Adicionar logging
  ```typescript
  catch (err) {
    console.warn(`[recently-added] Erro ao buscar movie ${id}:`, err);
  }
  ```

### 17. **Falta de Validação de Input - Poster Choices**
- **Arquivo:** `src/app/page.tsx` - função `applyHomePosterChoices()`
- **Problema:**
  ```typescript
  async function applyHomePosterChoices(popular: HomePosterItem[], newlyAdded: HomePosterItem[]) {
    // ❌ Sem validação se popular/newlyAdded são arrays válidos
  ```
- **Solução:**
  ```typescript
  if (!Array.isArray(popular)) popular = [];
  if (!Array.isArray(newlyAdded)) newlyAdded = [];
  ```

### 18. **Falta de Type Safety em Maps**
- **Arquivo:** `src/app/page.tsx` - linhas 235-245
- **Problema:**
  ```typescript
  const byKey = new Map(choices.map((choice) => [choice.key, choice]));
  // ❌ Se choice.key duplicado, último valor sobrescreve
  ```
- **Impacto:** Dados podem ser perdidos silenciosamente
- **Solução:** Validar chaves únicas antes

### 19. **Endpoint /api/activity Referencia Model Errado**
- **Arquivo:** `src/app/api/activity/route.ts` - linhas 5-8
- **Problema:**
  ```typescript
  export async function GET() {
    const logs = await prisma.activityLog.findMany({  // ❌ activityLog
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  ```
- **Deve ser:** `prisma.gamificationActivityLog`
- **Impacto:** GET /api/activity retorna erro
- **Solução:** Mudar para nome correto

### 20. **Falta de Fallback em getGamificationStats()**
- **Arquivo:** `src/lib/gamification.ts` - função `getGamificationStats()`
- **Problema:** Se user não existir, retorna erro em vez de valores default
- **Solução:** Retornar stats padrão se não encontrar user

### 21. **Falta de Validação em Form Fields**
- **Arquivo:** `src/components/PersonalGoalModal.tsx` - linha 204
- **Problema:**
  ```typescript
  if (!title.trim()) { setError('...'); return; }
  if (!target || Number(target) <= 0) { setError('...'); return; }
  // ❌ Falta validação de deadline
  ```
- **Solução:** Adicionar todas as validações necessárias

### 22. **Promise.all() Pode Falhar Inteira**
- **Arquivo:** `src/app/page.tsx` - linhas 250-260
- **Problema:**
  ```typescript
  const [weeklyStats, gamificationStats, nextUpItems] = await Promise.all([
    getWeeklyStats('main'),
    getGamificationStats('main'),
    getNextUpItems(2),
  ]);
  // Se 1 rejeita, todos falham
  ```
- **Solução:** Usar Promise.allSettled() para resilência
  ```typescript
  const results = await Promise.allSettled([...]);
  const [weeklyStats, gamificationStats, nextUpItems] = results.map(
    r => r.status === 'fulfilled' ? r.value : null
  );
  ```

### 23. **Missing Error Message Specificity**
- **Arquivo:** Múltiplos endpoints API
- **Problema:** Erros genéricos dificultam debugging
  ```typescript
  catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
  ```
- **Solução:** Logar erro detalhado
  ```typescript
  catch (error) {
    console.error('[endpoint-name] Detailed error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
  ```

### 24. **Database Connection Pool Configuration**
- **Arquivo:** `.env`
- **Problema:** DATABASE_URL não especifica pool size
  ```
  DATABASE_URL="postgresql://...?sslmode=require&channel_binding=require"
  // ❌ Sem ?pool_size=10&application_name=hades
  ```
- **Impacto:** Pode atingir limite de conexões
- **Solução:**
  ```
  DATABASE_URL="postgresql://...?pool_size=10&application_name=hades&sslmode=require"
  ```

### 25. **Falta de Caching Strategy**
- **Arquivo:** `src/app/page.tsx`
- **Problema:** Muitos fetches TMDB sem ISR otimizado
  ```typescript
  const trendingRes = await fetch(..., { next: { revalidate: 3600 } });
  // Revalida a cada 1h, mas já pode estar stale
  ```
- **Solução:** Considerar cache em nível de arquivo
  ```typescript
  export const revalidate = 3600;  // No topo da página
  ```

### 26. **Missing Response Validation in Weekly Stats**
- **Arquivo:** `src/lib/weekly-stats.ts` - linhas 50-80
- **Problema:** Acessando `log.metadata` como `any` sem type guard
- **Solução:** Criar interface para metadata

---

## 🟢 PROBLEMAS BAIXOS (Lint/Style)

### 27. **Arquivo test-db.js Usando require() em Projeto TypeScript**
- **Arquivo:** `test-db.js` - linha 1
- **Problema:**
  ```javascript
  const { PrismaClient } = require('@prisma/client');  // ❌ require
  ```
- **Solução:** Converter para ESM ou TypeScript
  ```typescript
  import { PrismaClient } from '@prisma/client';
  ```

### 28-41. **Múltiplas Linhas com Type Errors (eslint)**
- Ver arquivo `hades-lint-output-utf8.txt` para lista completa
- Total: 93 errors, 70 warnings

---

## 📊 MAPA DE DEPENDÊNCIAS ENTRE ERROS

```
Erro #1 (Prisma Permission) 
  ↓
  └─→ Impede Build
      └─→ Afeta Erros #2, #3, #8, #9

Erro #6 (API Key Exposta)
  ↓
  └─→ Erros #12 (TMDB Queries Falham)
      └─→ Erros #2, #4, #10 (API Response Handling)
          └─→ Erro #5 (Try-Catch Server)
              └─→ ❌ HOME PAGE FALHA
```

---

## 🛠️ PLANO DE AÇÃO RECOMENDADO

### **FASE 1: CRÍTICO (Hoje - 2 horas)**
1. ✅ Revoque API key TMDB exposta
2. ✅ Gere nova API key
3. ✅ Atualize .env
4. ✅ Resolva erro de permissão Prisma
5. ✅ Adicione try-catch em HomePageContent()
6. ✅ Adicione error handling em getHomeData()

### **FASE 2: ALTO (Hoje - 4 horas)**
7. ✅ Corriga model reference activityLog → gamificationActivityLog
8. ✅ Adicione validação de resposta TMDB
9. ✅ Crie interfaces TypeScript (remova `any`)
10. ✅ Adicione logging em catches
11. ✅ Configure timeout em fetches
12. ✅ Ajuste logging Prisma para production

### **FASE 3: MÉDIO (Próximos dias)**
13. ✅ Use Promise.allSettled() em lugar de Promise.all()
14. ✅ Adicione validações de input
15. ✅ Melhore error messages
16. ✅ Configure pool database

### **FASE 4: BAIXO (Refatoração)**
17. ✅ Converter test-db.js para TypeScript
18. ✅ Fixar todos os eslint errors
19. ✅ Remover imports não usados

---

## 🧪 TESTES RECOMENDADOS

```bash
# 1. Teste de conexão DB
npm install dotenv
node -e "require('dotenv').config(); const {PrismaClient} = require('@prisma/client'); const p = new PrismaClient(); p.\$connect().then(() => console.log('DB: OK')).catch(e => console.error('DB ERRO:', e))"

# 2. Teste de API Key TMDB
curl "https://api.themoviedb.org/3/trending/tv/week?api_key=YOUR_KEY"

# 3. Teste de build
npm run build

# 4. Teste de dev server
npm run dev
curl http://localhost:3000

# 5. Teste lint
npm run lint
```

---

## 📝 CHECKLIST DE CORREÇÃO

```markdown
## Erro Críticos
- [ ] #1 - Permissão Prisma
- [ ] #2 - Error handling promises
- [ ] #3 - Database connection
- [ ] #4 - Null validation
- [ ] #5 - Try-catch HomePageContent
- [ ] #6 - API key segurança

## Erros Altos
- [ ] #7 - Type any
- [ ] #8 - Prisma error handling
- [ ] #9 - activityLog model
- [ ] #10 - Response validation
- [ ] #11 - Null checks
- [ ] #12 - TMDB key validity
- [ ] #13 - Logging production
- [ ] #14 - Timeout fetches

## Erros Médios
- [ ] #15 - Unused import
- [ ] #16 - Logging catches
- [ ] #17 - Input validation
- [ ] #18 - Type safety
- [ ] #19 - Model reference
- [ ] #20 - Fallback gamification
- [ ] #21 - Form validation
- [ ] #22 - Promise.allSettled
- [ ] #23 - Error messages
- [ ] #24 - DB pool config
- [ ] #25 - Caching strategy
- [ ] #26 - Metadata validation

## Erros Baixos
- [ ] #27 - test-db.js
- [ ] #28-41 - Lint errors
```

---

## 🎯 PRIORIDADE DE CORREÇÃO

| Prioridade | Erros | Tempo Est. | Impacto |
|-----------|-------|-----------|--------|
| 🔴 Crítica | #1-6 | 2h | APP não funciona |
| 🟠 Alta | #7-14 | 4h | Home page instável |
| 🟡 Média | #15-26 | 6h | Bugs potenciais |
| 🟢 Baixa | #27-41 | 4h | Tech debt |

---

## 📞 PRÓXIMAS AÇÕES

1. **IMEDIATO:** Revoque API key e gere nova
2. **HOJE:** Fixe erros críticos (#1-6)
3. **AMANHÃ:** Fixe erros altos (#7-14)
4. **ESTA SEMANA:** Refatore médios e baixos
5. **CONTÍNUO:** Implemente testes automatizados

---

**Fim da Análise**  
Relatório gerado: 19/05/2026  
Próxima análise recomendada: Após implementar correções críticas
