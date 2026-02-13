---
name: mailgun-email
description: Send outbound emails via Mailgun (API) and list inbound **stored** messages via the Mailgun Events API. Use when the user asks to send outreach emails, follow-ups, or batch emails from leads.csv, or when they ask to view/read messages stored in Mailgun (requires Mailgun routes with store() enabled).
---

# Mailgun Email Sender

Use the bundled scripts to:
- send single emails
- batch-send from `leads.csv`
- list inbound **stored** messages (if your Mailgun routes store inbound mail)

## Setup (one-time)

Create `/home/otothea/.openclaw/.env` with:

- `MAILGUN_API_KEY=...`
- `MAILGUN_DOMAIN=...` (example: `mg.yourdomain.com`)
- `MAILGUN_FROM="Chip <chip@yourdomain.com>"` (optional)
- `MAILGUN_API_BASE=https://api.eu.mailgun.net` (optional, EU region)

## Send one email

Uses **TypeScript** via `tsx`.

```bash
npx --yes tsx /home/otothea/.openclaw/workspace/skills/mailgun-email/scripts/send_mailgun.ts \
  --to "someone@example.com" \
  --subject "Quick question" \
  --text-file /path/to/body.txt
```

## Batch send from leads.csv

Uses `Email` column by default, falling back to `ContactEmail`. Supports `{BusinessName}` and `{Name}` placeholders.

```bash
npx --yes tsx /home/otothea/.openclaw/workspace/skills/mailgun-email/scripts/send_mailgun.ts \
  --csv /home/otothea/.openclaw/workspace/revenue-hvac/leads.csv \
  --subject "Quick question, {BusinessName}" \
  --text-file /home/otothea/.openclaw/workspace/revenue-hvac/templates/email1.txt \
  --start 1 --end 20
```

### Dry run

```bash
npx --yes tsx /home/otothea/.openclaw/workspace/skills/mailgun-email/scripts/send_mailgun.ts \
  --csv /home/otothea/.openclaw/workspace/revenue-hvac/leads.csv \
  --subject "Quick question, {BusinessName}" \
  --text-file /home/otothea/.openclaw/workspace/revenue-hvac/templates/email1.txt \
  --start 1 --end 20 \
  --dry-run
```

## List inbound stored messages (last 24h)

This only works if inbound mail is being stored in Mailgun (via Routes with `store()`); otherwise it will show none.

```bash
npx --yes tsx /home/otothea/.openclaw/workspace/skills/mailgun-email/scripts/list_mailgun_stored.ts \
  --since-hours 24 \
  --limit 100
```

To fetch and print the stored message JSON (clipped):

```bash
npx --yes tsx /home/otothea/.openclaw/workspace/skills/mailgun-email/scripts/list_mailgun_stored.ts \
  --since-hours 24 \
  --limit 20 \
  --fetch \
  --max-chars 4000
```

## Notes

- Scripts load `.env` by default from `/home/otothea/.openclaw/.env`.
- If a row has no valid email, it is skipped (and shown in `--dry-run`).
- Keep batch sizes small to reduce mistakes and rate-limit issues.
