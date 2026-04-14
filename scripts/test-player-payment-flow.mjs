#!/usr/bin/env node
/**
 * Player → payment email → Gmail sync → paid verification helper.
 *
 * What the app actually does (see web/lib/gmail-sync.ts):
 * - Gmail list query: newer_than:30d "NYM-"  (not "e-transfer" / not player name)
 * - Extracts codes matching NYM-XXXX-XXXX from each message Subject + Snippet
 * - Marks paid only if: pending signup.payment_code matches AND
 *   signup.email === email parsed from the message From header
 *
 * Limitation: real Interac notifications usually come From noreply@…interac…,
 * not the player’s Gmail, so sync will not match unless the inbox receives a
 * message whose From is the player (e.g. player composes mail from Gmail, or a
 * forward that preserves the original sender in a way Gmail still exposes—rare).
 *
 * Usage (from web/):
 *   node --env-file=.env ../scripts/test-player-payment-flow.mjs           # print verification only
 *   node --env-file=.env ../scripts/test-player-payment-flow.mjs --seed   # create unpaid signup + email player
 *   node --env-file=.env ../scripts/test-player-payment-flow.mjs --sync   # POST payment sync (cron or dev server)
 *   node --env-file=.env ../scripts/test-player-payment-flow.mjs --seed --sync
 *
 * Env:
 *   TEST_FLOW_GAME_ID   — optional UUID; default: first listed game
 *   TEST_FLOW_NAME      — default "Ed Test"
 *   TEST_FLOW_EMAIL     — default exricahuerta@gmail.com
 *   ADMIN_INBOX_EMAIL   — default edmel@ednsy.com (shown in instructions only)
 */

import crypto from "node:crypto";
import { randomUUID } from "node:crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function toBase32(buffer, length) {
  let result = "";
  let bits = 0;
  let value = 0;
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      result += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  return result.slice(0, length).toUpperCase();
}

function generatePaymentCode(runId, signupId, email, secret) {
  const payload = `${runId}:${signupId}:${email.toLowerCase()}`;
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(payload);
  const hash = hmac.digest();
  const code = toBase32(hash.subarray(0, 5), 8);
  return `NYM-${code.slice(0, 4)}-${code.slice(4, 8)}`;
}

const DEFAULT_NAME = process.env.TEST_FLOW_NAME?.trim() || "Ed Test";
const DEFAULT_EMAIL = process.env.TEST_FLOW_EMAIL?.trim() || "exricahuerta@gmail.com";
const ADMIN_INBOX = process.env.ADMIN_INBOX_EMAIL?.trim() || "edmel@ednsy.com";

/** Google sign-in with login_hint, then Gmail compose (To / Subject / Body prefilled). */
function gmailSignInAndComposeUrl(opts) {
  const compose = new URL("https://mail.google.com/mail/");
  compose.searchParams.set("view", "cm");
  compose.searchParams.set("fs", "1");
  compose.searchParams.set("to", opts.to);
  compose.searchParams.set("su", opts.subject);
  if (opts.body) compose.searchParams.set("body", opts.body);

  const login = new URL("https://accounts.google.com/ServiceLogin");
  login.searchParams.set("service", "mail");
  login.searchParams.set("continue", compose.toString());
  login.searchParams.set("login_hint", opts.loginHint);
  return login.toString();
}

/** Gmail compose only (works when already signed in as the player). */
function gmailComposeUrl(opts) {
  const compose = new URL("https://mail.google.com/mail/");
  compose.searchParams.set("view", "cm");
  compose.searchParams.set("fs", "1");
  compose.searchParams.set("to", opts.to);
  compose.searchParams.set("su", opts.subject);
  if (opts.body) compose.searchParams.set("body", opts.body);
  return compose.toString();
}

function printVerification() {
  console.log(`
=== Verification: does the app match your described flow? ===

1) User joins a game → receives email with payment code
   YES — web/actions/signup.ts sends Resend mail with payment_code after insert.

2) User sends e-transfer to admin (${ADMIN_INBOX})
   OUT OF BAND — banking / Interac; not implemented in code.

3) App reads Gmail, searches e-transfers, keywords player name
   PARTIAL / NO — web/lib/gmail-sync.ts uses Gmail query:
     newer_than:30d "NYM-"
   It does NOT search for "e-transfer" or the player’s display name.
   It scans Subject + Snippet for NYM-XXXX-XXXX pattern only.

4) Match signed-up player → mark confirmed (paid)
   YES, but with an extra rule you did not mention:
   - payment_code in the message must equal the signup’s code, AND
   - the message From header (parsed email) must equal the signup’s email.
   Interac deposit emails typically fail the From check because they are From
   Interac/bank addresses, not the player’s Gmail.

=== References ===
- Gmail query + extract + match: web/lib/gmail-sync.ts (findCodeHits, syncPaidSignupsFromGmail)
- Cron / admin trigger: web/app/api/admin/payments/sync/route.ts
- Signup + player email: web/actions/signup.ts
`);
}

