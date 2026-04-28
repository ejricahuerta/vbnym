import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

export const getAdminHasSignupForGame = cache(
  async (gameId: string, adminEmail: string | null): Promise<boolean> => {
    const normalized = adminEmail?.trim().toLowerCase() ?? "";
    if (!normalized) return false;

    const supabase = await createClient();
    const { data: selfRows } = await supabase
      .from("signups")
      .select("id")
      .eq("game_id", gameId)
      .eq("email", normalized)
      .limit(1);
    return Boolean(selfRows?.length);
  }
);
