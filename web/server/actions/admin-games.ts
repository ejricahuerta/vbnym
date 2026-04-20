'use server';

import { revalidatePath } from "next/cache";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isAuthorizedAdmin } from "@/lib/auth";
import { parseAdminGameFormFromFormData } from "@/types/schemas/game-form";
import type { ActionResult } from "@/types/action-result";

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

function organizerDisplayName(user: User): string {
  const meta = user.user_metadata ?? {};
  const full =
    typeof meta.full_name === "string" ? meta.full_name.trim() : "";
  const short = typeof meta.name === "string" ? meta.name.trim() : "";
  if (full) return full;
  if (short) return short;
  const email = user.email?.trim() ?? "";
  const local = email.split("@")[0]?.replace(/[._]+/g, " ").trim();
  return local || "Organizer";
}

async function insertOrganizerSignupIfMissing(
  supabase: ServerSupabase,
  opts: { gameId: string; email: string; name: string }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const email = opts.email.trim().toLowerCase();
  const { data: existing } = await supabase
    .from("signups")
    .select("id")
    .eq("game_id", opts.gameId)
    .eq("email", email)
    .maybeSingle();
  if (existing) return { ok: true };

  const { error } = await supabase.from("signups").insert({
    game_id: opts.gameId,
    name: opts.name,
    email,
    friends: [],
    paid: true,
    payment_code: null,
    payment_code_expires_at: null,
    phone: null,
    waiver_accepted: true,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function createGame(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAuthorizedAdmin(user)) {
    return { ok: false, error: "Admin login required." };
  }

  const parsed = parseAdminGameFormFromFormData(formData);
  if (!parsed.ok) return parsed;

  if (parsed.data.admin_will_play) {
    const email = user.email?.trim().toLowerCase();
    if (!email) {
      return {
        ok: false,
        error:
          'Your account has no email, so you cannot be added as a player. Uncheck "I\'m playing" or use an account with an email.',
      };
    }
  }

  const { data: inserted, error } = await supabase
    .from("games")
    .insert(parsed.data.payload as never)
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  const gameId = inserted?.id as string | undefined;
  if (!gameId) return { ok: false, error: "Game was not created." };

  if (parsed.data.admin_will_play && user.email) {
    const added = await insertOrganizerSignupIfMissing(supabase, {
      gameId,
      email: user.email,
      name: organizerDisplayName(user),
    });
    if (!added.ok) {
      return {
        ok: false,
        error: `Game was created, but you could not be added as a player: ${added.error}. You can remove the empty game from admin or add yourself from the signup page.`,
      };
    }
  }

  revalidatePath("/admin/games");
  revalidatePath("/admin/signups");
  revalidatePath("/", "page");
  revalidatePath("/app");
  if (parsed.data.admin_will_play) {
    revalidatePath(`/app/games/${gameId}`);
  }
  return { ok: true, data: { id: gameId } };
}

export async function updateGame(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAuthorizedAdmin(user)) {
    return { ok: false, error: "Admin login required." };
  }

  const parsed = parseAdminGameFormFromFormData(formData);
  if (!parsed.ok) return parsed;
  if (!parsed.data.id) {
    return { ok: false, error: "Missing game id." };
  }

  if (parsed.data.admin_will_play) {
    const email = user.email?.trim().toLowerCase();
    if (!email) {
      return {
        ok: false,
        error:
          'Your account has no email, so you cannot be added as a player. Uncheck "I\'m playing" or use an account with an email.',
      };
    }
  }

  const { error } = await supabase
    .from("games")
    .update(parsed.data.payload as never)
    .eq("id", parsed.data.id);

  if (error) return { ok: false, error: error.message };

  if (parsed.data.admin_will_play && user.email) {
    const added = await insertOrganizerSignupIfMissing(supabase, {
      gameId: parsed.data.id,
      email: user.email,
      name: organizerDisplayName(user),
    });
    if (!added.ok) {
      return {
        ok: false,
        error: `Game was saved, but you could not be added as a player: ${added.error}. Try again from the public game page if there is still room.`,
      };
    }
  }

  revalidatePath("/admin/games");
  revalidatePath("/admin/signups");
  revalidatePath(`/admin/games/${parsed.data.id}/edit`);
  revalidatePath(`/app/games/${parsed.data.id}`);
  revalidatePath("/", "page");
  revalidatePath("/app");
  return { ok: true, data: { id: parsed.data.id } };
}

export async function deleteGame(formData: FormData): Promise<ActionResult<null>> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { ok: false, error: "Missing game id." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAuthorizedAdmin(user)) {
    return { ok: false, error: "Admin login required." };
  }

  const { error } = await supabase.from("games").delete().eq("id", id);
  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/games");
  revalidatePath("/", "page");
  revalidatePath("/app");
  return { ok: true, data: null };
}
