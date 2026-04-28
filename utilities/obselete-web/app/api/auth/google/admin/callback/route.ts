import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { finalizeAdminSupabaseSession } from "@/lib/finalize-admin-supabase-session";
import { configuredPublicOrigin } from "@/lib/configured-public-origin";
import {
  ADMIN_GOOGLE_SIGNIN_NEXT_COOKIE,
  ADMIN_GOOGLE_SIGNIN_STATE_COOKIE,
  clearAdminGoogleSignInCookieOptions,
  exchangeAdminGoogleSignInCode,
} from "@/lib/google-admin-signin";
import { supabaseAuthCookieOptions } from "@/lib/supabase/auth-cookie-options";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const origin = configuredPublicOrigin();
  const fail = (err: string) =>
    NextResponse.redirect(
      `${origin}/admin/login?error=${encodeURIComponent(err)}`
    );

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return fail("server_config");
  }

  const code = request.nextUrl.searchParams.get("code");
  const stateParam = request.nextUrl.searchParams.get("state");
  const stateCookie = request.cookies.get(ADMIN_GOOGLE_SIGNIN_STATE_COOKIE)?.value;
  const nextCookie = request.cookies.get(ADMIN_GOOGLE_SIGNIN_NEXT_COOKIE)?.value;

  if (!code) {
    return fail("missing_code");
  }
  if (!stateParam || !stateCookie || stateParam !== stateCookie) {
    return fail("invalid_oauth_state");
  }

  const next = nextCookie?.startsWith("/") && !nextCookie.startsWith("//") ? nextCookie : "/admin";
  const clearOpts = clearAdminGoogleSignInCookieOptions();

  const exchanged = await exchangeAdminGoogleSignInCode({
    publicOrigin: origin,
    code,
  });
  if ("error" in exchanged) {
    const res = fail(exchanged.error);
    res.cookies.set(ADMIN_GOOGLE_SIGNIN_STATE_COOKIE, "", clearOpts);
    res.cookies.set(ADMIN_GOOGLE_SIGNIN_NEXT_COOKIE, "", clearOpts);
    return res;
  }

  const response = NextResponse.redirect(`${origin}${next}`);
  response.cookies.set(ADMIN_GOOGLE_SIGNIN_STATE_COOKIE, "", clearOpts);
  response.cookies.set(ADMIN_GOOGLE_SIGNIN_NEXT_COOKIE, "", clearOpts);

  const supabase = createServerClient(url, anon, {
    db: { schema: "vbnym" },
    cookieOptions: supabaseAuthCookieOptions,
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const { error } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token: exchanged.idToken,
  });
  if (error) {
    return fail(error.message);
  }

  return finalizeAdminSupabaseSession({
    supabase,
    response,
    origin,
    nextPath: next,
  });
}
