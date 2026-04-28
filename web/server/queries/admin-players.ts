import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

export type AdminPlayerMetric = {
  email: string;
  name: string;
  totalSignups: number;
  paidCount: number;
  unpaidCount: number;
  latestGameDate: string | null;
  latestSignupAt: string | null;
};

type SignupRow = {
  email: string;
  name: string;
  paid: boolean;
  game_id: string;
  created_at: string | null;
};

type GameRefRow = {
  id: string;
  date: string;
};

export const getAdminPlayersMetrics = cache(async (): Promise<AdminPlayerMetric[]> => {
  try {
    const supabase = await createClient();
    const { data: signupsData, error: signupsError } = await supabase
      .from("signups")
      .select("email, name, paid, game_id, created_at")
      .order("created_at", { ascending: false })
      .limit(2000);
    if (signupsError) return [];

    const signups = (signupsData ?? []) as SignupRow[];
    if (signups.length === 0) return [];

    const gameIds = [...new Set(signups.map((signup) => signup.game_id))];
    const { data: gamesData } = await supabase
      .from("games")
      .select("id, date")
      .in("id", gameIds);
    const dateByGameId = new Map(
      ((gamesData ?? []) as GameRefRow[]).map((game) => [game.id, game.date] as const)
    );

    const byPlayer = new Map<string, AdminPlayerMetric>();
    for (const signup of signups) {
      const email = signup.email?.trim().toLowerCase();
      if (!email) continue;
      const metric = byPlayer.get(email) ?? {
        email,
        name: signup.name?.trim() || email,
        totalSignups: 0,
        paidCount: 0,
        unpaidCount: 0,
        latestGameDate: null,
        latestSignupAt: null,
      };
      metric.totalSignups += 1;
      if (signup.paid) metric.paidCount += 1;
      else metric.unpaidCount += 1;
      const gameDate = dateByGameId.get(signup.game_id) ?? null;
      if (gameDate && (!metric.latestGameDate || gameDate > metric.latestGameDate)) {
        metric.latestGameDate = gameDate;
      }
      if (signup.created_at && (!metric.latestSignupAt || signup.created_at > metric.latestSignupAt)) {
        metric.latestSignupAt = signup.created_at;
      }
      byPlayer.set(email, metric);
    }

    return Array.from(byPlayer.values()).sort((a, b) => b.totalSignups - a.totalSignups);
  } catch {
    return [];
  }
});
