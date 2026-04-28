import { NextRequest, NextResponse } from "next/server";

import { ADMIN_SESSION_COOKIE } from "@/lib/admin-session-constants";
import { cookieSecure } from "@/lib/env";
import {
  HOST_SESSION_COOKIE,
  PLAYER_SESSION_COOKIE,
} from "@/lib/magic-auth-cookies";

function safeNextPath(raw: string | undefined | null): string {
  const s = typeof raw === "string" ? raw.trim() : "";
  if (!s.startsWith("/") || s.startsWith("//")) {
    return "/";
  }
  return s;
}

export async function POST(request: NextRequest): Promise<Response> {
  let nextPath = "/";
  const contentType = request.headers.get("content-type") ?? "";
  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    try {
      const fd = await request.formData();
      nextPath = safeNextPath(fd.get("next")?.toString());
    } catch {
      nextPath = "/";
    }
  }

  const url = new URL(nextPath, request.nextUrl.origin);
  const res = NextResponse.redirect(url);

  const clearOpts = {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };

  res.cookies.set(HOST_SESSION_COOKIE, "", clearOpts);
  res.cookies.set(PLAYER_SESSION_COOKIE, "", clearOpts);
  res.cookies.set(ADMIN_SESSION_COOKIE, "", clearOpts);

  return res;
}
