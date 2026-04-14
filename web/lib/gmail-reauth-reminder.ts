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
 * operational deadline, not a value returned by Google for long-lived refresh tokens — tune
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

  const reconnectUrl = `${origin.replace(/\/$/, "")}/api/admin/gmail/oauth/start`;
  const subject = "Reconnect Gmail for NYM payment sync";
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

/** Call after a successful Gmail OAuth token exchange. */
export function gmailAssumedExpiresAfterConnect(connectedAt: Date): string {
  return addDays(connectedAt, gmailOAuthRefreshValidityDays()).toISOString();
}
