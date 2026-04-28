'use server';

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";

import { generatePaymentCode } from "@/lib/payment-code";
import { createServerSupabase } from "@/lib/supabase-server";
import type { ActionResult } from "@/types/action-result";
import { parseSignupFormData } from "@/types/schemas/signup";

export async function signupForGame(formData: FormData): Promise<ActionResult<{ signupId: string; paymentCode: string; waitlist: boolean }>> {
  const parsed = parseSignupFormData(formData);
  if (!parsed.ok) return parsed;

  const supabase = createServerSupabase();
  const { data: game } = await supabase
    .from("games")
    .select("id, capacity, signed_count, waitlist_count")
    .eq("id", parsed.data.gameId)
    .maybeSingle<{ id: string; capacity: number; signed_count: number; waitlist_count: number }>();
  if (!game) {
    return { ok: false, error: "Game not found." };
  }

  const signupId = randomUUID();
  const waitlist = game.signed_count >= game.capacity;
  const paymentCode = generatePaymentCode({
    gameId: parsed.data.gameId,
    signupId,
    playerEmail: parsed.data.playerEmail,
  });

  const { error } = await supabase.from("signups").insert({
    id: signupId,
    game_id: parsed.data.gameId,
    player_name: parsed.data.playerName,
    player_email: parsed.data.playerEmail,
    payment_code: paymentCode,
    payment_status: "owes",
    status: waitlist ? "waitlist" : "active",
  });
  if (error) return { ok: false, error: error.message };

  await supabase
    .from("games")
    .update(
      waitlist
        ? { waitlist_count: game.waitlist_count + 1 }
        : { signed_count: game.signed_count + 1 }
    )
    .eq("id", parsed.data.gameId);

  revalidatePath("/browse");
  revalidatePath(`/games/${parsed.data.gameId}`);
  revalidatePath("/admin");
  return { ok: true, data: { signupId, paymentCode, waitlist } };
}
