import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isAuthorizedAdmin } from "@/lib/auth";
import { publicOriginFromRequest } from "@/lib/request-public-origin";

/**
 * Supabase OAuth (e.g. Google) redirects here with ?code=…
 * Add to Supabase → Authentication → URL configuration:
 * - **Site URL**: production origin (not localhost), e.g. https://vbnym.ednsy.com
 * - **Redirect URLs**: http://localhost:3000/auth/callback and
 *   https://<your-production-domain>/auth/callback
 * If Site URL is still localhost, Supabase may send `?code=` to `/` — `proxy.ts`
 * forwards that to this route.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = requestUrl.searchParams.get("next") ?? "/admin";
  const origin = publicOriginFromRequest(request);
  const next = nextPath.startsWith("/") ? nextPath : "/admin";
  const failPath = next.startsWith("/admin") ? "/admin/login" : "/";

  const fail = (err: string) =>
    NextResponse.redirect(
      `${origin}${failPath}?error=${encodeURIComponent(err)}`
    );

  if (!code) {
    return fail("missing_code");
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return fail("server_config");
  }

  const response = NextResponse.redirect(`${origin}${next}`);

  const supabase = createServerClient(url, anon, {
    db: { schema: "vbnym" },
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

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return fail(error.message);
  }

  if (next.startsWith("/admin")) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!isAuthorizedAdmin(user)) {
      return fail("not_allowed");
    }
    const { data: settings } = await supabase
      .from("admin_settings")
      .select("gmail_refresh_token")
      .eq("id", 1)
      .maybeSingle();
    const hasGmail = Boolean(settings?.gmail_refresh_token?.trim());
    if (!hasGmail) {
      const destination = new URL(next, origin);
      destination.searchParams.set("connect_gmail", "1");
      const redirect = NextResponse.redirect(destination.toString());
      response.cookies.getAll().forEach((cookie) => {
        redirect.cookies.set(cookie);
      });
      return redirect;
    }
  }

  return response;
}
