'use server';

import { createClient } from "@/lib/supabase/server";
import { isAuthorizedAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTransactionalEmail } from "@/lib/notifications";
import { policyUpdateBroadcastEmailHtml, policyUpdateBroadcastEmailText } from "@/lib/policy-broadcast-email";
import { todayIsoDateInGameScheduleZone } from "@/lib/registration-policy";

export type BroadcastPolicyUpdateResult =
  | { ok: true; sent: number; recipients: number }
  | { ok: false; error: string };

function normalizeEmail(raw: unknown): string | null {
  const e = String(raw ?? "")
    .trim()
    .toLowerCase();
  if (!e || !e.includes("@")) return null;
  return e;
}

/**
 * Emails every distinct player address tied to upcoming runs (default) or the entire signup + waitlist history.
 * Sends a policy summary + link — not payment codes (those stay tied to the original transactional emails).
 */
export async function broadcastPlayerPolicyUpdate(includePastGames: boolean): Promise<BroadcastPolicyUpdateResult> {
  if (!process.env.RESEND_API_KEY?.trim()) {
    return { ok: false, error: "RESEND_API_KEY is not set; cannot send email." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAuthorizedAdmin(user)) {
    return { ok: false, error: "Not authorized." };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return { ok: false, error: "Server is not configured for admin database access." };
  }

  const emails = new Set<string>();

  if (includePastGames) {
    const { data: su, error: suErr } = await admin.from("signups").select("email");
    if (suErr) return { ok: false, error: suErr.message };
    for (const row of su ?? []) {
      const e = normalizeEmail((row as { email?: string }).email);
      if (e) emails.add(e);
    }
    const { data: wl, error: wlErr } = await admin.from("waitlist_signups").select("email");
    if (wlErr) return { ok: false, error: wlErr.message };
    for (const row of wl ?? []) {
      const e = normalizeEmail((row as { email?: string }).email);
      if (e) emails.add(e);
    }
  } else {
    const todayIso = todayIsoDateInGameScheduleZone();
    const { data: upcoming, error: gErr } = await admin.from("games").select("id").gte("date", todayIso);
    if (gErr) return { ok: false, error: gErr.message };
    const gameIds = (upcoming ?? []).map((r) => String((r as { id: string }).id)).filter(Boolean);
    if (gameIds.length === 0) {
      return { ok: true, sent: 0, recipients: 0 };
    }

    const { data: su, error: suErr } = await admin.from("signups").select("email").in("game_id", gameIds);
    if (suErr) return { ok: false, error: suErr.message };
    for (const row of su ?? []) {
      const e = normalizeEmail((row as { email?: string }).email);
      if (e) emails.add(e);
    }

    const { data: wl, error: wlErr } = await admin
      .from("waitlist_signups")
      .select("email")
      .in("game_id", gameIds)
      .in("status", ["pending", "invited"]);
    if (wlErr) return { ok: false, error: wlErr.message };
    for (const row of wl ?? []) {
      const e = normalizeEmail((row as { email?: string }).email);
      if (e) emails.add(e);
    }
  }

  const recipients = emails.size;
  if (recipients === 0) {
    return { ok: true, sent: 0, recipients: 0 };
  }

  const html = policyUpdateBroadcastEmailHtml();
  const text = policyUpdateBroadcastEmailText();
  let sent = 0;
  for (const to of emails) {
    await sendTransactionalEmail({
      to,
      subject: "NYM Volleyball — player policies & waiver (update)",
      html,
      text,
    });
    sent++;
  }

  return { ok: true, sent, recipients };
}
