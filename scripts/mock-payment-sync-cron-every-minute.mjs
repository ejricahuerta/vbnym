#!/usr/bin/env node
/**
 * Local mock of the payment-sync cron: POST /api/admin/payments/sync every minute
 * (same contract as cron/src/index.ts and mock-payment-sync-cron.mjs).
 *
 * Env (see web/.env.example):
 *   PAYMENT_SYNC_CRON_TOKEN — required
 *   PAYMENT_SYNC_ENDPOINT   — optional, default http://localhost:3000/api/admin/payments/sync
 *   PAYMENT_SYNC_INTERVAL_MS — optional, default 60000 (1 minute)
 *
 * Run from web/:
 *   node --env-file=.env ../scripts/mock-payment-sync-cron-every-minute.mjs
 *
 * Stop with Ctrl+C.
 */

const endpoint =
  process.env.PAYMENT_SYNC_ENDPOINT?.trim() ||
  "http://localhost:3000/api/admin/payments/sync";
const token = process.env.PAYMENT_SYNC_CRON_TOKEN?.trim();
const intervalMs = Math.max(
  5000,
  Number.parseInt(process.env.PAYMENT_SYNC_INTERVAL_MS ?? "60000", 10) || 60000
);

if (!token) {
  console.error(
    "Missing PAYMENT_SYNC_CRON_TOKEN. Set it in web/.env or export it before running."
  );
  process.exit(1);
}

async function runOnce() {
  const started = new Date().toISOString();
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "x-cron-token": token,
        "content-type": "application/json",
      },
    });
    const body = await res.text();
    console.log(`[${started}] ${res.status} ${res.statusText} ${body}`);
    return res.ok;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[${started}] fetch failed: ${msg}`);
    return false;
  }
}

console.log(
  `Payment sync mock: POST ${endpoint} every ${intervalMs / 1000}s (Ctrl+C to stop)\n`
);

await runOnce();

const timer = setInterval(() => {
  void runOnce();
}, intervalMs);

function shutdown() {
  clearInterval(timer);
  console.log("\nStopped.");
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
