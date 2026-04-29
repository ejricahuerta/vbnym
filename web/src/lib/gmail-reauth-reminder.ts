import "server-only";

import { buildGmailReconnectReminderEmailTemplate } from "@/lib/email-templates";
import { sendTransactionalEmailResult } from "@/lib/send-email";
import { appOrigin } from "@/lib/env";
import { createServerSupabase } from "@/lib/supabase-server";

type GmailConnectionExpiryRow = {
  id: string;
  expires_at: string | null;
};

export type GmailReauthReminderResult = {
  ok: true;
  sent: number;
  universal: { sent: number; skipped: string };
  games: { sent: number; skipped: string };
};

function getReminderLeadDays(): number {
  const raw = process.env.GMAIL_REAUTH_REMINDER_LEAD_DAYS?.trim();
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  if (!Number.isFinite(parsed) || parsed <= 0) return 7;
  return parsed;
}

function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS?.trim() ?? "";
  if (!raw) return [];
  const parts: string[] = raw.split(",");
  const emails: string[] = parts
    .map((value: string) => value.trim().toLowerCase())
    .filter((value: string) => value.includes("@"));
  return [...new Set<string>(emails)];
}

function isExpiringWithinLeadDays(iso: string | null, leadDays: number): boolean {
  if (!iso) return false;
  const expiresMs = Date.parse(iso);
  if (!Number.isFinite(expiresMs)) return false;
  const threshold = Date.now() + leadDays * 24 * 60 * 60 * 1000;
  return expiresMs <= threshold;
}

async function sendReminderEmail(
  to: string[],
  subject: string,
  html: string,
  text: string
): Promise<number> {
  let sent = 0;
  for (const email of to) {
    const result = await sendTransactionalEmailResult({ to: email, subject, html, text });
    if (result.ok) sent += 1;
  }
  return sent;
}

export async function maybeSendGmailReauthReminder(): Promise<{ ok: true; sent: number; skipped: string }> {
  const supabase = createServerSupabase();
  const leadDays = getReminderLeadDays();
  const { data } = await supabase
    .from("gmail_connections")
    .select("id, expires_at")
    .eq("id", "universal")
    .eq("active", true)
    .maybeSingle<GmailConnectionExpiryRow>();

  if (!data?.id) return { ok: true, sent: 0, skipped: "no_universal_gmail_connection" };
  if (!isExpiringWithinLeadDays(data.expires_at, leadDays)) {
    return { ok: true, sent: 0, skipped: "outside_reminder_window" };
  }

  const recipients = getAdminEmails();
  if (recipients.length === 0) return { ok: true, sent: 0, skipped: "no_recipients" };

  const reconnectUrl = `${appOrigin()}/api/gmail/oauth/start?mode=universal`;
  const expiresAt = data.expires_at ? new Date(data.expires_at).toUTCString() : "soon";
  const template = buildGmailReconnectReminderEmailTemplate({
    reconnectUrl,
    expiresAtText: expiresAt,
    scopeLabel: "universal",
  });
  const sent = await sendReminderEmail(
    recipients,
    template.subject,
    template.html,
    template.text
  );
  return { ok: true, sent, skipped: sent > 0 ? "sent" : "send_failed" };
}

export async function maybeSendGameGmailReauthReminders(): Promise<{ ok: true; sent: number; skipped: string }> {
  const supabase = createServerSupabase();
  const leadDays = getReminderLeadDays();
  const recipients = getAdminEmails();
  if (recipients.length === 0) return { ok: true, sent: 0, skipped: "no_recipients" };

  const { data: configs } = await supabase
    .from("game_email_sync_config")
    .select("game_id, preferred_gmail_connection_id")
    .not("preferred_gmail_connection_id", "is", null);
  const byConnection = new Map<string, string>();
  for (const row of configs ?? []) {
    const connectionId = String(row.preferred_gmail_connection_id ?? "").trim();
    const gameId = String(row.game_id ?? "").trim();
    if (connectionId && gameId && !byConnection.has(connectionId)) byConnection.set(connectionId, gameId);
  }

  const connectionIds = [...byConnection.keys()];
  if (connectionIds.length === 0) return { ok: true, sent: 0, skipped: "no_game_connections" };

  const { data: rows } = await supabase
    .from("gmail_connections")
    .select("id, expires_at")
    .in("id", connectionIds)
    .eq("active", true);

  const due = (rows ?? []).filter((row: GmailConnectionExpiryRow) =>
    isExpiringWithinLeadDays(row.expires_at, leadDays)
  );
  if (due.length === 0) return { ok: true, sent: 0, skipped: "no_game_reminders_due" };

  let sent = 0;
  for (const row of due) {
    const gameId = byConnection.get(row.id);
    const reconnectUrl = `${appOrigin()}/api/gmail/oauth/start?mode=game&gameId=${encodeURIComponent(gameId ?? "")}`;
    const expiresAt = row.expires_at ? new Date(row.expires_at).toUTCString() : "soon";
    const template = buildGmailReconnectReminderEmailTemplate({
      reconnectUrl,
      expiresAtText: expiresAt,
      scopeLabel: "game payment sync",
    });
    const n = await sendReminderEmail(
      recipients,
      template.subject,
      template.html,
      template.text
    );
    sent += n;
  }
  return { ok: true, sent, skipped: sent > 0 ? "sent" : "send_failed" };
}

export async function sendGmailReauthReminder(): Promise<GmailReauthReminderResult> {
  const universal = await maybeSendGmailReauthReminder();
  const games = await maybeSendGameGmailReauthReminders();
  return { ok: true, sent: universal.sent + games.sent, universal, games };
}
