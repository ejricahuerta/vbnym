import type { CookieOptions } from "@supabase/ssr";

/** Shared so browser OAuth, callback route, and SSR clients agree on cookie scope. */
export const supabaseAuthCookieOptions: CookieOptions = {
  path: "/",
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
};
