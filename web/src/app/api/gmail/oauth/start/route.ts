import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { isAdminAuthorized } from "@/lib/auth";
import { appOrigin, cookieSecure } from "@/lib/env";
import { encodeGmailOAuthState } from "@/lib/gmail";
import { GMAIL_OAUTH_FLOW_COOKIE, type GmailOAuthFlow } from "@/lib/host-gmail";
import { createGoogleOAuthClient } from "@/lib/gmail";

const ADMIN_FLOW: GmailOAuthFlow = "admin";

export async function GET(request: NextRequest): Promise<Response> {
  if (!(await isAdminAuthorized())) {
    return NextResponse.redirect(`${appOrigin()}/admin?gmail=unauthorized`);
  }
  const mode = request.nextUrl.searchParams.get("mode") === "game" ? "game" : "universal";
  const gameId = request.nextUrl.searchParams.get("gameId")?.trim();
  if (mode === "game" && !gameId) {
    return NextResponse.redirect(`${appOrigin()}/admin?gmail=missing-game-id`);
  }

  const oauth = createGoogleOAuthClient();
  const csrf = crypto.randomUUID();
  const state = encodeGmailOAuthState({
    v: 1,
    csrf,
    mode,
    gameId: mode === "game" ? gameId : undefined,
  });
  const url = oauth.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/gmail.readonly"],
    state,
  });
  const res = NextResponse.redirect(url);
  res.cookies.set("gmail_oauth_state", csrf, {
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
