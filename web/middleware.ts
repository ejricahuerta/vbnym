import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAuthorizedAdmin } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  if (path.startsWith("/admin") && !path.startsWith("/admin/login")) {
    if (!isAuthorizedAdmin(user)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/admin/login";
      redirectUrl.searchParams.set("next", path);
      return NextResponse.redirect(redirectUrl);
    }
  }
  if (path.startsWith("/admin/login") && isAuthorizedAdmin(user)) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }
  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
