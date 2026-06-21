---
name: Enterprise roles and admin modules
description: admin_master role, new DB tables, admin CMS routes for landing page, plans, and user management
---

## Role hierarchy

`admin_master` > `admin` > `company` / `technician`

**Why:** Enterprise prompt requires a super-admin that can create/delete other admins. Regular admins cannot touch admin_master accounts.

**How to apply:**
- Backend: use `requireRole("admin", "admin_master")` for general admin access; `requireRole("admin_master")` for destructive or privileged ops (delete plan, delete user, promote to admin_master)
- Frontend: `ProtectedRoute` now also passes `admin_master` for any route that lists `"admin"` in its roles array — see `App.tsx` ProtectedRoute logic
- Seed: `artifacts/api-server/src/index.ts` seeds default admin as `admin_master`

## New DB tables (landing CMS)

- `landing_settings` — key/value store for hero title, subtitle, CTAs, footer info
- `landing_testimonials` — user-editable testimonials with active/sortOrder
- `landing_faq` — FAQ entries with active/sortOrder
- `landing_benefits` — benefit cards with icon/title/description

## New plans table columns

- `description` (text nullable)
- `highlighted` (boolean, default false) — featured plan badge
- `sort_order` (integer)
- `updated_at` (timestamp)
- `plan_target` enum now includes `"both"` in addition to `"technician"` and `"company"`

## Admin-only API routes (direct fetch, not Orval-generated)

- `GET/POST/PATCH/DELETE /api/admin/users` — user management
- `GET/POST/PATCH/DELETE /api/admin/plans` — plan management
- `GET/PUT /api/landing/settings` — hero/footer CMS
- `GET/POST/PATCH/DELETE /api/landing/testimonials` — testimonials CMS
- `GET/POST/PATCH/DELETE /api/landing/faq` — FAQ CMS
- `GET/POST/PATCH/DELETE /api/landing/benefits` — benefits CMS

## Frontend pages

- `artifacts/nexora-field/src/pages/admin-administradores.tsx`
- `artifacts/nexora-field/src/pages/admin-planos.tsx`
- `artifacts/nexora-field/src/pages/admin-landing.tsx`

## Default credentials

- Email: admin@nexorafield.com.br
- Password: Admin@123456 (must change on first login)
