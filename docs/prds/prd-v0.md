# NYM Volleyball — Product Requirements Document

**Product:** NYM Drop-in Volleyball Signup App  
**Version:** 2.1 — Production + Auto-Pay Verification  
**Stack:** Next.js (App Router), shadcn/ui, Supabase, Vercel  
**Sprint:** 2 engineering days (16 hours)  
**Status:** Draft  
**Last updated:** April 13, 2026  
**Supersedes:** v2.0 (stack-agnostic draft)

---

## Changelog

| Change | Detail |
|--------|--------|
| v2.1 | **Stack:** Next.js App Router + shadcn/ui (Tailwind, Radix). Env: `NEXT_PUBLIC_*` for browser-safe keys. APIs: App Router `route.ts` handlers. **UI:** Mocks in `docs/prds/assets/` — canonical list `ui-reference-list-view.png` (§12.2); see `prd-mock-design.md` §6.1 for `screen*.png` inventory. |
| v2.0 | Encrypted payment code per signup; Gmail OAuth; auto-mark-paid; Vercel cron; `admin_settings` schema; security section expanded |
| v1.0 | Client-only prototype |

---

## 1. Problem Statement

### Original prototype
Client-side only: no persistence, no real auth, no email, no deployment.

### After persistence (still painful)
Even with persistence, the organizer has to manually check every e-transfer and manually mark each player as paid. At 3–4 runs per week, 10–16 players per run, that's 30–60 manual updates weekly — error-prone and time-consuming.

**The core insight:** Interac sends the organizer an email notification for every e-transfer received. That email contains the sender's message/memo. If every player puts a unique, verifiable code in their e-transfer message, the system can read those emails and mark payments automatically.

---

## 2. Solution Overview

```
Player signs up
    │
    ▼
System generates a unique encrypted code
e.g.  NYM-X4K2-P9R7
    │
    ▼
Player receives confirmation email with code
"Send $15 to volley@nymvb.ca — message: NYM-X4K2-P9R7"
    │
    ▼
Player sends Interac e-transfer with code in message field
    │
    ▼
Interac notifies organizer's Gmail:
"You received $15.00 — Message: NYM-X4K2-P9R7"
    │
    ▼
System polls Gmail (every 15 min via cron OR on-demand)
Gmail API searches organizer's inbox for payment codes
    │
    ▼
Code found in email → signup marked paid automatically
Admin sees live "paid" status in dashboard
```

---

## 3. Goals

| # | Goal | Day |
|---|------|-----|
| G1 | Persistent data across sessions and users | 1 |
| G2 | Real admin authentication | 1 |
| G3 | Confirmation email with encrypted payment code | 1 |
| G4 | Deployed to production URL | 1 |
| G5 | Organizer connects Gmail via OAuth (one-time setup) | 2 |
| G6 | System scans Gmail and auto-marks signups as paid | 2 |
| G7 | Admin can trigger manual sync + see last-synced time | 2 |

---

## 4. Non-Goals (v2)

- Real payment processing (Stripe, Square) — the app facilitates e-transfer, not card payment
- Reading player email inboxes — only organizer's Gmail is accessed
- Detecting fraud or disputed transfers
- Supporting payment methods other than Interac e-transfer
- Automatic refunds

---

## 5. Users

### Player
Sees a run, signs up, gets a code, sends an e-transfer with the code in the message, and their dashboard spot shows "paid" automatically within 15 minutes. No login required. No manual follow-up.

### Organizer / Admin
Sets up Gmail OAuth once. From that point, incoming e-transfers are auto-matched to signups. Can still manually mark/unmark paid. Can trigger an immediate sync instead of waiting for cron.

---

## 6. Payment Code System

### 6.1 Code Design Goals

- Unique per signup (not per run — two players at the same run need different codes)
- Short enough to type into an e-transfer message field (< 16 chars)
- Human-readable — no ambiguous chars (0/O, 1/I/l)
- Cryptographically verifiable — system can confirm a code is legitimate
- Opaque — seeing one code reveals nothing about the system or other codes

### 6.2 Code Format

```
NYM - XXXX - XXXX
```

**Examples:** `NYM-A3K9-7X2M` · `NYM-QR4V-H8NJ` · `NYM-Z6PB-3CWS`

- Prefix `NYM-` makes codes immediately identifiable in email search
- 8 alphanumeric characters (base32 alphabet, no O/0/I/1)
- Total visible length: 13 characters — fits comfortably in Interac message field (140 char limit)

### 6.3 Code Generation (Server-side only)

