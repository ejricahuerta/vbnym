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
  skipped: string;
};

function getReminderLeadDays(): number {
  const raw = process.env.GMAIL_REAUTH_REMINDER_LEAD_DAYS?.trim();
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  if (!Number.isFinite(parsed) || parsed <= 0) return 7;
  return parsed;
}

function isExpiringWithinLeadDays(iso: string | null, leadDays: number): boolean {
  if (!iso) return false;
  const expiresMs = Date.parse(iso);
  if (!Number.isFinite(expiresMs)) return false;
  const threshold = Date.now() + leadDays * 24 * 60 * 60 * 1000;
  return expiresMs <= threshold;
}

function hostEmailFromConnectionId(id: string): string {
  return id.replace(/^host:/, "").trim().toLowerCase();
}

export async function sendGmailReauthReminder(): Promise<GmailReauthReminderResult> {
  const supabase = createServerSupabase();
  const leadDays = getReminderLeadDays();

  const { data } = await supabase
    .from("gmail_connections")
    .select("id, expires_at")
    .like("id", "host:%")
    .eq("active", true);

  const rows = (data ?? []) as GmailConnectionExpiryRow[];
  const due = rows.filter((row) => isExpiringWithinLeadDays(row.expires_at, leadDays));
  if (due.length === 0) return { ok: true, sent: 0, skipped: "no_host_reminders_due" };

  const reconnectUrl = `${appOrigin()}/api/gmail/host/oauth/start`;
  let sent = 0;
  for (const row of due) {
    const hostEmail = hostEmailFromConnectionId(row.id);
    if (!hostEmail.includes("@")) continue;
    const expiresAt = row.expires_at ? new Date(row.expires_at).toUTCString() : "soon";
    const template = buildGmailReconnectReminderEmailTemplate({
      reconnectUrl,
      expiresAtText: expiresAt,
      scopeLabel: "payment sync",
    });
    const result = await sendTransactionalEmailResult({
      to: hostEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
    if (result.ok) sent += 1;
  }

  return { ok: true, sent, skipped: sent > 0 ? "sent" : "send_failed" };
}
