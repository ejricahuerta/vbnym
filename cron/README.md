# Cloudflare Cron for payment sync

This Worker triggers the secure endpoint at:

- `POST /api/admin/payments/sync`

## 1) Required web env

In `web/.env` (and production secrets), set:

- `PAYMENT_SYNC_CRON_TOKEN=<long-random-secret>`

The endpoint accepts cron calls only when header `x-cron-token` matches this value.

## 2) Required Worker secrets

In `cron/`, set these secrets/vars:

- `PAYMENT_SYNC_ENDPOINT` (example: `https://yourdomain.com/api/admin/payments/sync`)
- `PAYMENT_SYNC_CRON_TOKEN` (same value as `web` env)

Commands:

```bash
pnpm install
wrangler secret put PAYMENT_SYNC_ENDPOINT
wrangler secret put PAYMENT_SYNC_CRON_TOKEN
```

## 3) Schedule

Current schedule in `wrangler.toml`:

- `* * * * *` (every minute)

Change it in `[triggers] crons` if you want a different cadence.

## 4) Deploy

```bash
pnpm run deploy
```

## 5) Local mock (same HTTP contract)

From `web/`, with `next dev` running and `PAYMENT_SYNC_CRON_TOKEN` in `web/.env`:

```bash
pnpm run cron:mock
```

To mimic **every-minute** cron locally (POSTs on start, then every 60s until Ctrl+C):

```bash
pnpm run cron:mock:minute
```

See `../scripts/README.md` for details.