```typescript
// app/lib/payment-code.ts — used from Route Handlers (Node.js runtime for crypto)
import crypto from "node:crypto";

// Base32 alphabet — excludes 0, 1, I, O to avoid confusion
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function toBase32(buffer: Buffer, length: number): string {
  let result = "";
  let bits = 0, value = 0;
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

export function generatePaymentCode(runId: string, signupId: string, email: string) {
  // Payload: deterministic, unique per signup
  const payload = `${runId}:${signupId}:${email.toLowerCase()}`;

  // HMAC-SHA256 with server secret — only server can verify
  const hmac = crypto.createHmac("sha256", process.env.PAYMENT_CODE_SECRET);
  hmac.update(payload);
  const hash = hmac.digest();

  // Take first 5 bytes → 8 base32 chars
  const code = toBase32(hash.slice(0, 5), 8);
  return `NYM-${code.slice(0, 4)}-${code.slice(4, 8)}`;
}

export function verifyPaymentCode(code: string, runId: string, signupId: string, email: string) {
  const expected = generatePaymentCode(runId, signupId, email);
  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(code.replace(/-/g, "")),
    Buffer.from(expected.replace(/-/g, ""))
  );
}
```

**Implementation:** Prefer **Node.js** `runtime` on Route Handlers that import this module (`node:crypto` / `Buffer`). Edge requires a Web Crypto–based rewrite.

**Properties:**
- Deterministic — same inputs always produce same code (no nonce needed)
- Cannot be brute-forced without the secret key
- ~10³⁸ possible values per 8-char base32 string
- Server can re-derive and verify any code from the signup record

### 6.4 Code Storage

Store the generated code in the `signups` table at insert time. This allows:
- Gmail scan to look up which signup a found code belongs to
- Admin dashboard to display code for manual reference
- Verification without re-deriving (faster lookups)

```sql
-- Added to signups table
payment_code        text unique not null,   -- e.g. "NYM-X4K2-P9R7"
payment_verified_at timestamptz,            -- null = unpaid, set = auto-verified
payment_email_id    text                    -- Gmail message ID where code was found
```

---

## 7. Gmail OAuth Integration

### 7.1 Overview

The organizer authenticates with Google once to grant read-only Gmail access. The app stores a refresh token. From that point, the system uses the Gmail API to search for e-transfer notification emails containing payment codes.

**Scope requested:** `https://www.googleapis.com/auth/gmail.readonly`  
This is the minimum scope. The app cannot send, modify, or delete any emails.

### 7.2 OAuth Flow

```
Admin clicks "Connect Gmail"
    │
    ▼
Browser redirected to Google OAuth consent screen
google.com/oauth?scope=gmail.readonly&redirect_uri=[app]/api/gmail/callback
    │
    ▼
Organizer sees: "NYM Volleyball wants to read your Gmail"
Organizer clicks Allow
    │
    ▼
Google redirects to [app]/api/gmail/callback?code=AUTH_CODE
    │
    ▼
Server exchanges auth code for tokens:
POST https://oauth2.googleapis.com/token
→ { access_token, refresh_token, expires_in }
    │
    ▼
Refresh token stored encrypted in admin_settings table
Access token cached in memory (or Supabase with expiry)
    │
    ▼
Admin dashboard shows "Gmail connected ✓ — youremail@gmail.com"
```

### 7.3 Token Management

```typescript
// app/lib/gmail-auth.ts

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

// Refresh an expired access token using stored refresh token
export async function getAccessToken(refreshToken) {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id:     process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type:    "refresh_token",
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error("Token refresh failed");
  return data.access_token;  // Valid for 1 hour
}
```

**Refresh token lifecycle:**
- Stored encrypted (AES-256) in `admin_settings.gmail_refresh_token`
- Never expires unless organizer revokes access in Google Account settings
- Regenerated if organizer clicks "Reconnect Gmail"

### 7.4 OAuth & Gmail Routes (App Router)

Implement as Route Handlers under `app/api/.../route.ts`. URLs below are the public paths.

| Path | Method | Description |
|------|--------|-------------|
| `/api/gmail/connect` | GET | Redirect to Google OAuth consent |
| `/api/gmail/callback` | GET | OAuth redirect; exchange code; store tokens |
| `/api/gmail/status` | GET | Connection status + connected email |
| `/api/gmail/disconnect` | POST | Delete stored tokens |
| `/api/gmail/sync` | POST | Immediate payment scan (admin only) |
| `/api/gmail/sync-cron` | GET | Cron-only sync (`Authorization: Bearer CRON_SECRET`) |

---

## 8. Auto-Mark-Paid Flow

### 8.1 Gmail Search Strategy

Interac e-transfer notifications arrive at the organizer's Gmail from bank notification systems. The message the player typed appears in the email body.

**Primary search query:**
```
"NYM-" in:inbox
```

This searches the organizer's inbox for any email containing `NYM-` — which will match all payment codes (`NYM-XXXX-XXXX`). Simple, reliable, not dependent on Interac's changing email formatting.

