import { NextResponse } from "next/server";

import { isAdminAuthorized } from "@/lib/auth";
import { appOrigin, cookieSecure } from "@/lib/env";
import { GMAIL_OAUTH_FLOW_COOKIE, type GmailOAuthFlow } from "@/lib/host-gmail";
import { createGoogleOAuthClient } from "@/lib/gmail";

const ADMIN_FLOW: GmailOAuthFlow = "admin";

export async function GET(): Promise<Response> {
  if (!(await isAdminAuthorized())) {
    return NextResponse.redirect(`${appOrigin()}/admin?gmail=unauthorized`);
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
  res.cookies.set(GMAIL_OAUTH_FLOW_COOKIE, ADMIN_FLOW, {
    httpOnly: true,
    sameSite: "lax",
    secure: cookieSecure(),
    path: "/",
    maxAge: 600,
  });
  return res;
}
