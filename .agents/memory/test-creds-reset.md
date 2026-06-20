---
name: Test credentials reset
description: How to reset test user passwords when bcrypt hash doesn't match
---

## Problem
Original seed script used unknown password — stored hash does NOT match "password".

## Fix
Generate a new hash and update directly:
```bash
node -e "const b=require('./artifacts/api-server/node_modules/bcryptjs'); b.hash('password',10).then(h=>console.log(h))"
psql "$DATABASE_URL" -c "UPDATE users SET password_hash='<hash>' WHERE email IN ('admin@nexora.com','empresa@techpro.com','carlos@tecnico.com',...);"
```

## Test credentials (password: "password")
| Email | Role |
|-------|------|
| admin@nexora.com | admin |
| empresa@techpro.com | company |
| empresa@infracorp.com | company |
| carlos@tecnico.com | technician |
| ana@tecnico.com | technician |
| joao@tecnico.com | technician |

**Why:** bcryptjs version differences or different original passwords can cause hash mismatch. Always verify with bcrypt.compare() before debugging auth routes.
