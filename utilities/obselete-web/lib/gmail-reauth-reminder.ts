import { getAdminExplicitEmailAllowlist } from "@/lib/auth";
import type { AdminSupabaseClient } from "@/lib/supabase/admin";
import { sendTransactionalEmail } from "@/lib/notifications";

type AdminGmailReminderRow = {
  gmail_refresh_token: string | null;
  gmail_connected_email: string | null;
  gmail_connected_at: string | null;
  gmail_assumed_expires_at: string | null;
  gmail_reauth_reminder_sent_for_expires_at: string | null;
};

function gmailOAuthRefreshValidityDays(): number {
  const raw = process.env.GMAIL_OAUTH_REFRESH_VALID_DAYS;
  const n = raw ? Number.parseInt(raw, 10) : Number.NaN;
  if (Number.isFinite(n) && n > 0) return n;
  return 180;
}

function gmailReauthReminderLeadDays(): number {
  const raw = process.env.GMAIL_REAUTH_REMINDER_LEAD_DAYS;
  const n = raw ? Number.parseInt(raw, 10) : Number.NaN;
  if (Number.isFinite(n) && n >= 0) return n;
  return 2;
}

/** Operational re-auth cadence for per-game Gmail connections (drop-in default: 4 days). */
export function gmailGameConnectionStaleDays(): number {
  const raw = process.env.GMAIL_GAME_CONNECTION_STALE_DAYS;
  const n = raw ? Number.parseInt(raw, 10) : Number.NaN;
  if (Number.isFinite(n) && n > 0) return n;
  return 4;
}

/** Assumed deadline after a successful per-game Gmail OAuth connect. */
export function gmailAssumedExpiresAfterGameConnect(connectedAt: Date): string {
  return addDays(connectedAt, gmailGameConnectionStaleDays()).toISOString();
}

function addDays(isoOrDate: string | Date, days: number): Date {
  const t =
    typeof isoOrDate === "string" ? new Date(isoOrDate).getTime() : isoOrDate.getTime();
  return new Date(t + days * 86400000);
}

function reminderRecipients(connectedEmail: string | null | undefined): string[] {
  const fromEnv = getAdminExplicitEmailAllowlist();
  const connected = connectedEmail?.trim().toLowerCase();
  const set = new Set<string>(fromEnv);
  if (connected) set.add(connected);
  return [...set];
}

/**
 * If the assumed Gmail refresh grant end is within the lead window, email admins once per expiry.
 * Call daily from a cron job (see `/api/cron/gmail-reauth-reminder`).
 *
 * `gmail_assumed_expires_at` is set on OAuth connect (and backfilled here if missing). It is an
 * operational deadline, not a value returned by Google for long-lived refresh tokens → tune
 * `GMAIL_OAUTH_REFRESH_VALID_DAYS` (e.g. 7 for Google "testing" refresh behaviour, 180+ otherwise).
 */
