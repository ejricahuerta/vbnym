import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { exchangeGmailCode } from "@/lib/gmail-sync";
import { isAuthorizedAdmin } from "@/lib/auth";
import { gmailAssumedExpiresAfterConnect } from "@/lib/gmail-reauth-reminder";
import { configuredPublicOrigin } from "@/lib/configured-public-origin";

export async function GET(request: NextRequest) {
  const publicOrigin = configuredPublicOrigin();
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const destination = new URL("/admin/payments", publicOrigin);

  if (!code) {
    destination.searchParams.set("error", "missing_google_code");
    return NextResponse.redirect(destination);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAuthorizedAdmin(user)) {
    destination.searchParams.set("error", "not_allowed");
    return NextResponse.redirect(destination);
  }

  try {
    const admin = createAdminClient();
    const { refreshToken, connectedEmail } = await exchangeGmailCode(publicOrigin, code);
    const connectedAt = new Date();
    const payload: Record<string, string | null> = {};
    if (refreshToken) payload.gmail_refresh_token = refreshToken;
    if (connectedEmail) payload.gmail_connected_email = connectedEmail;
    payload.gmail_connected_at = connectedAt.toISOString();
    payload.gmail_assumed_expires_at = gmailAssumedExpiresAfterConnect(connectedAt);
    payload.gmail_reauth_reminder_sent_for_expires_at = null;

    const { error } = await admin.from("admin_settings").update(payload).eq("id", 1);
    if (error) {
      destination.searchParams.set("error", error.message);
      return NextResponse.redirect(destination);
    }

    destination.searchParams.set("success", "gmail_connected");
    return NextResponse.redirect(destination);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gmail OAuth callback failed.";
    destination.searchParams.set("error", message);
    return NextResponse.redirect(destination);
  }
}
