---
name: Service status enum
description: Valid values for the service_status enum in PostgreSQL
---

## Valid values (service_status pgEnum)
- `aberto`
- `aceito`
- `em_andamento`
- `finalizado`
- `cancelado`

**Why:** "concluido" is NOT a valid value and will throw `invalid input value for enum service_status`. This caused seed failures.

**How to apply:** Use `finalizado` (not `concluido`) when querying or inserting completed service orders.
