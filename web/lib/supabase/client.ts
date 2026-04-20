"use client";

import { createBrowserClient } from "@supabase/ssr";

import { supabaseAuthCookieOptions } from "@/lib/supabase/auth-cookie-options";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return createBrowserClient(url, anon, {
    db: { schema: "vbnym" },
    cookieOptions: supabaseAuthCookieOptions,
  });
}
