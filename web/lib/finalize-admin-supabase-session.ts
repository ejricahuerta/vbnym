import "server-only";

import { NextResponse } from "next/server";

import { isAuthorizedAdmin } from "@/lib/auth";
import type { createClient as createServerSupabaseClient } from "@/lib/supabase/server";

type ServerSupabase = Awaited<ReturnType<typeof createServerSupabaseClient>>;

/**
 * After Supabase has a Google-backed session (OAuth code exchange or `signInWithIdToken`),
 * enforce admin allowlist and optional Gmail-connect redirect.
 */
export async function finalizeAdminSupabaseSession(params: {
  supabase: ServerSupabase;
  response: NextResponse;
  origin: string;
  nextPath: string;
}): Promise<NextResponse> {
  const { supabase, response, origin, nextPath } = params;
  const next = nextPath.startsWith("/") ? nextPath : "/admin";

  const fail = (err: string): NextResponse =>
    NextResponse.redirect(`${origin}/admin/login?error=${encodeURIComponent(err)}`);

  if (!next.startsWith("/admin")) {
    return response;
  }

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

  return response;
}
