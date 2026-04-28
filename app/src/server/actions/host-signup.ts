'use server';

import { revalidatePath } from "next/cache";

import { getHostSessionEmail } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase-server";
import type { ActionResult } from "@/types/action-result";
import {
  parseHostSetSignupPaymentStatusFormData,
  parseHostSetSignupRosterStatusFormData,
} from "@/types/schemas/host-signup";

export async function setSignupPaymentStatusForHost(formData: FormData): Promise<ActionResult<null>> {
  const parsed = parseHostSetSignupPaymentStatusFormData(formData);
  if (!parsed.ok) return parsed;

  const sessionEmail = await getHostSessionEmail();
  if (!sessionEmail) {
    return { ok: false, error: "Sign in as host to update the roster." };
  }

  const supabase = createServerSupabase();
  const normalizedSession = sessionEmail.trim().toLowerCase();

  const { data: game, error: gameErr } = await supabase
    .from("games")
    .select("id, owner_email")
    .eq("id", parsed.data.gameId)
    .maybeSingle<{ id: string; owner_email: string }>();

  if (gameErr || !game) {
    return { ok: false, error: "Game not found." };
  }

  if (game.owner_email.trim().toLowerCase() !== normalizedSession) {
    return { ok: false, error: "You can only update games you host." };
  }

  const { error: upErr } = await supabase
    .from("signups")
    .update({ payment_status: parsed.data.paymentStatus })
    .eq("id", parsed.data.signupId)
    .eq("game_id", parsed.data.gameId);

  if (upErr) {
    return { ok: false, error: upErr.message ?? "Could not update payment status." };
  }

  revalidatePath("/browse");
  revalidatePath("/host");
  revalidatePath(`/games/${parsed.data.gameId}`);
  revalidatePath("/admin");
  revalidatePath("/player");
  return { ok: true, data: null };
}

export async function setSignupRosterStatusForHost(formData: FormData): Promise<ActionResult<null>> {
  const parsed = parseHostSetSignupRosterStatusFormData(formData);
  if (!parsed.ok) return parsed;

  const sessionEmail = await getHostSessionEmail();
  if (!sessionEmail) {
    return { ok: false, error: "Sign in as host to update the roster." };
  }

  const supabase = createServerSupabase();
  const normalizedSession = sessionEmail.trim().toLowerCase();
  const nextStatus = parsed.data.status;

  const { data: game, error: gameErr } = await supabase
    .from("games")
    .select("id, owner_email, capacity, signed_count, waitlist_count")
    .eq("id", parsed.data.gameId)
    .maybeSingle<{
      id: string;
      owner_email: string;
      capacity: number;
      signed_count: number;
      waitlist_count: number;
    }>();

  if (gameErr || !game) {
    return { ok: false, error: "Game not found." };
  }

  if (game.owner_email.trim().toLowerCase() !== normalizedSession) {
    return { ok: false, error: "You can only update games you host." };
  }

  const { data: signup, error: signupErr } = await supabase
    .from("signups")
    .select("id, status")
    .eq("id", parsed.data.signupId)
    .eq("game_id", parsed.data.gameId)
    .maybeSingle<{ id: string; status: string }>();

  if (signupErr || !signup) {
    return { ok: false, error: "Sign-up not found." };
  }

  const from = signup.status as "active" | "waitlist" | "cancelled";
  if (from === nextStatus) {
    return { ok: true, data: null };
  }

  if (from === "cancelled") {
    return { ok: false, error: "Use the player portal or contact support to restore a cancelled sign-up." };
  }

  let signedCount = game.signed_count;
  let waitlistCount = game.waitlist_count;

  if (from === "active") {
    if (nextStatus === "waitlist") {
      signedCount -= 1;
      waitlistCount += 1;
    } else if (nextStatus === "cancelled") {
      signedCount -= 1;
    }
  } else if (from === "waitlist") {
    if (nextStatus === "active") {
      if (signedCount >= game.capacity) {
        return {
          ok: false,
          error: "Roster is full. Open a spot before promoting from the waitlist.",
        };
      }
      waitlistCount -= 1;
      signedCount += 1;
    } else if (nextStatus === "cancelled") {
      waitlistCount -= 1;
    }
  }

  const { error: signupUpdateErr } = await supabase
    .from("signups")
    .update({ status: nextStatus })
    .eq("id", parsed.data.signupId)
    .eq("game_id", parsed.data.gameId);

  if (signupUpdateErr) {
    return { ok: false, error: signupUpdateErr.message ?? "Could not update roster status." };
  }

  const { error: gameUpdateErr } = await supabase
    .from("games")
    .update({ signed_count: signedCount, waitlist_count: waitlistCount })
    .eq("id", parsed.data.gameId);

  if (gameUpdateErr) {
    return { ok: false, error: gameUpdateErr.message ?? "Could not sync game counts." };
  }

  revalidatePath("/browse");
  revalidatePath("/host");
  revalidatePath(`/games/${parsed.data.gameId}`);
  revalidatePath("/admin");
  revalidatePath("/player");
  return { ok: true, data: null };
}
