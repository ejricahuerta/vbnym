'use server';

import { getPlayerUpcomingGamesByEmail } from "@/server/queries/player-games-by-email";
import type { Game, Signup } from "@/types/vbnym";

export type LookupResult = {
  ok: boolean;
  error?: string;
  games?: (Game & { signups: Signup[] })[];
};

export async function lookupGamesByEmail(
  formData: FormData
): Promise<LookupResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { ok: false, error: "Enter a valid email address." };
  }

  const hasSupabase =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!hasSupabase) {
    return { ok: false, error: "Database not configured." };
  }

  const { games, queryError } = await getPlayerUpcomingGamesByEmail(email);
  if (queryError) {
    return { ok: false, error: "Could not look up your games. Try again in a moment." };
  }
  return { ok: true, games };
}
