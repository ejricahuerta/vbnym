#!/usr/bin/env node
/**
 * Local mock: POST /api/cron/gmail-reauth-reminder with x-cron-token.
 *
 * Env:
 *   PAYMENT_SYNC_CRON_TOKEN — required (same secret as payment sync cron)
 *   GMAIL_REAUTH_CRON_ENDPOINT — optional, default http://localhost:3000/api/cron/gmail-reauth-reminder
 */

const endpoint =
  process.env.GMAIL_REAUTH_CRON_ENDPOINT?.trim() ||
  "http://localhost:3000/api/cron/gmail-reauth-reminder";
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
