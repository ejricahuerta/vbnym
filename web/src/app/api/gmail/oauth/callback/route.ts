import { NextRequest, NextResponse } from "next/server";

import { getHostSessionEmail } from "@/lib/auth";
import { buildGmailConnectedEmailTemplate } from "@/lib/email-templates";
import { appOrigin } from "@/lib/env";
import { hostGmailConnectionId } from "@/lib/host-gmail";
import { createGoogleOAuthClient } from "@/lib/gmail";
import { sendTransactionalEmailResult } from "@/lib/send-email";
import { createServerSupabase } from "@/lib/supabase-server";

function gmailOAuthCookieOpts(): { path: string } {
  return { path: "/" };
}

function clearOAuthCookie(res: NextResponse): NextResponse {
  res.cookies.set("gmail_oauth_state", "", { ...gmailOAuthCookieOpts(), maxAge: 0 });
  return res;
}

export async function GET(req: NextRequest): Promise<Response> {
  const hostBase = `${appOrigin()}/host`;

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const rawState = url.searchParams.get("state");
  const cookieState = req.cookies.get("gmail_oauth_state")?.value;
  const stateOk = Boolean(rawState && cookieState && rawState === cookieState);
  if (!code || !stateOk) {
    return clearOAuthCookie(NextResponse.redirect(`${hostBase}?gmail=invalid-state`));
  }

  const oauth = createGoogleOAuthClient();
  const tokenRes = await oauth.getToken(code);
  const accessToken = tokenRes.tokens.access_token ?? null;
  const refreshToken = tokenRes.tokens.refresh_token ?? null;
  const expiryDate = tokenRes.tokens.expiry_date ? new Date(tokenRes.tokens.expiry_date).toISOString() : null;
  if (!refreshToken) {
    return clearOAuthCookie(NextResponse.redirect(`${hostBase}?gmail=missing-refresh-token`));
  }

  const hostEmail = await getHostSessionEmail();
  if (!hostEmail) {
    return clearOAuthCookie(NextResponse.redirect(`${hostBase}/login?gmail=session-expired`));
  }

  const supabase = createServerSupabase();
  const connectionId = hostGmailConnectionId(hostEmail);
  await supabase.from("gmail_connections").upsert(
    {
      id: connectionId,
      connected_email: "oauth-connected",
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiryDate,
      active: true,
    },
    { onConflict: "id" }
  );

  const template = buildGmailConnectedEmailTemplate({
    dashboardUrl: `${appOrigin()}/host`,
  });
  await sendTransactionalEmailResult({
    to: hostEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });

  return clearOAuthCookie(NextResponse.redirect(`${hostBase}?gmail=connected`));
}
