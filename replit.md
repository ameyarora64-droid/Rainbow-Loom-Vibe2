# Rainbow Loom Vibe Store

A customized rainbow loom bracelet store where customers can browse products, place orders, and track them — with an admin dashboard to manage products and orders.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string (auto-managed by Replit)
- Required env: `PORT` — set to `8000` for the API server (already configured)
- Required env: `BASE_PATH` — set to `/` for the frontend (already configured)
- Optional secret: `RESEND_API_KEY` — enables order confirmation emails via Resend; gracefully no-ops if absent

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/rainbow-loom-store/` — React + Vite frontend (port 5000)
- `artifacts/api-server/` — Express 5 API server (port 8000); Vite dev proxy forwards `/api/*` from port 5000 → 8000
- `lib/db/` — Drizzle ORM schema (source of truth for DB tables)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contracts)
- `lib/api-client-react/src/generated/` — auto-generated React Query hooks (run `pnpm --filter @workspace/api-spec run codegen` to regenerate)
- `lib/api-zod/` — auto-generated Zod schemas

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

_Describe the high-level user-facing capabilities of this app once they exist._

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
