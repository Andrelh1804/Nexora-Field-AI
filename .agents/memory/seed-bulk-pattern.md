---
name: Seed bulk script pattern
description: Lessons from writing the bulk seed script for Nexora Field AI
---

## Key patterns

1. **Unique emails**: Use `seed_type_${Date.now()}_${i}@nexora.dev` — avoids ON CONFLICT issues on re-runs
2. **Don't swallow errors**: Use `catch (e: any) { console.error("ERR:", e.message) }` during development so you can see what's failing
3. **Plans seeded separately**: Run `psql "$DATABASE_URL" -c "INSERT INTO plans..."` directly — plans are static config, not bulk data
4. **Array columns in raw SQL**: Use `{val1,val2}` string format for Postgres array literals (not JSON)

## Seed script location
`scripts/src/seed-bulk.ts` — runs via `pnpm --filter @workspace/scripts run seed-bulk`

**Why:** ON CONFLICT DO NOTHING silently skips ALL inserts when emails conflict, returning 0 rows, which breaks all subsequent FK-dependent inserts.
