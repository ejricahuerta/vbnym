"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isAuthorizedAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { processWaitlistForGame } from "@/lib/waitlist";
import type { Game } from "@/types/vbnym";

export async function setSignupPaid(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  const paid = String(formData.get("paid") ?? "") === "true";
  if (!id) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAuthorizedAdmin(user)) return;

  const { error } = await supabase.from("signups").update({ paid }).eq("id", id);
  if (error) {
    console.error(error.message);
    return;
  }

  const { data: signupRow } = await supabase
    .from("signups")
    .select("game_id")
    .eq("id", id)
    .maybeSingle();
  const gameId = signupRow?.game_id as string | undefined;
  if (gameId) {
    try {
      const admin = createAdminClient();
      const { data: gameRow } = await admin
        .from("games")
        .select("*")
        .eq("id", gameId)
        .maybeSingle();
      if (gameRow) {
        await processWaitlistForGame(admin, gameRow as Game);
      }
    } catch (waitlistError) {
      const msg =
        waitlistError instanceof Error
          ? waitlistError.message
          : "Failed to process waitlist.";
      console.error(msg);
    }
  }

  revalidatePath("/admin/signups");
  revalidatePath("/");
}
