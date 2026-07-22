---
name: Admin order flow  
description: Orders have status with Hold/Unhold/Start actions that send customer emails
---
Statuses: pending → on_hold (POST /orders/:id/hold) or in_progress (POST /orders/:id/start)
on_hold → pending (POST /orders/:id/unhold) or in_progress (POST /orders/:id/start)
DB columns added: customerEmail, status (default pending), estimatedCompletion (nullable text)
Global color: PATCH /colors/global disables a color across ALL products at once.
Product availability: PATCH /products/:id/available toggles whole product on/off.
**Why:** Admin needed hold/unhold/start workflow per user request.
**How to apply:** After DB schema changes: cd lib/db && pnpm run push-force
