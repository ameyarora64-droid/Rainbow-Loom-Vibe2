---
name: Email setup
description: Resend used for transactional emails; app works without API key (logs to console)
---
Email helper at artifacts/api-server/src/email.ts. Uses RESEND_API_KEY env var — if absent, logs to console.
EMAIL_FROM sets the from address. Four types: orderConfirmation, orderOnHold, orderUnhold, orderStarted.
**Why:** Graceful degradation lets app work in dev without a real key.
**How to apply:** sendEmail() already handles the fallback — no changes needed.
