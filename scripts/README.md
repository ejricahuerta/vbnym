# Scripts

## Mock payment sync cron (local)

This mirrors what the Cloudflare Worker in `cron/` does: `POST` to the sync URL with header `x-cron-token`.

### Prerequisites

1. `web` app running locally (`pnpm dev` from `web/`).
2. `PAYMENT_SYNC_CRON_TOKEN` set in `web/.env` (same value the Worker uses in production).

### Run (recommended)

From the `web/` directory (loads `web/.env` via Node’s `--env-file`):

```bash
pnpm run cron:mock
```

### Run manually

From repo root, with env vars set:

```bash
export PAYMENT_SYNC_CRON_TOKEN=your-secret
# optional:
# export PAYMENT_SYNC_ENDPOINT=http://localhost:3000/api/admin/payments/sync
node scripts/mock-payment-sync-cron.mjs
```

On Windows PowerShell:

```powershell
$env:PAYMENT_SYNC_CRON_TOKEN="your-secret"
node scripts/mock-payment-sync-cron.mjs
```

### Optional override

`PAYMENT_SYNC_ENDPOINT` — full URL if not using the default `http://localhost:3000/api/admin/payments/sync`.

## Mock payment sync every minute (local loop)

Same HTTP contract as `cron:mock`, but runs **immediately** and then **every 60 seconds** until you press Ctrl+C. Use this to mirror production when `wrangler.toml` uses every-minute triggers.

From `web/`:

```bash
pnpm run cron:mock:minute
```

Optional: `PAYMENT_SYNC_INTERVAL_MS` (minimum 5000) to change the interval in milliseconds.

## Player payment flow (verify + optional seed + sync)

Script: `scripts/test-player-payment-flow.mjs`

1. Prints how the app’s Gmail sync **actually** works (NYM- code + `From` email match; not “e-transfer” + player name).
2. Optional `--seed`: creates an unpaid signup for **Ed Test** / **exricahuerta@gmail.com** (or `TEST_FLOW_NAME` / `TEST_FLOW_EMAIL`) and emails the payment code via Resend.
3. Optional `--sync`: `POST` payment sync (same as `cron:mock`).

From `web/`:

```bash
pnpm run test:player-flow
pnpm run test:player-flow -- --seed
pnpm run test:player-flow -- --sync
pnpm run test:player-flow -- --seed --sync
```

To complete a real match, the **connected admin Gmail** must receive a message whose **Subject or Snippet** contains the `NYM-` code and whose **From** parses to the signup email (see script output). A plain email from the player’s Gmail to the admin inbox is the reliable manual test; raw Interac notifications usually do not satisfy the `From` check.
