---
name: mailgun-email
description: Send outbound emails via Mailgun (API) from OpenClaw. Use when the user asks to send outreach emails, follow-ups, or batch emails from leads.csv using Mailgun credentials stored in workspace .env (MAILGUN_API_KEY, MAILGUN_DOMAIN, optional MAILGUN_FROM).
---

# Mailgun Email Sender

Use the bundled script to send single emails or batch sends from `leads.csv`.

## Setup (one-time)

Create `/home/otothea/.openclaw/.env` with:

- `MAILGUN_API_KEY=...`
- `MAILGUN_DOMAIN=...` (example: `mg.yourdomain.com`)
- `MAILGUN_FROM="Chip <chip@yourdomain.com>"` (optional)

## Send one email

Uses **TypeScript** via `tsx`.

```bash
npx --yes tsx /home/otothea/.openclaw/workspace/revenue-hvac/skills/mailgun-email/scripts/send_mailgun.ts \
  --to "someone@example.com" \
  --subject "Quick question" \
  --text-file /path/to/body.txt
```

## Batch send from leads.csv

Uses `Email` column by default, falling back to `ContactEmail`. Supports `{BusinessName}` and `{Name}` placeholders.

```bash
npx --yes tsx /home/otothea/.openclaw/workspace/revenue-hvac/skills/mailgun-email/scripts/send_mailgun.ts \
  --csv /home/otothea/.openclaw/workspace/revenue-hvac/leads.csv \
  --subject "Quick question, {BusinessName}" \
  --text-file /home/otothea/.openclaw/workspace/revenue-hvac/templates/email1.txt \
  --start 1 --end 20
```

### Dry run

```bash
npx --yes tsx /home/otothea/.openclaw/workspace/revenue-hvac/skills/mailgun-email/scripts/send_mailgun.ts \
  --csv /home/otothea/.openclaw/workspace/revenue-hvac/leads.csv \
  --subject "Quick question, {BusinessName}" \
  --text-file /home/otothea/.openclaw/workspace/revenue-hvac/templates/email1.txt \
  --start 1 --end 20 \
  --dry-run
```

## Notes

- The script loads `.env` by default from `/home/otothea/.openclaw/.env`.
- Set `MAILGUN_API_BASE=https://api.eu.mailgun.net` if your Mailgun account is in the EU region.
- If a row has no valid email, it is skipped (and shown in `--dry-run`).
- Keep batch sizes small to reduce mistakes and rate-limit issues.
