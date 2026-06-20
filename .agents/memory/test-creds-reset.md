---
name: Test credentials reset
description: Current admin and test user credentials for Nexora Field AI
---

## Admin padrão (criado via seed automático no startup)
| Campo | Valor |
|-------|-------|
| Email | admin@nexorafield.com |
| Senha | Admin@123456 |
| Role | admin |

**Why:** Admin é criado automaticamente em `artifacts/api-server/src/index.ts` via `seedDefaultAdmin()` ao iniciar o servidor, se não existir. Idempotente — roda sempre mas só insere se não existir.

## Segurança implementada
- Cadastro público aceita apenas roles `company` e `technician`
- Tentativa de criar role `admin` via POST /auth/register retorna HTTP 403
- Somente admins existentes (com acesso direto ao banco ou via seed) podem criar novos admins

## Banco de dados
- Tabelas criadas via `drizzle-kit push --force` em `lib/db/`
- Sem arquivo de migrations — usa push direto
- Para recriar: `cd lib/db && pnpm run push-force`

## Validações no cadastro público
- Nome: mínimo 2 caracteres
- Email: formato regex + lowercase normalizado
- Senha: mínimo 8 caracteres
- bcrypt rounds: 12 (antes era 10)
