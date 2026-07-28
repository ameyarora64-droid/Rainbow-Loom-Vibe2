---
name: Replit setup quirks
description: Environment config required to run this pnpm workspace on Replit
---

## Required env vars (already set)
- `PORT=8000` — shared env var used by the API server startup check
- `BASE_PATH=/` — shared env var required by the Vite config before it boots

## PORT conflict workaround
Both the API server and the Vite frontend read `PORT`. Workflows use inline overrides to avoid the clash:
- Backend: `PORT=8000 pnpm --filter @workspace/api-server run dev`
- Frontend: `PORT=5000 pnpm --filter @workspace/rainbow-loom-store run dev`

**Why:** The shared `PORT=8000` env var would otherwise make Vite try to bind 8000 (already taken by the API).

## Vite dev proxy
`artifacts/rainbow-loom-store/vite.config.ts` proxies `/api/*` → `http://localhost:8000`.
The app never calls `setBaseUrl()` — all API requests are relative paths that rely on this proxy in dev.

**How to apply:** Any time the frontend and backend ports change, update the proxy target and the workflow PORT overrides together.
