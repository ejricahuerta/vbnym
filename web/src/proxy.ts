import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { ADMIN_SESSION_COOKIE } from "@/lib/admin-session-constants";

function hasAdminSessionCookieShape(request: NextRequest): boolean {
  const raw = request.cookies.get(ADMIN_SESSION_COOKIE)?.value?.trim();
  return Boolean(raw && raw.includes(".") && raw.length > 24);
}

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/admin/login")) {
    return NextResponse.next();
  }
  if (!hasAdminSessionCookieShape(request)) {
    const login = new URL("/admin/login", request.url);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
