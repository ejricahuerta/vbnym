import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { Game, Signup } from "@/types/vbnym";

export const getAdminSignupsPageData = cache(
  async (): Promise<{
    list: Signup[];
    err: string | null;
    gameById: Record<string, Pick<Game, "id" | "location" | "date" | "court">>;
  }> => {
    let list: Signup[] = [];
    let err: string | null = null;
    const gameById: Record<string, Pick<Game, "id" | "location" | "date" | "court">> = {};

    try {
      const supabase = await createClient();
      const { data: signups, error: sErr } = await supabase
        .from("signups")
        .select("*")
        .order("created_at", { ascending: false });
      const { data: games, error: rErr } = await supabase
        .from("games")
        .select("id, location, date, court");

      err = sErr?.message ?? rErr?.message ?? null;
      list = (signups ?? []) as Signup[];
      for (const r of (games ?? []) as Pick<Game, "id" | "location" | "date" | "court">[]) {
        gameById[r.id] = r;
      }
    } catch (e) {
      err = e instanceof Error ? e.message : "Could not load signups.";
    }

    return { list, err, gameById };
  }
);
