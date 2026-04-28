import "server-only";

import { NextRequest, NextResponse } from "next/server";

import { isAdminEmail } from "@/lib/admin-emails";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin-session-constants";
import {
  HOST_SESSION_COOKIE,
  MAGIC_ADMIN_SESSION_MAX_AGE_SEC,
  MAGIC_HOST_SESSION_MAX_AGE_SEC,
  MAGIC_PLAYER_SESSION_MAX_AGE_SEC,
  PLAYER_SESSION_COOKIE,
} from "@/lib/magic-auth-cookies";
import { appOrigin, cookieSecure } from "@/lib/env";
import {
  createAdminSessionToken,
  createHostSessionToken,
  createPlayerSessionToken,
  verifyAdminMagicLinkToken,
  verifyHostMagicLinkToken,
  verifyPlayerMagicLinkToken,
} from "@/lib/magic-link";

import { isApprovedHostEmail } from "@/server/queries/hosts";

/** Magic links in email use this path (`/auth/recover` remains supported for old messages). */
export const MAGIC_LINK_CALLBACK_PATH = "/auth/callback";

function redirect(url: URL): NextResponse {
  return NextResponse.redirect(url);
}

/**
 * Validates magic-link query params, sets session cookie, redirects to app.
 * Used by GET `/auth/callback` and legacy GET `/auth/recover`.
 */
export async function respondToMagicLinkCallback(request: NextRequest): Promise<NextResponse> {
  const origin = appOrigin().replace(/\/$/, "");
  const kindRaw = request.nextUrl.searchParams.get("kind")?.trim().toLowerCase();
  const token = request.nextUrl.searchParams.get("t")?.trim();

  const invalidHost = () => redirect(new URL("/host/login?recover=invalid", origin));
  const invalidPlayer = () => redirect(new URL("/login?recover=invalid", origin));
  const invalidAdmin = () => redirect(new URL("/admin/login?recover=invalid", origin));

  if (!token || !kindRaw || (kindRaw !== "host" && kindRaw !== "player" && kindRaw !== "admin")) {
    return redirect(new URL("/", origin));
  }

  if (kindRaw === "host") {
    const verified = verifyHostMagicLinkToken(token);
    if (!verified) {
      return invalidHost();
    }
    if (!(await isApprovedHostEmail(verified.email))) {
      const reqUrl = new URL("/host/request", origin);
      reqUrl.searchParams.set("email", verified.email);
      return redirect(reqUrl);
    }
    const sessionToken = createHostSessionToken(verified.email);
    if (!sessionToken) {
      return invalidHost();
    }
    const url = new URL("/host?recover=ok", origin);
    const res = NextResponse.redirect(url);
    res.cookies.set(HOST_SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      secure: cookieSecure(),
      sameSite: "lax",
      path: "/",
      maxAge: MAGIC_HOST_SESSION_MAX_AGE_SEC,
    });
    return res;
  }

  if (kindRaw === "admin") {
    const verified = verifyAdminMagicLinkToken(token);
    if (!verified || !isAdminEmail(verified.email)) {
      return invalidAdmin();
    }
    const sessionToken = createAdminSessionToken(verified.email);
    if (!sessionToken) {
      return invalidAdmin();
    }
    const url = new URL("/admin?recover=ok", origin);
    const res = NextResponse.redirect(url);
    res.cookies.set(ADMIN_SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      secure: cookieSecure(),
      sameSite: "lax",
      path: "/",
      maxAge: MAGIC_ADMIN_SESSION_MAX_AGE_SEC,
    });
    return res;
  }

  const verified = verifyPlayerMagicLinkToken(token);
  if (!verified) {
    return invalidPlayer();
  }
  const sessionToken = createPlayerSessionToken(verified.email);
  if (!sessionToken) {
    return invalidPlayer();
  }
  const url = new URL("/player?recover=ok", origin);
  const res = NextResponse.redirect(url);
  res.cookies.set(PLAYER_SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax",
    path: "/",
    maxAge: MAGIC_PLAYER_SESSION_MAX_AGE_SEC,
  });
  return res;
}