**Why this works:**
- The `NYM-` prefix is specific enough to avoid false positives
- Interac emails containing the memo text will match
- Works regardless of which bank sends the notification

**Fallback — search by specific code:**
```
"NYM-X4K2-P9R7" in:anywhere
```

Used when verifying a specific signup rather than scanning all.

### 8.2 Payment Sync Algorithm

```typescript
// app/api/gmail/sync/route.ts — Route Handler (admin only, Node.js runtime if using node:crypto)

export async function syncPayments(supabase, accessToken) {
  const results = { matched: 0, skipped: 0, errors: [] };

  // 1. Fetch all unpaid signups with payment codes
  const { data: unpaidSignups } = await supabase
    .from("signups")
    .select("id, run_id, payment_code, name, email")
    .eq("paid", false)
    .not("payment_code", "is", null);

  if (!unpaidSignups?.length) return results;

  // 2. Search Gmail for emails containing any NYM- code
  const searchRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages` +
    `?q=${encodeURIComponent('"NYM-" in:inbox')}&maxResults=50`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const { messages = [] } = await searchRes.json();

  if (!messages.length) return results;

  // 3. For each email found, fetch body and look for codes
  for (const msg of messages) {
    const detail = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const email = await detail.json();

    // Extract plain text body
    const body = extractEmailBody(email);

    // 4. Check which unpaid signup codes appear in this email
    for (const signup of unpaidSignups) {
      if (body.includes(signup.payment_code)) {
        // 5. Mark as paid in Supabase
        await supabase
          .from("signups")
          .update({
            paid:               true,
            payment_verified_at: new Date().toISOString(),
            payment_email_id:   msg.id,
          })
          .eq("id", signup.id);

        results.matched++;
        // Remove from unpaid list to avoid re-processing
        unpaidSignups.splice(unpaidSignups.indexOf(signup), 1);
      }
    }
  }

  // 6. Update last_synced_at in admin_settings
  await supabase
    .from("admin_settings")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("id", 1);

  return results;
}

function extractEmailBody(email) {
  // Handle multipart MIME — prefer text/plain
  const parts = email.payload?.parts || [email.payload];
  for (const part of parts) {
    if (part.mimeType === "text/plain" && part.body?.data) {
      return Buffer.from(part.body.data, "base64").toString("utf-8");
    }
  }
  // Fallback: decode entire body
  if (email.payload?.body?.data) {
    return Buffer.from(email.payload.body.data, "base64").toString("utf-8");
  }
  return "";
}
```

### 8.3 Scheduled Sync (Vercel Cron)

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/gmail/sync-cron",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

```typescript
// app/api/gmail/sync-cron/route.ts
// Called every 15 minutes by Vercel Cron → GET this route

import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data: settings } = await supabase
    .from("admin_settings").select("*").eq("id", 1).single();

  if (!settings?.gmail_refresh_token) return new Response("No Gmail connected");

  const accessToken = await getAccessToken(decrypt(settings.gmail_refresh_token));
  const results = await syncPayments(supabase, accessToken);

  return Response.json(results);
}
```

**Cron schedule options:**

| Frequency | Vercel plan | Latency to auto-pay |
|-----------|-------------|---------------------|
| Every 15 min | Free | ≤ 15 min |
| Every 5 min | Pro ($20/mo) | ≤ 5 min |
| Every 1 min | Pro | ≤ 1 min |

**Recommendation:** Start with 15 min on free plan. Upgrade if organizer wants near-instant verification.

Vercel Cron calls the `path` with **GET**; implement `export async function GET` on `sync-cron/route.ts` and validate `Authorization: Bearer ${CRON_SECRET}`.

---

## 9. Admin Dashboard Changes

Build admin surfaces with **shadcn/ui** (see section 12.1): settings as `Tabs` or nested `Card`, actions as `Button`, connection state as `Badge`.

### 9.1 Gmail Connection Panel

New section in admin dashboard under a "Settings" tab:

```
┌─────────────────────────────────────────────────────────┐
│ 💳 Auto-Pay via Gmail                                   │
│                                                         │
│ ● Connected — payments@gmail.com                        │
│ Last synced: 3 minutes ago (found 2 payments)           │
│                                                         │
│ [ Sync now ]   [ Disconnect Gmail ]                     │
└─────────────────────────────────────────────────────────┘
```

When not connected:

```
┌─────────────────────────────────────────────────────────┐
│ 💳 Auto-Pay via Gmail                      (not set up) │
│                                                         │
│ Connect your Gmail to automatically mark players paid   │
│ when their e-transfer arrives. Read-only access.        │
│                                                         │
│ [ Connect Gmail → ]                                     │
└─────────────────────────────────────────────────────────┘
```

### 9.2 Payment Code Column in Signup List

Each signup row in admin view shows the payment code:

```
Alex Chen      alex@email.com      NYM-X4K2-P9R7    ● paid (auto)   [unmark]
Jordan Lee     jordan@email.com    NYM-QR4V-H8NJ    ○ unpaid        [mark paid]
```

"auto" badge = paid via Gmail sync (not manually marked)

### 9.3 Sync Status Indicator

Dashboard header shows sync health:

```
Runs: 3  ·  Players: 9  ·  Paid: 6  ·  Gmail: syncing every 15 min  ·  [ Sync now ]
```

---

## 10. Data Schema (Complete — v2)

```sql
-- ── Runs ────────────────────────────────────────────────
create table runs (
  id           uuid primary key default gen_random_uuid(),
  location     text not null,
  address      text,
  lat          float,
  lng          float,
  date         date not null,
  time         text not null,
  cap          integer not null check (cap >= 2),
  price        numeric(6,2) not null,
  etransfer    text not null,
  created_at   timestamptz default now()
);

