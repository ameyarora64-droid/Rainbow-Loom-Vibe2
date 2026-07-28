---
name: Email setup
description: How order emails are sent — Gmail SMTP via nodemailer
---

## Provider
Gmail SMTP via nodemailer (NOT Resend, despite earlier memory note).

## Required secrets
- `GMAIL_USER` — the Gmail address to send from
- `GMAIL_APP_PASSWORD` — a Google App Password (not the account password); generate at myaccount.google.com → Security → 2-Step Verification → App passwords

## Behavior
If either secret is missing, emails are logged to console and the app continues normally (graceful no-op).

## Email templates (in artifacts/api-server/src/email.ts)
- `orderConfirmationEmail` — sent on order placed
- `orderOnHoldEmail` — sent when admin holds an order
- `orderUnholdEmail` — sent when admin unholds
- `orderStartedEmail` — sent when admin starts making, includes estimated time
- `orderCompletedEmail` — sent when admin completes order

**Why:** Nodemailer + Gmail App Password is zero-cost for low volume and requires no third-party API key.
