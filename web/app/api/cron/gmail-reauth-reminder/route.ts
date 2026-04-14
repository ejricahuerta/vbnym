import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { maybeSendGmailReauthReminder } from "@/lib/gmail-reauth-reminder";

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
    const result = await maybeSendGmailReauthReminder(admin, new URL(request.url).origin);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }
    return NextResponse.json({
      ok: true,
      sent: result.sent,
      skipped: result.skipped,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gmail reauth reminder failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
