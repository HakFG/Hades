# 🔄 Sistema Completo de Export/Import - Guia Operacional

**Data de Implementação**: 29 de Abril de 2026  
**Status**: ✅ IMPLEMENTADO - 100% Funcional  
**Versão de Backup**: 1.0

---

## 📋 Resumo Executivo

O sistema de backup foi **COMPLETAMENTE REFORMULADO**. Agora você pode fazer backups confiáveis com:
- ✅ **100% dos dados** (incluindo campos que faltavam antes)
- ✅ **Relações entre títulos** (sequências, spin-offs, etc)
- ✅ **Histórico completo de atividades**
- ✅ **Configurações do perfil**
- ✅ **Restauração segura** em caso de desastre

---

## 🎯 Como Usar

### Opção 1: Backup Completo (RECOMENDADO) ⭐

#### Exportar Tudo
1. Vá para **Stats Tab**
2. Clique no botão **⬇️ Backup** (vermelho, em negrito)
3. Arquivo gerado: `hades-complete-backup-YYYY-MM-DD.json`
4. Contém: entries + relações + atividades + perfil

#### Restaurar Tudo
1. Vá para **Stats Tab**
2. Clique no botão **⬆️ Restaurar** (roxo, em negrito)
3. Selecione o arquivo `hades-complete-backup-*.json`
4. Confirme (vai sobrescrever dados existentes com o mesmo ID)
5. Veja o resumo: quantas entries, relações e atividades foram restauradas

---

### Opção 2: Backup Só de Entries (Compatibilidade)

Para compatibilidade com backups antigos ou se só quer exportar os títulos:

#### Exportar Entries
1. Vá para **Stats Tab**
2. Clique no botão **↓ Entradas** (laranja)
3. Arquivo gerado: `backup-entries-YYYY-MM-DD.json`
4. Contém: só as entries (sem relações, atividades ou perfil)

#### Restaurar Entries
1. Vá para **Stats Tab**
2. Clique no botão **↑ Entradas** (verde)
3. Selecione qualquer arquivo JSON com array de entries
4. Apenas as entries serão importadas

---

## 📊 Estrutura do Backup Completo

```json
{
  "version": "1.0",
  "exportedAt": "2026-04-29T16:30:00.000Z",
  "entries": [
    {
      "id": "cmok9...",
      "tmdbId": 1127274,
      "title": "Avatar 2",
      "type": "MOVIE",
      "status": "COMPLETED",
      "score": 8.5,
      "progress": 1,
      "totalEpisodes": 1,
      
      // ✅ AGORA INCLUI TUDO:
      "rating": 7.3,
      "popularity": 245.6,
      "genres": "Action, Adventure",
      "studio": "Studio Name",
      "releaseDate": "2022-12-16",
      "endDate": null,
      "imagePath": "/path.jpg",
      "bannerPath": "/banner.jpg",
      "customImage": null,
      "synopsis": "Movie description...",
      
      // Datas importantes
      "startDate": "2023-01-10",
      "finishDate": "2023-01-10",
      "createdAt": "2026-04-29T16:24:29.277Z",
      "updatedAt": "2026-04-29T16:24:29.277Z",
      
      // Flags & metadata
      "isFavorite": true,
      "hidden": false,
      "private": false,
      "favoriteRank": 1,
      "rewatchCount": 0,
      "notes": "Excellent movie!",
      "staff": null
    }
  ],
  "relations": [
    {
      "id": "rel123...",
      "sourceEntryId": "entry1",
      "targetEntryId": "entry2",
      "relationType": "PREQUEL",
      "title": "Avatar",
      "kind": "movie",
      "year": "2009",
      "targetTmdbId": 19995,
      "createdAt": "2026-04-29T14:00:00.000Z",
      "updatedAt": "2026-04-29T14:00:00.000Z"
    }
  ],
  "activities": [
    {
      "id": "act123...",
      "entryId": "cmok9...",
      "title": "Avatar 2",
      "type": "MOVIE",
      "status": "COMPLETED",
      "progressStart": 0,
      "progressEnd": 1,
      "score": 8.5,
      "slug": "avatar-2",
      "createdAt": "2026-04-29T16:20:00.000Z",
      "lastUpdatedAt": "2026-04-29T16:24:00.000Z"
    }
  ],
  "profile": {
    "id": "main",
    "username": "My Profile",
    "bio": "Movie enthusiast",
    "avatarUrl": "/avatar.jpg",
    "bannerUrl": "/banner.jpg",
    "avatarColor": "#3db4f2",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-04-29T16:24:00.000Z"
  }
}
```

---

## 🔧 Campos Restaurados (Nova Implementação)

| Campo | Antes | Agora | Status |
|-------|-------|-------|--------|
| Entries básicas | ✅ | ✅ | ✓ |
| Rating | ❌ | ✅ | CORRIGIDO |
| Popularity | ❌ | ✅ | CORRIGIDO |
| Banner | ❌ | ✅ | CORRIGIDO |
| Studio | ⚠️ | ✅ | COMPLETO |
| Genres | ⚠️ | ✅ | COMPLETO |
| Release Date | ⚠️ | ✅ | COMPLETO |
| End Date | ❌ | ✅ | CORRIGIDO |
| Synopsis | ❌ | ✅ | CORRIGIDO |
| Custom Image | ❌ | ✅ | NOVO |
| Private Flag | ❌ | ✅ | NOVO |
| Favorite Rank | ❌ | ✅ | NOVO |
| Created Date | ❌ | ✅ | NOVO |
| **Relações** | ❌ | ✅ | NOVO |
| **Activity Log** | ❌ | ✅ | NOVO |
| **Profile** | ❌ | ✅ | NOVO |

---

