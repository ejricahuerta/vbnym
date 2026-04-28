import "server-only";

import { cache } from "react";

import { createServerSupabase } from "@/lib/supabase-server";

export const getAdminOverview = cache(
  async (): Promise<{ games: number; signups: number; paid: number; waitlist: number }> => {
    try {
      const supabase = createServerSupabase();
      const [{ count: games }, { count: signups }, { count: paid }, { count: waitlist }] = await Promise.all([
        supabase.from("games").select("id", { count: "exact", head: true }),
        supabase.from("signups").select("id", { count: "exact", head: true }),
        supabase.from("signups").select("id", { count: "exact", head: true }).eq("payment_status", "paid"),
        supabase.from("signups").select("id", { count: "exact", head: true }).eq("status", "waitlist"),
      ]);
      return {
        games: games ?? 0,
        signups: signups ?? 0,
        paid: paid ?? 0,
        waitlist: waitlist ?? 0,
      };
    } catch {
      return { games: 0, signups: 0, paid: 0, waitlist: 0 };
    }
  }
);