-- ── Signups ─────────────────────────────────────────────
create table signups (
  id                   uuid primary key default gen_random_uuid(),
  run_id               uuid references runs(id) on delete cascade,
  name                 text not null,
  email                text not null,
  paid                 boolean default false,
  friends              text[] default '{}',
  payment_code         text unique not null,   -- e.g. "NYM-X4K2-P9R7"
  payment_verified_at  timestamptz,            -- null = not yet paid
  payment_email_id     text,                   -- Gmail message ID (for audit)
  created_at           timestamptz default now()
);

create index on signups(run_id);
create index on signups(payment_code);
create index on signups(paid) where paid = false;  -- fast unpaid lookup

-- ── Admin settings (singleton row) ─────────────────────
create table admin_settings (
  id                    int primary key default 1,
  gmail_refresh_token   text,          -- AES-256 encrypted
  gmail_connected_email text,
  gmail_connected_at    timestamptz,
  last_synced_at        timestamptz,
  last_sync_matched     int default 0  -- payments found in last sync
);

-- Seed singleton
insert into admin_settings (id) values (1) on conflict do nothing;
```

### Row-Level Security

```sql
-- Runs: public read, admin write
alter table runs enable row level security;
create policy "public read runs"   on runs for select using (true);
create policy "admin write runs"   on runs for all    using (auth.role() = 'authenticated');

-- Signups: public read+insert (to sign up), admin can update
alter table signups enable row level security;
create policy "public read signups"    on signups for select using (true);
create policy "public insert signups"  on signups for insert with check (true);
create policy "admin update signups"   on signups for update using (auth.role() = 'authenticated');
create policy "admin delete signups"   on signups for delete using (auth.role() = 'authenticated');

-- Admin settings: admin only (contains OAuth token)
alter table admin_settings enable row level security;
create policy "admin only settings"    on admin_settings for all using (auth.role() = 'authenticated');
```

---

## 11. Email Templates

### 11.1 Player Confirmation (Resend)

```
Subject: You're in — [Location] on [Weekday, Month Day]

Hey [First Name],

Your spot is locked. Here's everything you need:

  📍 [Location]
  🗓  [Weekday], [Month Day] at [Time]
  👥 [N] player(s) — [Name] + [Friend1, Friend2]
  💰 $[Total] due


HOW TO PAY
──────────────────────────────────────────
E-transfer $[Total] to:
  [etransfer@email.com]

Use this EXACT code as your message:
  NYM-XXXX-XXXX          ← tap to copy

Your spot is auto-confirmed once payment arrives.
No need to reply or follow up.
──────────────────────────────────────────

See you on the court,
NYM Volleyball
```

### 11.2 Admin Notification (Resend — on each signup)

```
Subject: New signup · [Run ID] · [Location] [Date]

[Name] signed up