## 📡 Endpoints da API

### Backup Completo
```
GET  /api/backup/full-export
POST /api/backup/full-import
```

### Componentes Individuais
```
GET  /api/entries
POST /api/entries/import

GET  /api/relations/export
POST /api/relations/import

GET  /api/activity/export
POST /api/activity/import

GET  /api/profile/export
POST /api/profile/import
```

---

## 🛡️ Segurança & Boas Práticas

### ✅ Fazer Regularly
- Exporte um backup completo **pelo menos uma vez por semana**
- Armazene em pelo menos **2 locais diferentes** (computador, nuvem, pen drive)
- Mantenha um histórico de backups (últimos 4 semanas)

### ✅ Ao Restaurar
- **Sempre teste em um banco limpo primeiro** (ou em outro ambiente)
- Leia o resumo de restauração cuidadosamente
- Verifique se os dados foram restaurados corretamente
- Só delete o backup antigo depois de confirmar tudo

### ❌ NÃO Fazer
- Não compartilhe backups (contém dados pessoais)
- Não delete arquivo antes de confirmar restauração
- Não edite manualmente o JSON a menos que saiba o que está fazendo

---

## 🆘 Troubleshooting

### Problema: "Formato de backup inválido"
**Solução**: Certifique-se de que o arquivo é realmente um backup gerado pelo sistema. Não é compatível com JSONs aleatórios.

### Problema: "Arquivo inválido ou corrompido"
**Solução**: 
- Verifique se o arquivo não foi alterado
- Tente de outro arquivo de backup
- Se persistir, entre em contato

### Problema: Alguns dados não foram restaurados
**Solução**:
- Leia a mensagem de avisos (se houver)
- Pode ser que algumas relações ou atividades tenham falhado (entry pai não existe)
- Verifique o console do navegador para mais detalhes

### Problema: "Entry XYZ não encontrada" nos logs
**Isso é NORMAL** ao importar relações ou atividades cujas entries foram deletadas. O sistema pula essas automaticamente.

---

## 📈 Fluxo de Restauração Completo

```
1. Upload backup completo
   ↓
2. Valida estrutura
   ↓
3. Restaura Profile
   ↓
4. Restaura Entries (cria + atualiza)
   ↓
5. Restaura Relações (valida entries)
   ↓
6. Restaura Atividades (valida entries)
   ↓
7. Retorna resumo final
```

**Ordem é importante**: Entries DEVEM ser restauradas antes de relações/atividades.

---

## 🚀 O Que Mudou?

### Antes (PROBLEMÁTICO)
- ❌ Backup incompleto (17+ campos faltando)
- ❌ Relações perdidas
- ❌ Histórico perdido
- ❌ Perfil não salvo
- ❌ Restauração podia perder dados existentes

### Agora (CORRIGIDO)
- ✅ Backup 100% completo
- ✅ Relações preservadas
- ✅ Histórico preservado
- ✅ Perfil preservado
- ✅ Restauração segura com validação
- ✅ Endpoints separados para cada componente
- ✅ Compatibilidade com backups antigos mantida

---

## 📝 Casos de Uso

### Caso 1: Backup Preventivo
```
Toda semana → Click "⬇️ Backup" → Salva em pasta do Dropbox/OneDrive
```

### Caso 2: Migração entre Computadores
```
PC Antigo: Click "⬇️ Backup"
    ↓
PC Novo: Click "⬆️ Restaurar" + seleciona arquivo
    ↓
Todos os dados migrados com histórico intacto
```

### Caso 3: Recuperação de Desastre
```
Banco caiu? Deletou dados por acidente?
    ↓
Click "⬆️ Restaurar" + últi
mo backup
    ↓
Sistema recuperado 100%
```

### Caso 4: Auditoria
```
Precisa ver o que foi adicionado/modificado?
    ↓
Exporta backup
    ↓
Abre JSON e procura by createdAt/updatedAt
    ↓
Histórico completo disponível
```

---

## 🔐 Validações Internas

O sistema faz validações em **3 camadas**:

### Camada 1: Frontend
- Valida se arquivo é JSON válido
- Valida estrutura básica

### Camada 2: API Validation
- Valida tipos de dados
- Valida dates válidas
- Valida IDs únicos

### Camada 3: Database
- Constraints do Prisma
- Foreign keys
- Unique constraints

---

## 📚 Integração com Código

### TypeScript (Frontend)
```typescript
interface Entry {
  // ... todos os 30+ campos agora disponíveis
}

// Novo no endpoint GET /api/entries:
createdAt: string;  // ISO string
updatedAt: string;  // ISO string
```

### Prisma (Backend)
```prisma
model Entry {
  // ... todos os 30+ campos
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Relation {
  // Totalmente suportado
}

model ActivityLog {
  // Totalmente suportado
}

model Profile {
  // Totalmente suportado
}
```

---

## ✅ Checklist de Implementação

- [x] Interface TypeScript atualizada com todos os campos
- [x] GET /api/entries serializa createdAt
- [x] POST /api/entries/import restaura todos os campos
- [x] Novos endpoints para relations export/import
- [x] Novos endpoints para activity export/import
- [x] Novos endpoints para profile export/import
- [x] Endpoint unificado /api/backup/full-export
- [x] Endpoint unificado /api/backup/full-import
- [x] Frontend atualizado com novos botões
- [x] Validações em 3 camadas
- [x] Tratamento de erros robusto
- [x] Documentação completa

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique se o arquivo é um backup válido
2. Tente com um backup mais recente
3. Verifique o console do navegador (F12)
4. Verifique os logs do servidor
5. Se persistir, entre em contato com suporte

---

**Última atualização**: 29 de Abril de 2026
**Status da Feature**: ✅ Production Ready