export async function maybeSendGmailReauthReminder(
  admin: AdminSupabaseClient,
  origin: string
): Promise<{ ok: true; sent: number; skipped: string } | { ok: false; error: string }> {
  const { data: row, error } = await admin
    .from("admin_settings")
    .select(
      "gmail_refresh_token, gmail_connected_email, gmail_connected_at, gmail_assumed_expires_at, gmail_reauth_reminder_sent_for_expires_at"
    )
    .eq("id", 1)
    .maybeSingle<AdminGmailReminderRow>();

  if (error) return { ok: false, error: error.message };
  if (!row?.gmail_refresh_token?.trim()) {
    return { ok: true, sent: 0, skipped: "no_gmail_connected" };
  }

  const validityDays = gmailOAuthRefreshValidityDays();
  let assumedExpiresAt = row.gmail_assumed_expires_at;

  if (!assumedExpiresAt) {
    const base = row.gmail_connected_at ? new Date(row.gmail_connected_at) : new Date();
    const computed = addDays(base, validityDays).toISOString();
    await admin
      .from("admin_settings")
      .update({ gmail_assumed_expires_at: computed })
      .eq("id", 1);
    assumedExpiresAt = computed;
  }

  const expires = new Date(assumedExpiresAt);
  const leadDays = gmailReauthReminderLeadDays();
  const windowStart = addDays(expires, -leadDays);

  if (Number.isNaN(expires.getTime())) {
    return { ok: true, sent: 0, skipped: "invalid_assumed_expires" };
  }

  const now = new Date();
  if (now < windowStart) {
    return { ok: true, sent: 0, skipped: "outside_reminder_window" };
  }

  const sentFor = row.gmail_reauth_reminder_sent_for_expires_at;
  if (sentFor && new Date(sentFor).getTime() === expires.getTime()) {
    return { ok: true, sent: 0, skipped: "already_reminded_for_this_expiry" };
  }

  const recipients = reminderRecipients(row.gmail_connected_email);
  if (recipients.length === 0) {
    return { ok: true, sent: 0, skipped: "no_recipients_configure_admin_emails" };
  }

  const reconnectUrl = `${origin.replace(/\/$/, "")}/api/admin/gmail/oauth/start?mode=universal`;
  const subject = "Reconnect Gmail for 6IX BACK payment sync";
  const html = `
    <p>The Gmail connection used for payment email sync is due for re-authentication soon (by <strong>${expires.toUTCString()}</strong>).</p>
    <p>Sign in to the admin site and reconnect:</p>
    <p><a href="${reconnectUrl}">Reconnect Gmail</a></p>
    <p>Or open Admin → Payments and use &quot;Connect Gmail OAuth&quot;.</p>
  `.trim();

  let sent = 0;
  for (const to of recipients) {
    await sendTransactionalEmail({ to, subject, html });
    sent += 1;
  }

  await admin
    .from("admin_settings")
    .update({ gmail_reauth_reminder_sent_for_expires_at: assumedExpiresAt })
    .eq("id", 1);

  return { ok: true, sent, skipped: "sent" };
}

type GameGmailReminderRow = {
  id: string;
  gmail_refresh_token: string | null;
  gmail_connected_email: string | null;
  gmail_assumed_expires_at: string | null;
  gmail_reauth_reminder_sent_for_expires_at: string | null;
  reauth_required: boolean | null;
};

/**
 * Daily cron helper: remind admins before per-game Gmail assumed expiry (same lead window as universal).
 */
export async function maybeSendGameGmailReauthReminders(
  admin: AdminSupabaseClient,
  origin: string
): Promise<{ ok: true; sent: number; skipped: string } | { ok: false; error: string }> {
  const { data: configs, error } = await admin
    .from("game_email_sync_config")
    .select("game_id, preferred_gmail_connection_id")
    .not("preferred_gmail_connection_id", "is", null);
  if (error) return { ok: false, error: error.message };

  const list = configs ?? [];
  if (list.length === 0) {
    return { ok: true, sent: 0, skipped: "no_game_gmail_connections" };
  }

  const gameByConn = new Map<string, string>();
  for (const c of list) {
    const cid = c.preferred_gmail_connection_id as string | null;
    if (cid && !gameByConn.has(cid)) gameByConn.set(cid, c.game_id as string);
  }

  const connIds = [...gameByConn.keys()];
  const { data: conns, error: cErr } = await admin
    .from("gmail_connections")
    .select(
      "id, gmail_refresh_token, gmail_connected_email, gmail_assumed_expires_at, gmail_reauth_reminder_sent_for_expires_at, reauth_required"
    )
    .in("id", connIds);
  if (cErr) return { ok: false, error: cErr.message };

  const leadDays = gmailReauthReminderLeadDays();
  const now = new Date();
  let sent = 0;

  for (const row of conns ?? []) {
    const r = row as GameGmailReminderRow;
    if (!r.gmail_refresh_token?.trim()) continue;
    if (r.reauth_required) continue;

    let assumedExpiresAt = r.gmail_assumed_expires_at;
    if (!assumedExpiresAt) {
      const computed = addDays(new Date(), gmailGameConnectionStaleDays()).toISOString();
      await admin
        .from("gmail_connections")
        .update({ gmail_assumed_expires_at: computed })
        .eq("id", r.id);
      assumedExpiresAt = computed;
    }

    const expires = new Date(assumedExpiresAt);
    if (Number.isNaN(expires.getTime())) continue;

    const windowStart = addDays(expires, -leadDays);
    if (now < windowStart) continue;

    const sentFor = r.gmail_reauth_reminder_sent_for_expires_at;
    if (sentFor && new Date(sentFor).getTime() === expires.getTime()) continue;

    const gameId = gameByConn.get(r.id);
    const reconnectUrl = gmailOAuthStartUrl(origin, { mode: "game", gameId });
    const recipients = reminderRecipients(r.gmail_connected_email);
    if (recipients.length === 0) continue;

    const subject = "Reconnect Gmail for 6IX BACK game payment sync (deadline approaching)";
    const html = `
      <p>A game payment inbox Gmail connection is due for re-authentication by <strong>${expires.toUTCString()}</strong>.</p>
      <p><a href="${reconnectUrl}">Reconnect game Gmail</a></p>
      <p>Or open Admin → edit the game → Payment email (Gmail sync).</p>
    `.trim();

    for (const to of recipients) {
      await sendTransactionalEmail({ to, subject, html });
      sent += 1;
    }

    await admin
      .from("gmail_connections")
      .update({ gmail_reauth_reminder_sent_for_expires_at: assumedExpiresAt })
      .eq("id", r.id);
  }

  return {
    ok: true,
    sent,
    skipped: sent > 0 ? "sent" : "no_game_reminders_due",
  };
}

