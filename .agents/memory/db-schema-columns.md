---
name: DB schema column names
description: Actual column names in Drizzle schema that differ from what you might guess
---

## users table
- `password_hash` (NOT `password`)
- `name`, `email`, `role`

## companies table
- `razao_social` (NOT `trade_name`) — required NOT NULL
- `nome_fantasia` — optional
- `cnpj`, `email` (required), `city`, `state`, `phone`, `responsavel`, `address`
- NO `industry` column

## technicians table
- `name`, `email`, `phone`, `cpf`, `city`, `state`, `bio`
- `specialties` — text array, use `{val1,val2}` format in raw SQL
- `rating` — real, updated by aggregate query
- NO `daily_rate`, NO `available`, NO `experience_years` columns

**Why:** These mismatches caused silent seed failures with try/catch swallowing errors. Always grep the actual schema file before writing raw SQL.

**How to apply:** When writing raw SQL seeds or queries, always check `lib/db/src/schema/*.ts` for actual column names before assuming.
