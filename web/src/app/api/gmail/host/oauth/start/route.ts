import { NextResponse } from "next/server";

import { getHostSessionEmail } from "@/lib/auth";
import { appOrigin, cookieSecure } from "@/lib/env";
import { GMAIL_OAUTH_FLOW_COOKIE, type GmailOAuthFlow } from "@/lib/host-gmail";
import { createGoogleOAuthClient } from "@/lib/gmail";

const HOST_FLOW: GmailOAuthFlow = "host";

export async function GET(): Promise<Response> {
  const hostEmail = await getHostSessionEmail();
  if (!hostEmail) {
    return NextResponse.redirect(`${appOrigin()}/host/login?gmail=unauthorized`);
  }
  const oauth = createGoogleOAuthClient();
  const state = crypto.randomUUID();
  const url = oauth.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/gmail.readonly"],
    state,
  });
  const res = NextResponse.redirect(url);
  res.cookies.set("gmail_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: cookieSecure(),
    path: "/",
    maxAge: 600,
  });
  res.cookies.set(GMAIL_OAUTH_FLOW_COOKIE, HOST_FLOW, {
    httpOnly: true,
    sameSite: "lax",
    secure: cookieSecure(),
    path: "/",
    maxAge: 600,
  });
  return res;
}