/** Call after a successful Gmail OAuth token exchange. */
export function gmailAssumedExpiresAfterConnect(connectedAt: Date): string {
  return addDays(connectedAt, gmailOAuthRefreshValidityDays()).toISOString();
}

function gmailOAuthStartUrl(
  origin: string,
  opts: { mode: "universal" | "game"; gameId?: string }
): string {
  const base = `${origin.replace(/\/$/, "")}/api/admin/gmail/oauth/start`;
  if (opts.mode === "universal") {
    return `${base}?mode=universal`;
  }
  const q = new URLSearchParams({ mode: "game", gameId: opts.gameId ?? "" });
  return `${base}?${q.toString()}`;
}

/**
 * Marks a game-scoped Gmail connection as needing re-auth and emails admins once per transition.
 */
export async function markGameGmailReauthRequiredAndNotify(
  admin: AdminSupabaseClient,
  origin: string,
  opts: { connectionId: string; gameId?: string; connectedEmail: string | null }
): Promise<void> {
  const { data, error } = await admin
    .from("gmail_connections")
    .update({ reauth_required: true })
    .eq("id", opts.connectionId)
    .eq("reauth_required", false)
    .select("id");
  if (error || !data?.length) return;

  const reconnectUrl = gmailOAuthStartUrl(origin, {
    mode: "game",
    gameId: opts.gameId,
  });
  const recipients = reminderRecipients(opts.connectedEmail);
  if (recipients.length === 0) return;

  const subject = "Reconnect Gmail for 6IX BACK game payment sync";
  const gameLine = opts.gameId
    ? `<p>Game ID: <code>${opts.gameId}</code></p>`
    : "";
  const html = `
    <p>Gmail access for a game payment inbox failed (refresh token invalid or revoked).</p>
    ${gameLine}
    <p><a href="${reconnectUrl}">Reconnect Gmail for this game</a></p>
    <p>Or open Admin → edit the game → Payment inbox.</p>
  `.trim();

  for (const to of recipients) {
    await sendTransactionalEmail({ to, subject, html });
  }
}

/**
 * Marks universal admin Gmail as needing re-auth and emails admins once per transition.
 */
export async function markUniversalGmailReauthRequiredAndNotify(
  admin: AdminSupabaseClient,
  origin: string,
  opts: { connectedEmail: string | null }
): Promise<void> {
  const { data, error } = await admin
    .from("admin_settings")
    .update({ gmail_reauth_required: true })
    .eq("id", 1)
    .eq("gmail_reauth_required", false)
    .select("id");
  if (error || !data?.length) return;

  const reconnectUrl = gmailOAuthStartUrl(origin, { mode: "universal" });
  const recipients = reminderRecipients(opts.connectedEmail);
  if (recipients.length === 0) return;

  const subject = "Reconnect Gmail for 6IX BACK payment sync (universal inbox)";
  const html = `
    <p>The universal Gmail connection used for payment email sync failed (refresh token invalid or revoked).</p>
    <p><a href="${reconnectUrl}">Reconnect Gmail</a></p>
    <p>Or open Admin → Payments.</p>
  `.trim();

  for (const to of recipients) {
    await sendTransactionalEmail({ to, subject, html });
  }
}