Run:    [Location] — [Date] at [Time]
Code:   NYM-XXXX-XXXX
Group:  [Name] [+ Friend1, Friend2 if any]
Email:  [email]
Due:    $[Total]
Spots:  [remaining] left
```

---

## 12. Technical Architecture

### 12.1 Front-end (Next.js App Router + shadcn/ui)

| Layer | Choice | Notes |
|-------|--------|--------|
| Framework | **Next.js** (App Router) | `app/` routes, layouts, loading/error UI, metadata |
| UI kit | **shadcn/ui** | Tailwind CSS, Radix primitives — components live in `components/ui/` |
| Patterns | Server Components by default | `"use client"` for maps, rich interactions, OAuth redirect triggers |

**shadcn/ui (indicative):** `Button`, `Input`, `Label`, `Card`, `Table`, `Badge`, `Dialog` / `Sheet` (mobile panels), `Tabs` (list vs map), `Toast` (e.g. Sonner) for sync feedback, `DropdownMenu` for admin row actions. One design system; avoid mixing unrelated UI kits.

### 12.2 UI reference — player list (mockup)

High-fidelity target for the **public runs** experience (list view). File in repo:

`docs/prds/assets/ui-reference-list-view.png`

![NYM volleyball — list view mockup: header, list/map toggle, event cards](assets/ui-reference-list-view.png)

**Layout**

| Region | Spec |
|--------|------|
| Top bar | Dark navy (`~slate-900` / `~blue-950`): shield + wordmark “NYM” / “volleyball”; trailing **admin** `Button` (outline/sm, rounded). |
| Sub-bar | Light surface: **List \| Map** toggle (active segment = navy fill + white label); right: calendar icon + “N upcoming” copy. |
| Page | Soft blue-grey page background (`~slate-50`); scrollable **event cards**. |

**Event card (`Card`)**

| Element | Spec |
|---------|------|
| Shell | White `Card`, `rounded-xl`, light border or shadow. |
| Date block | Left column: navy square, weekday + large day + month. |
| Title row | Location name, semibold. |
| Meta row | Icons + text: `Clock` time, `DollarSign` price/person, `MapPin` address. |
| Spots | Top-right pill `Badge` (green border): “N left”. |
| Capacity | `Progress` (green fill); right: `Users` + “current/total” (e.g. `3/12`). |
| Who’s in | Row of `Badge`s: avatar initials + name; optional “+1”; **open** slots = dashed border + `UserPlus` + “open”. Empty state: “be the first to join.” |
| CTA | Full-width navy `Button`: “join this game” + `UserPlus`. |

**Icons:** Lucide (default with shadcn). **Typography:** Inter or Geist. **Map view:** same chrome; map body is out of scope for this still — match colors and toggles.

**Process for new mocks:** See [prd-mock-design.md](./prd-mock-design.md) (deliverables, naming, screen inventory, handoff).

**Additional mocks (same folder):** `screen.png`, `screen-2.png`, … `screen-5.png` — exploratory / future-screen references. Inventory and product mapping: [prd-mock-design.md](./prd-mock-design.md) section **6.1**.

### 12.3 System diagram

```
┌─────────────────────────────────────────────────────────────┐
│     Browser — Next.js (React, App Router) + shadcn/ui        │
│     Player: runs, signup, map · Admin: CRUD, Gmail, sync   │
└───────────────┬────────────────────────────────────────────┘
                │ Supabase client (@supabase/ssr + cookies)
┌───────────────▼────────────────────────────────────────────┐
│           Supabase — Postgres, Auth, RLS                    │
│           Webhook → POST /api/notify on signup insert       │
└───────────────┬────────────────────────────────────────────┘
                │
