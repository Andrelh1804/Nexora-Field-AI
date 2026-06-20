---
name: Specialties System
description: Architecture and key decisions for the 4-table specialty hierarchy powering AI matching
---

## Schema (lib/db/src/schema/)
- `specialty-categories.ts` — specialtyCategoriesTable, specialtySubcategoriesTable, specialtySkillsTable
- `technician-specialties.ts` — technicianSpecialtiesTable with specialtyLevelEnum (iniciante/intermediario/avancado/especialista)
- Both exported in schema/index.ts

## Seed
- `artifacts/api-server/src/scripts/seed-specialties.ts` — called on every server startup (idempotent via name-check before insert)
- 8 categories, 28 subcategories, ~160 skills seeded

## API Routes (artifacts/api-server/src/routes/specialties.ts)
- `GET /specialties` — full tree (categories → subcategories → skills)
- `GET /specialties/search?q=` — fuzzy search across all levels
- `GET /technicians/me/specialties` — auth required
- `PUT /technicians/me/specialties` — batch replace (delete all then insert); also syncs legacy specialties[] text array for backwards compat
- `GET /technicians/:id/specialties` — public
- Admin: POST/PATCH on /admin/specialties/categories|subcategories|skills

**Why batch-replace (not upsert):** Simplest pattern for full-replace semantics; avoids tracking deletions individually.

## Frontend
- `SpecialtySelector` component: tree with Collapsible, inline level+years editor on chip click, real-time search
- `/especialidades` page (technician only) — full management with Match Score widget
- `/admin/especialidades` page (admin only) — CRUD panel with hierarchy tree
- Onboarding step 2 for technicians now uses SpecialtySelector (wider max-w-2xl card)
- Nav: technicians get "⚡ Especialidades" link; admins get "🗂️ Especialidades"

## Backwards compatibility
PUT /technicians/me/specialties also updates the legacy `technicians.specialties TEXT[]` column with skill names, so existing queries filtering by specialty text still work.
