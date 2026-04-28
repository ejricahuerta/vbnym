import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  maybeSendGameGmailReauthReminders,
  maybeSendGmailReauthReminder,
} from "@/lib/gmail-reauth-reminder";

/**
 * Daily cron: emails admins when Gmail assumed expiry is within GMAIL_REAUTH_REMINDER_LEAD_DAYS.
 * Same auth as payment sync: `x-cron-token: PAYMENT_SYNC_CRON_TOKEN`.
 */
export async function POST(request: NextRequest) {
  const expectedCronToken = process.env.PAYMENT_SYNC_CRON_TOKEN;
  const providedCronToken = request.headers.get("x-cron-token");
  if (!expectedCronToken || providedCronToken !== expectedCronToken) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const origin = new URL(request.url).origin;
    const universal = await maybeSendGmailReauthReminder(admin, origin);
    if (!universal.ok) {
      return NextResponse.json({ ok: false, error: universal.error }, { status: 400 });
    }
    const games = await maybeSendGameGmailReauthReminders(admin, origin);
    if (!games.ok) {
      return NextResponse.json({ ok: false, error: games.error }, { status: 400 });
    }
    return NextResponse.json({
      ok: true,
      sent: universal.sent + games.sent,
      universal: { sent: universal.sent, skipped: universal.skipped },
      games: { sent: games.sent, skipped: games.skipped },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gmail reauth reminder failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
