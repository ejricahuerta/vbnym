import { createServerClient } from "@supabase/ssr";
import type { AuthUser } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isAuthorizedAdmin } from "./lib/auth";
import { supabaseAuthCookieOptions } from "./lib/supabase/auth-cookie-options";
import { configuredPublicOrigin } from "./lib/configured-public-origin";

/** Supabase PKCE often lands on `/` when Dashboard Site URL is wrong (e.g. localhost). */
function isLikelySupabasePkceCode(value: string): boolean {
  return value.length >= 20 && value.length <= 512 && /^[A-Za-z0-9\-._~]+$/.test(value);
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const strayCode = request.nextUrl.searchParams.get("code");
  if (
    path === "/" &&
    strayCode &&
    isLikelySupabasePkceCode(strayCode)
  ) {
    const publicOrigin = configuredPublicOrigin();
    const dest = new URL("/auth/callback", publicOrigin);
    request.nextUrl.searchParams.forEach((value, key) => {
      dest.searchParams.set(key, value);
    });
    return NextResponse.redirect(dest);
  }

  /** Do not refresh/read Supabase session here — it can clobber PKCE cookies before `exchangeCodeForSession`. */
  if (path === "/auth/callback") {
    return NextResponse.next();
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, anon, {
    db: { schema: "vbnym" },
    cookieOptions: supabaseAuthCookieOptions,
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // `SupabaseAuthClient` typings omit `getUser` in some Edge/TS combinations; runtime API is correct.
  const auth = supabase.auth as unknown as {
    getUser: () => Promise<{ data: { user: AuthUser | null } }>;
  };
  const {
    data: { user },
  } = await auth.getUser();

  const publicOrigin = configuredPublicOrigin();
  if (path.startsWith("/admin") && !path.startsWith("/admin/login")) {
    if (!isAuthorizedAdmin(user)) {
      const redirectUrl = new URL("/admin/login", publicOrigin);
      redirectUrl.searchParams.set("next", path);
      return NextResponse.redirect(redirectUrl);
    }
  }
  if (path.startsWith("/admin/login") && isAuthorizedAdmin(user)) {
    return NextResponse.redirect(new URL("/admin", publicOrigin));
  }
  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