┌───────────────▼────────────────────────────────────────────┐
│   Vercel — Next.js Route Handlers + Cron                    │
│   app/api/notify, app/api/gmail/*                           │
│   Node.js runtime where node:crypto / Buffer is required    │
└───────────────┬────────────────────────────────────────────┘
                │
┌───────────────▼────────────────────────────────────────────┐
│   Resend · Google OAuth / Gmail API · map library + tiles   │
└─────────────────────────────────────────────────────────────┘
```

---

## 13. Environment Variables

```env
# ── Supabase ───────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...     # Browser + server (respect RLS)
SUPABASE_SERVICE_ROLE_KEY=eyJ...         # Server Route Handlers ONLY

# ── Google OAuth ───────────────────────────────────────────
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxx
GOOGLE_REDIRECT_URI=https://[app-domain]/api/gmail/callback

# ── Email ──────────────────────────────────────────────────
RESEND_API_KEY=re_xxxx
EMAIL_FROM=NYM Volleyball <noreply@nymvb.ca>
ADMIN_NOTIFY_EMAIL=volley@nymvb.ca

# ── Security ───────────────────────────────────────────────
PAYMENT_CODE_SECRET=<32-byte random hex>   # openssl rand -hex 32
TOKEN_ENCRYPTION_KEY=<32-byte random hex>  # Gmail refresh token at rest
CRON_SECRET=<random string>                # Vercel cron Authorization header

# ── App ────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=https://nymvolleyball.vercel.app
```

**Generating secrets:**
```bash
openssl rand -hex 32   # for PAYMENT_CODE_SECRET and TOKEN_ENCRYPTION_KEY
openssl rand -base64 24  # for CRON_SECRET
```

---

## 14. Security Considerations

### 14.1 Payment Code Security

| Threat | Mitigation |
|--------|-----------|
| Attacker guesses a valid code | 32⁸ = 1 trillion combinations; code is also bound to specific run+signup |
| Attacker generates codes offline | Requires `PAYMENT_CODE_SECRET` which is never exposed to browser |
| Attacker replays a used code | `payment_verified_at` set on first match; duplicate matches ignored |
| Attacker polls `verifyPaymentCode` endpoint | Rate-limit endpoint; no public verify endpoint exists anyway |
| Timing attack on code comparison | `crypto.timingSafeEqual()` used in all comparisons |

### 14.2 Gmail OAuth Security

| Threat | Mitigation |
|--------|-----------|
| Refresh token exposed in DB | Encrypted with AES-256 using `TOKEN_ENCRYPTION_KEY` before storage |
| Refresh token leaked via Supabase | `admin_settings` table has RLS — only authenticated admin can read |
| Broad Gmail access granted | Only `gmail.readonly` scope — cannot send, modify, or delete emails |
| Cron endpoint called by attacker | `CRON_SECRET` header required; Vercel validates this automatically |
| Access token cached insecurely | Not persisted; refreshed per-request in Route Handlers |
| Organizer's Gmail compromised | Scope is read-only; worst case: attacker sees payment notifications, not email content |

### 14.3 Supabase RLS Validation Checklist

Before go-live, verify each of these manually using a non-authenticated Supabase client:

```javascript
// These should SUCCEED (public access)
await supabase.from("runs").select("*")              // ✓ public read
await supabase.from("signups").select("*")           // ✓ public read
await supabase.from("signups").insert({ ... })       // ✓ public insert

// These should FAIL with RLS error
await supabase.from("runs").insert({ ... })          // ✗ requires auth
await supabase.from("runs").delete().eq("id", x)     // ✗ requires auth
await supabase.from("signups").update({ paid:true }) // ✗ requires auth
await supabase.from("admin_settings").select("*")    // ✗ requires auth — protects OAuth token
```

---

## 15. API Reference

### POST `/api/notify` (`app/api/notify/route.ts`)

Called by Supabase webhook on `signups` INSERT.

```
Body: { type: "INSERT", record: { id, run_id, name, email, friends } }

Actions:
  1. Generate payment_code from (run_id, signup_id, email)
  2. Update signups.payment_code = code
  3. Fetch run details (price, etransfer, date, etc.)
  4. Send confirmation email to player via Resend
  5. Send notification email to admin via Resend

Response: 200 OK
```

### GET `/api/gmail/connect`
Initiates Google OAuth flow. Admin only (validated by session cookie).

```
Redirects to:
  https://accounts.google.com/o/oauth2/v2/auth
    ?client_id=...
    &redirect_uri=.../api/gmail/callback
    &scope=https://www.googleapis.com/auth/gmail.readonly
    &access_type=offline
    &prompt=consent
    &state=[csrf token]
```

### GET `/api/gmail/callback`
Handles Google OAuth redirect.

```
Params: ?code=AUTH_CODE&state=CSRF_TOKEN

Actions:
  1. Validate CSRF state
  2. Exchange code for { access_token, refresh_token }
  3. Fetch organizer Gmail address from Google userinfo
  4. Encrypt refresh_token with TOKEN_ENCRYPTION_KEY
  5. Upsert admin_settings: { gmail_refresh_token, gmail_connected_email }
  6. Redirect to admin dashboard with ?gmail=connected
```

### POST `/api/gmail/sync`
Triggers immediate payment scan. Admin session required.

```
Actions:
  1. Validate admin session (Supabase auth cookie)
  2. Fetch encrypted refresh_token from admin_settings
  3. Decrypt + exchange for access_token
  4. Run syncPayments algorithm (section 8.2)
  5. Return { matched, skipped, last_synced_at }
```

### GET `/api/gmail/sync-cron`
Called by Vercel every 15 minutes. Requires `CRON_SECRET` header.

```
Headers: Authorization: Bearer [CRON_SECRET]

Same as /api/gmail/sync but without admin session validation.
Returns 200 with sync results or 401 if secret invalid.
```

---

## 16. User Stories

### P0 — Day 1 (blocks go-live)

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| US-01 | Signup persists across refresh | Row exists in DB; visible to all |
| US-02 | Player receives confirmation with payment code | Email in < 60s; code visible + copyable |
| US-03 | Admin logs in with real credentials | Supabase Auth; wrong credentials fail |
| US-04 | Admin creates/deletes runs | Persists to DB; reflected immediately |
| US-05 | Admin marks paid manually (fallback) | Survives Gmail outage |
| US-06 | App live at real URL | Vercel deploy; works on mobile |

### P0 — Day 2 (core payment automation)

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| US-07 | Admin connects Gmail via OAuth | One-time flow; stores token securely |
| US-08 | Signups auto-marked paid when code found in Gmail | ≤ 15 min after e-transfer sent |
| US-09 | Admin can trigger immediate sync | Button in dashboard; returns results in < 10s |
| US-10 | Admin sees last sync time and match count | Dashboard header |
| US-11 | Payment code shown per signup in admin view | Visible in expanded signup row |

### P1 — Ship if ahead of schedule

| ID | Story |
|----|-------|
| US-12 | Admin notification email on each new signup |
| US-13 | Map tab persists (no remount on tab switch) |
| US-14 | Supabase Realtime — live player count without refresh |

### P2 — Post-launch

| ID | Story |
|----|-------|
| US-15 | Waitlist — notify on cancellation |
| US-16 | Player can cancel via signed email link |
| US-17 | Recurring run templates |
| US-18 | Sync frequency configurable by admin |

---

## 17. Hour-by-Hour Sprint Plan

### Day 1 — Foundation (8 hours)

| Time | Task | Done when |
|------|------|-----------|
| 0:00–1:00 | Supabase: project, schema, RLS, seed data, admin user | Tables exist, RLS passes checklist |
| 1:00–2:00 | Data layer: Supabase from Server Components / server actions or client hooks | Refresh shows same data |
| 2:00–3:00 | Supabase Auth — replace fake password with real login | Session persists |
| 3:00–4:00 | `app/api/notify` — code generation + Resend email | Signup → email in inbox < 60s |
| 4:00–5:00 | Next.js + shadcn init, env vars, first Vercel deploy | Live URL; UI uses design system |
| 5:00–6:00 | Mobile QA + bug fixes | Full flow works on iOS Safari |
| 6:00–7:00 | End-to-end QA checklist (see section 18) | 0 P0 bugs |
| 7:00–8:00 | Deploy Day 1 to production | Smoke tests pass |

### Day 2 — Payment Automation (8 hours)

| Time | Task | Done when |
|------|------|-----------|
| 0:00–1:00 | Google Cloud Console: OAuth app, credentials, redirect URIs | Client ID + secret in hand |
| 1:00–2:00 | `app/api/gmail/connect` + `callback/route.ts` | Admin can complete OAuth flow |
| 2:00–3:00 | Token encryption at rest, store in admin_settings | Refresh token in DB, encrypted |
| 3:00–4:00 | Gmail API — inbox search + email body parsing | Can find test code in Gmail |
| 4:00–5:00 | `app/api/gmail/sync/route.ts` — full `syncPayments` flow | Unpaid → paid after code found |
| 5:00–6:00 | `vercel.json` cron → `app/api/gmail/sync-cron/route.ts` (GET + secret) | Cron fires every 15 min |
| 6:00–7:00 | Admin UI (shadcn): Gmail panel, sync button, code column | UI reflects connection state |
| 7:00–8:00 | End-to-end test: signup → e-transfer → auto-marked paid | Full flow confirmed |

---

## 18. QA Checklist

### Day 1 Checklist

**Player flow:**
- [ ] Browse runs — list and map both show correct data
- [ ] Sign up solo — confirmation email received with payment code
- [ ] Sign up with 2 friends — email shows group of 3, total price correct
- [ ] Attempt to sign up when run is full — blocked with clear error
- [ ] Refresh page — signup persists, player appears in list
- [ ] Open same URL in different browser — same data visible

**Admin flow:**
- [ ] Login with wrong password — error shown
- [ ] Login with correct credentials — session persists on refresh
- [ ] Create a new run — appears in list immediately
- [ ] Delete a run — removed, no orphan signups
- [ ] Mark signup as paid manually — persists in DB
- [ ] Unmark paid — reverts correctly

**Mobile:**
- [ ] iOS Safari — signup form fills correctly
- [ ] Map pins are tappable — slide panel opens
- [ ] Panel close button works
- [ ] Email confirmation readable on mobile

### Day 2 Checklist

**Gmail OAuth:**
- [ ] "Connect Gmail" button redirects to Google consent screen
- [ ] OAuth shows correct scope (read-only)
- [ ] After consent, redirected back to admin dashboard
- [ ] Dashboard shows "Connected — [email]"
- [ ] Disconnect clears stored token
- [ ] Reconnect works after disconnect

**Payment sync:**
- [ ] Generate a test signup — note the payment code
- [ ] Send real Interac e-transfer with code in message field
- [ ] Wait for Interac email to arrive in Gmail (usually < 5 min)
- [ ] Click "Sync now" — signup shows as paid
- [ ] Verify `payment_verified_at` and `payment_email_id` populated in DB
- [ ] Cron fires at :00, :15, :30, :45 — check Vercel logs
- [ ] Test with group signup (1 payer, 2 friends) — all marked paid
- [ ] Test with wrong/fake code in Gmail — no false positives

**Security:**
- [ ] Unauthenticated POST to `/api/gmail/sync` returns 401
- [ ] GET `/api/gmail/sync-cron` without CRON_SECRET returns 401
- [ ] `admin_settings` unreadable without auth session
- [ ] `signups.paid` unmodifiable without auth session

---

## 19. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Interac email body format varies by bank | Medium | High | Search for code string only (`NYM-XXXX-XXXX`), not sender/subject. Works regardless of bank. |
| Player miscopies code in e-transfer | Medium | Low | Admin can still mark paid manually. Code is copyable from confirmation email. |
| Gmail OAuth consent screen requires app verification | Low | High | `gmail.readonly` is a sensitive scope — Google may require verification for >100 users. **Mitigate:** App verification takes 1–5 days; start process in parallel with dev. |
| Refresh token expires unexpectedly | Low | Medium | Token never expires unless revoked. Detect `invalid_grant` error, prompt reconnect. |
| `PAYMENT_CODE_SECRET` rotation breaks existing codes | Low | High | Never rotate secret in production. If rotated, all unverified codes become invalid. Document this clearly. |
| Supabase webhook delivery failure | Low | Medium | Add retry logic in webhook handler. Supabase retries webhooks 3x by default. |
| RLS misconfiguration exposes OAuth token | Medium | High | `admin_settings` restricted to authenticated users. Run RLS checklist before go-live. |
| Cron job silently fails | Low | Medium | Log results to Supabase `sync_logs` table. Alert if no successful sync in 30 min. |
| False positive — code appears in unrelated email | Very Low | Medium | Code has 32⁸ search space. Also: code only matches if a corresponding unpaid signup exists. |

---

## 20. Google OAuth App Setup Checklist

Before Day 2 begins, complete these in Google Cloud Console:

```
1. Create new project (or use existing)
   console.cloud.google.com → New Project → "NYM Volleyball"

2. Enable Gmail API
   APIs & Services → Enable APIs → search "Gmail API" → Enable

3. Configure OAuth consent screen
   → External (for any Google account)
   → App name: NYM Volleyball
   → Support email: volley@nymvb.ca
   → Scopes: gmail.readonly
   → Test users: [organizer Gmail address]  ← CRITICAL for unverified apps
      (unverified apps can only be used by listed test users)

4. Create OAuth credentials
   Credentials → Create Credentials → OAuth 2.0 Client ID
   → Application type: Web application
   → Authorized redirect URIs:
       https://[app-domain]/api/gmail/callback
       http://localhost:3000/api/gmail/callback (for local dev)

5. Copy Client ID + Client Secret to env vars
```

**Note on app verification:**  
Google requires verification for apps using sensitive scopes (`gmail.readonly`) that are accessible to the public. For an organizer-only internal tool with ≤ 100 users, **test user mode** is sufficient indefinitely. Add the organizer's Gmail to test users and verification is not needed.

---

## 21. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Data persistence | 100% — no loss on refresh | Manual test |
| Payment auto-detection rate | > 90% of e-transfers auto-matched | `signups` table: `payment_verified_at not null` / total paid |
| Time from e-transfer to auto-paid | ≤ 15 min (depends on cron) | Timestamp delta: Interac email received → `payment_verified_at` |
| False positive rate | 0% | No paid = false where player didn't actually pay |
| Manual override preserved | 100% | Admin can always manually mark/unmark paid |
| Confirmation email delivery | > 95% | Resend dashboard |
| Gmail OAuth setup time | < 5 min for organizer | Time the flow end-to-end |
| Page load (mobile 4G) | < 2s | Vercel Speed Insights / Next.js metrics |

---

## 22. Open Questions

| # | Question | Owner | Needed by |
|---|----------|-------|-----------|
| Q1 | Which Gmail account receives Interac notifications? Is it the same as `etransfer` destination? | Organizer | Day 2, Hour 0 |
| Q2 | Should code appear as player's e-transfer message or as reference number? (message is more reliable) | Team | Day 1, Hour 3 |
| Q3 | Production domain — nymvolleyball.ca or *.vercel.app for v1? | Team | Day 1, Hour 4 |
| Q4 | Is the organizer's Google account a personal Gmail or Google Workspace? (affects OAuth flow slightly) | Organizer | Day 2, Hour 0 |
| Q5 | Acceptable lag for auto-pay — 15 min (free cron) or 5 min (Vercel Pro, $20/mo)? | Team | Day 2, Hour 5 |
| Q6 | If payment code is wrong (player types it wrong), who handles resolution? | Organizer | Before launch |

---

*Document owner: Engineering lead*  
*Stakeholder sign-off required before Day 1, Hour 0 begins.*  
*Q1 and Q4 must be answered before Day 2, Hour 0.*