function supabaseHeaders(serviceKey) {
  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    Accept: "application/json",
    "Content-Type": "application/json",
    "Accept-Profile": "vbnym",
    "Content-Profile": "vbnym",
  };
}

async function supabaseGet(url, path, serviceKey) {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    headers: supabaseHeaders(serviceKey),
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  if (!res.ok) {
    throw new Error(`Supabase GET ${path}: ${res.status} ${JSON.stringify(data)}`);
  }
  return data;
}

async function supabasePost(url, path, serviceKey, body) {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    method: "POST",
    headers: {
      ...supabaseHeaders(serviceKey),
      Prefer: "return=representation",
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  if (!res.ok) {
    throw new Error(`Supabase POST ${path}: ${res.status} ${JSON.stringify(data)}`);
  }
  return data;
}

async function rpcBookedCount(url, serviceKey, gameId) {
  const res = await fetch(`${url}/rest/v1/rpc/signups_booked_count`, {
    method: "POST",
    headers: supabaseHeaders(serviceKey),
    body: JSON.stringify({ p_game_id: gameId }),
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  if (!res.ok) {
    throw new Error(`RPC signups_booked_count: ${res.status} ${JSON.stringify(data)}`);
  }
  return typeof data === "number" ? data : Number(data);
}

async function seedSignupAndEmailPlayer() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const secret = process.env.PAYMENT_CODE_SECRET?.trim();
  const resendKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL ?? "NYM Volleyball <nymvb@ednsy.com>";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";

  if (!supabaseUrl || !serviceKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  if (!secret) throw new Error("Missing PAYMENT_CODE_SECRET");
  if (!resendKey) throw new Error("Missing RESEND_API_KEY (needed to email the player)");

  const gameIdEnv = process.env.TEST_FLOW_GAME_ID?.trim();
  let game;
  if (gameIdEnv) {
    const rows = await supabaseGet(
      supabaseUrl,
      `games?id=eq.${gameIdEnv}&select=id,location,etransfer,cap,listed,price`,
      serviceKey
    );
    game = rows[0];
    if (!game) throw new Error(`No game for TEST_FLOW_GAME_ID=${gameIdEnv}`);
  } else {
    const rows = await supabaseGet(
      supabaseUrl,
      "games?listed=eq.true&select=id,location,etransfer,cap,listed,price&limit=1",
      serviceKey
    );
    game = rows[0];
    if (!game) throw new Error("No listed game found. Set TEST_FLOW_GAME_ID.");
  }

  if (game.listed === false) {
    throw new Error("Game is not listed");
  }

  const booked = await rpcBookedCount(supabaseUrl, serviceKey, game.id);
  if (booked >= game.cap) {
    throw new Error(`Game ${game.id} is full (booked ${booked}/${game.cap}). Pick another game.`);
  }

  const signupId = randomUUID();
  const email = DEFAULT_EMAIL.toLowerCase();
  const paymentCode = generatePaymentCode(game.id, signupId, email, secret);
  const paymentCodeExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  const inserted = await supabasePost(supabaseUrl, "signups", serviceKey, {
    id: signupId,
    game_id: game.id,
    name: DEFAULT_NAME,
    email,
    friends: [],
    paid: false,
    payment_code: paymentCode,
    payment_code_expires_at: paymentCodeExpiresAt,
    waiver_accepted: true,
  });

  const row = Array.isArray(inserted) ? inserted[0] : inserted;
  const gameUrl = new URL(`/games/${game.id}`, appUrl).toString();
  const price = Number(game.price ?? 0) || 0;
  const totalDue = Math.round(price * 100) / 100;

  const syncTestBody = `NYM payment sync test - code: ${paymentCode}`;
  const gmailPlayerUrl = gmailSignInAndComposeUrl({
    to: ADMIN_INBOX,
    subject: paymentCode,
    body: syncTestBody,
    loginHint: email,
  });
  const gmailComposeOnlyUrl = gmailComposeUrl({
    to: ADMIN_INBOX,
    subject: paymentCode,
    body: syncTestBody,
  });

  const html = `
    <div style="margin:0;padding:24px;background:#f8fafc;font-family:Arial,sans-serif;color:#131b2e">
      <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden">
        <div style="padding:18px 22px;background:#0f274f;color:#fff">
          <div style="font-size:18px;font-weight:700;">North York | Markham Volleyball</div>
          <div style="margin-top:3px;font-size:12px;opacity:0.85;letter-spacing:1px;text-transform:uppercase">Payment instructions (test)</div>
        </div>
        <div style="padding:24px 22px">
          <h2 style="margin:0 0 10px;font-size:22px">Complete your e-transfer</h2>
          <p style="margin:0 0 14px;color:#334155;font-size:14px;line-height:1.6">
            Hi ${DEFAULT_NAME}, you are registered for <strong>${game.location}</strong> (seeded test signup).
          </p>
          <p style="margin:0 0 6px;color:#475569;font-size:12px">Interac e-transfer recipient</p>
          <p style="margin:0 0 14px;font-size:14px;color:#0f274f;font-weight:700">${game.etransfer}</p>
          <p style="margin:0 0 6px;color:#475569;font-size:12px">Message (copy exactly)</p>
          <p style="margin:0 0 14px;font-size:16px;color:#0f274f;font-weight:700;font-family:monospace">${paymentCode}</p>
          <p style="margin:0 0 8px;color:#334155;font-size:14px">Total due: <strong>$${totalDue.toFixed(2)}</strong> (1 player)</p>
          <p style="margin:0 0 18px"><a href="${gameUrl}" style="display:inline-block;background:#0f274f;color:#fff;padding:11px 16px;border-radius:999px;text-decoration:none;font-weight:700;font-size:14px">View game details</a></p>
          <div style="margin-top:20px;padding:16px;background:#f1f5f9;border-radius:12px;border:1px solid #e2e8f0">
            <p style="margin:0 0 10px;font-size:13px;color:#334155;line-height:1.55">
              <strong>Payment sync test</strong> — send mail <strong>from this Gmail account</strong> to <strong>${ADMIN_INBOX}</strong> with the code in the subject so the app can mark you paid.
            </p>
            <a href="${gmailPlayerUrl}" style="display:inline-block;background:#1a73e8;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;margin-right:8px;margin-bottom:8px">Sign in to Gmail &amp; open compose</a>
            <a href="${gmailComposeOnlyUrl}" style="display:inline-block;background:#fff;color:#1a73e8;padding:11px 18px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;border:2px solid #1a73e8">Compose only (already signed in)</a>
          </div>
        </div>
      </div>
    </div>
  `;

  const mailRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: `NYM Volleyball — pay for ${game.location} (test)`,
      html,
    }),
  });
  const mailPayload = await mailRes.json();
  if (!mailRes.ok || mailPayload.error) {
    throw new Error(mailPayload.error?.message ?? JSON.stringify(mailPayload));
  }

  console.log(`
=== Seeded test signup ===
  signup id:     ${row.id}
  game:          ${game.location} (${game.id})
  player:        ${DEFAULT_NAME} <${email}>
  payment_code:  ${paymentCode}
  Resend mail id: ${mailPayload.id}

=== Next: satisfy Gmail sync (manual) ===
Connected admin Gmail must receive a message in the last 30 days that:
  1) Matches Gmail search containing "NYM-" (your code does), and
  2) Has Subject or Snippet containing exactly: ${paymentCode}
  3) From header parses to: ${email}

Open Gmail (sign in as player, then compose to admin with code in subject):
  ${gmailPlayerUrl}

If already signed in as ${email}, compose only:
  ${gmailComposeOnlyUrl}

Then run this script with --sync (dev server running, Gmail OAuth connected on admin).

Interac-only path: will NOT match unless From equals the player (usually false).
`);
}

async function runPaymentSync() {
  const endpoint =
    process.env.PAYMENT_SYNC_ENDPOINT?.trim() ||
    "http://localhost:3000/api/admin/payments/sync";
  const token = process.env.PAYMENT_SYNC_CRON_TOKEN?.trim();
  if (!token) {
    throw new Error("Missing PAYMENT_SYNC_CRON_TOKEN");
  }
  console.log(`POST ${endpoint} …`);
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
  if (!res.ok) process.exit(1);
}

const argv = process.argv.slice(2);
const wantSeed = argv.includes("--seed");
const wantSync = argv.includes("--sync");

printVerification();

if (!wantSeed && !wantSync) {
  console.log("Tip: add --seed to create a signup + email player, --sync to call payment sync, or both.\n");
  process.exit(0);
}

try {
  if (wantSeed) await seedSignupAndEmailPlayer();
  if (wantSync) await runPaymentSync();
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
}
