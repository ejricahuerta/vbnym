import { NextResponse, type NextRequest } from "next/server";

import { configuredPublicOrigin } from "@/lib/configured-public-origin";
import {
  ADMIN_GOOGLE_SIGNIN_NEXT_COOKIE,
  ADMIN_GOOGLE_SIGNIN_STATE_COOKIE,
  adminGoogleSignInCookieOptions,
  prepareAdminGoogleSignInUrl,
} from "@/lib/google-admin-signin";

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/admin";
  if (raw.length > 512) return "/admin";
  return raw;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const origin = configuredPublicOrigin();
  const fail = (message: string) =>
    NextResponse.redirect(
      new URL(`/admin/login?error=${encodeURIComponent(message)}`, origin)
    );

  const next = safeNextPath(request.nextUrl.searchParams.get("next"));
  const loginHint = request.nextUrl.searchParams.get("login_hint") ?? "";

  let redirectUrl: string;
  let state: string;
  try {
    const prepared = prepareAdminGoogleSignInUrl({
      publicOrigin: origin,
      nextPath: next,
      loginHint,
    });
    redirectUrl = prepared.redirectUrl;
    state = prepared.state;
  } catch (e) {
    const message = e instanceof Error ? e.message : "oauth_config";
    return fail(message);
  }

  const opts = adminGoogleSignInCookieOptions();
  const res = NextResponse.redirect(redirectUrl);
  res.cookies.set(ADMIN_GOOGLE_SIGNIN_STATE_COOKIE, state, opts);
  res.cookies.set(ADMIN_GOOGLE_SIGNIN_NEXT_COOKIE, next, opts);
  return res;
}
