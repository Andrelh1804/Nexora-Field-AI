# Nexora Field AI

A SaaS marketplace connecting companies needing field technical support with specialized autonomous technicians, powered by AI matching.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at `/api`)
- `pnpm --filter @workspace/nexora-field run dev` — run the frontend (port 25074, proxied at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — JWT signing secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Wouter + TanStack Query + Tailwind / shadcn-ui
- API: Express 5 + JWT auth (bcryptjs + jsonwebtoken)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for all API contracts
- `lib/api-client-react/src/generated/` — generated React Query hooks + Zod schemas
- `lib/db/src/schema/` — Drizzle schema files (users, technicians, companies, service-orders, applications, ratings)
- `artifacts/nexora-field/src/` — React frontend (pages, components, lib)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/nexora-field/public/nexora-logo.png` — brand logo (background removed)

## Architecture decisions

- Contract-first: OpenAPI spec → Orval codegen → React Query hooks + Zod. Never hand-write API clients.
- JWT auth stored in `localStorage` as `nexora_token`. `setAuthTokenGetter` is called once at module load in `src/lib/auth.tsx` so all generated hooks pick it up automatically.
- AI match scoring done in-memory (weighted keyword matching on specialties). Gemini integration is a future enhancement.
- Role-based access: `admin_master`, `admin`, `company`, `technician` — enforced both in middleware (`requireRole`) and in the frontend per-route. `admin_master` has all admin privileges plus exclusive rights: create/delete admins, delete plans, promote to admin_master.
- New admin enterprise modules: `/admin/administradores`, `/admin/planos`, `/admin/landing` — use direct fetch (not Orval-generated hooks) since they are admin-only and were added post-codegen.
- Dashboard queries use raw SQL via `db.execute(sql\`...\`)` for GROUP BY aggregations.

## Product

- **Companies** post service orders (chamados) with details, value, and SLA
- **Technicians** browse and apply to open chamados; AI scoring ranks best matches
- **Admin** sees platform-wide stats (users, companies, orders, simulated revenue)
- Role-based dashboards with live stats
- Technician directory with ratings and profiles

## Test credentials

| Role | Email | Senha |
|------|-------|-------|
| Admin Master | admin@nexorafield.com.br | Admin@123456 |
| Empresa | empresa@techpro.com | password |
| Empresa | empresa@infracorp.com | password |
| Técnico | carlos@tecnico.com | password |
| Técnico | ana@tecnico.com | password |
| Técnico | joao@tecnico.com | password |

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after editing `openapi.yaml` before touching frontend code.
- Express 5 requires `req.params["id"] as string` (not `req.params.id`) to satisfy TypeScript.
- Hooks with `id` param (e.g. `useGetTechnician(id)`) already inject `enabled: !!(id)` automatically — don't double-pass it or TypeScript will complain about missing `queryKey`.
- `useGetMe` needs an explicit `queryKey: getGetMeQueryKey()` when passing custom query options.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
