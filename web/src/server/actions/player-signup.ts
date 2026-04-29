'use server';

import { revalidatePath } from "next/cache";

import { getPlayerSessionEmail } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase-server";
import type { ActionResult } from "@/types/action-result";
import { parsePlayerCancelSignupFormData } from "@/types/schemas/player-signup";

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

export async function cancelSignupForPlayer(formData: FormData): Promise<ActionResult<null>> {
  const sessionEmail = await getPlayerSessionEmail();
  if (!sessionEmail) {
    return { ok: false, error: "Sign in as player to manage your signup." };
  }

  const parsed = parsePlayerCancelSignupFormData(formData);
  if (!parsed.ok) return parsed;

  const supabase = createServerSupabase();
  const normalizedSession = sessionEmail.trim().toLowerCase();

  const { data: signup, error: signupErr } = await supabase
    .from("signups")
    .select("id, game_id, player_email, status, payment_status")
    .eq("id", parsed.data.signupId)
    .eq("game_id", parsed.data.gameId)
    .maybeSingle<{
      id: string;
      game_id: string;
      player_email: string;
      status: "active" | "waitlist" | "canceled" | "removed" | "deleted";
      payment_status: "paid" | "pending" | "refund" | "canceled";
    }>();

  if (signupErr || !signup) {
    return { ok: false, error: "Sign-up not found." };
  }

  if (signup.player_email.trim().toLowerCase() !== normalizedSession) {
    return { ok: false, error: "You can only cancel your own signup." };
  }

  if (signup.status === "canceled" || signup.status === "removed" || signup.status === "deleted") {
    return { ok: true, data: null };
  }

  if (signup.payment_status !== "paid") {
    return { ok: false, error: "Only confirmed signups can be cancelled here." };
  }

  const { data: game, error: gameErr } = await supabase
    .from("games")
    .select("id, starts_at, signed_count, waitlist_count")
    .eq("id", parsed.data.gameId)
    .maybeSingle<{ id: string; starts_at: string; signed_count: number; waitlist_count: number }>();
  if (gameErr || !game) {
    return { ok: false, error: "Game not found." };
  }

  const msUntilStart = Date.parse(game.starts_at) - Date.now();
  if (!Number.isFinite(msUntilStart) || msUntilStart <= TWO_HOURS_MS) {
    return { ok: false, error: "Cancellation is only available until 2 hours before game start." };
  }

  const { error: cancelErr } = await supabase
    .from("signups")
    .update({ status: "canceled", payment_status: "refund" })
    .eq("id", parsed.data.signupId)
    .eq("game_id", parsed.data.gameId)
    .in("status", ["active", "waitlist"]);
  if (cancelErr) {
    return { ok: false, error: cancelErr.message ?? "Could not cancel signup." };
  }

  if (signup.status === "active") {
    await supabase
      .from("games")
      .update({ signed_count: Math.max(0, game.signed_count - 1) })
      .eq("id", parsed.data.gameId);
  } else if (signup.status === "waitlist") {
    await supabase
      .from("games")
      .update({ waitlist_count: Math.max(0, game.waitlist_count - 1) })
      .eq("id", parsed.data.gameId);
  }

  revalidatePath("/browse");
  revalidatePath("/player");
  revalidatePath("/host");
  revalidatePath(`/games/${parsed.data.gameId}`);
  revalidatePath("/admin");
  return { ok: true, data: null };
}
