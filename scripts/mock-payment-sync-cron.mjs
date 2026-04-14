#!/usr/bin/env node
/**
 * Local mock of the Cloudflare cron: POST /api/admin/payments/sync with x-cron-token.
 * Same contract as cron/src/index.ts.
 *
 * Env (see web/.env.example):
 *   PAYMENT_SYNC_CRON_TOKEN — required
 *   PAYMENT_SYNC_ENDPOINT — optional, default http://localhost:3000/api/admin/payments/sync
 */

const endpoint =
  process.env.PAYMENT_SYNC_ENDPOINT?.trim() ||
  "http://localhost:3000/api/admin/payments/sync";
const token = process.env.PAYMENT_SYNC_CRON_TOKEN?.trim();

if (!token) {
  console.error(
    "Missing PAYMENT_SYNC_CRON_TOKEN. Set it in web/.env or export it before running."
  );
  process.exit(1);
}

const res = await fetch(endpoint, {
  method: "POST",
  headers: {
    "x-cron-token": token,
    "content-type": "application/json",
  },
});

const body = await res.text();
console.log(`${res.status} ${res.statusText}`);
console.log(body);
process.exit(res.ok ? 0 : 1);
