import { NextRequest, NextResponse } from "next/server";

import { getHostSessionEmail } from "@/lib/auth";
import { appOrigin } from "@/lib/env";
import { GMAIL_OAUTH_FLOW_COOKIE, hostGmailConnectionId } from "@/lib/host-gmail";
import { createGoogleOAuthClient } from "@/lib/gmail";
import { createServerSupabase } from "@/lib/supabase-server";

function gmailOAuthCookieOpts(): { path: string } {
  return { path: "/" };
}

export async function GET(req: NextRequest): Promise<Response> {
  const flow = req.cookies.get(GMAIL_OAUTH_FLOW_COOKIE)?.value ?? "admin";
  const hostBase = `${appOrigin()}/host`;
  const adminBase = `${appOrigin()}/admin`;

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = req.cookies.get("gmail_oauth_state")?.value;
  if (!code || !state || state !== cookieState) {
    const target = flow === "host" ? `${hostBase}?gmail=invalid-state` : `${adminBase}?gmail=invalid-state`;
    const res = NextResponse.redirect(target);
    res.cookies.set("gmail_oauth_state", "", { ...gmailOAuthCookieOpts(), maxAge: 0 });
    res.cookies.set(GMAIL_OAUTH_FLOW_COOKIE, "", { ...gmailOAuthCookieOpts(), maxAge: 0 });
    return res;
  }

  const oauth = createGoogleOAuthClient();
  const tokenRes = await oauth.getToken(code);
  const accessToken = tokenRes.tokens.access_token ?? null;
  const refreshToken = tokenRes.tokens.refresh_token ?? null;
  const expiryDate = tokenRes.tokens.expiry_date ? new Date(tokenRes.tokens.expiry_date).toISOString() : null;
  if (!refreshToken) {
    const target =
      flow === "host" ? `${hostBase}?gmail=missing-refresh-token` : `${adminBase}?gmail=missing-refresh-token`;
    const res = NextResponse.redirect(target);
    res.cookies.set("gmail_oauth_state", "", { ...gmailOAuthCookieOpts(), maxAge: 0 });
    res.cookies.set(GMAIL_OAUTH_FLOW_COOKIE, "", { ...gmailOAuthCookieOpts(), maxAge: 0 });
    return res;
  }

  const supabase = createServerSupabase();

  if (flow === "host") {
    const hostEmail = await getHostSessionEmail();
    if (!hostEmail) {
      const res = NextResponse.redirect(`${hostBase}/login?gmail=session-expired`);
      res.cookies.set("gmail_oauth_state", "", { ...gmailOAuthCookieOpts(), maxAge: 0 });
      res.cookies.set(GMAIL_OAUTH_FLOW_COOKIE, "", { ...gmailOAuthCookieOpts(), maxAge: 0 });
      return res;
    }
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
    const res = NextResponse.redirect(`${hostBase}?gmail=connected`);
    res.cookies.set("gmail_oauth_state", "", { ...gmailOAuthCookieOpts(), maxAge: 0 });
    res.cookies.set(GMAIL_OAUTH_FLOW_COOKIE, "", { ...gmailOAuthCookieOpts(), maxAge: 0 });
    return res;
  }

  await supabase.from("gmail_connections").upsert(
    {
      id: "universal",
      connected_email: "oauth-connected",
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiryDate,
      active: true,
    },
    { onConflict: "id" }
  );

  const res = NextResponse.redirect(`${adminBase}?gmail=connected`);
  res.cookies.set("gmail_oauth_state", "", { ...gmailOAuthCookieOpts(), maxAge: 0 });
  res.cookies.set(GMAIL_OAUTH_FLOW_COOKIE, "", { ...gmailOAuthCookieOpts(), maxAge: 0 });
  return res;
}
