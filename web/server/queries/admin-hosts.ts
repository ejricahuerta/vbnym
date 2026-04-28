import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

export type AdminHostMetric = {
  hostKey: string;
  payoutEmail: string;
  gameCount: number;
  totalCapacity: number;
  totalBooked: number;
  upcomingCount: number;
  lastGameDate: string | null;
};

type GameRow = {
  id: string;
  date: string;
  cap: number;
  etransfer: string;
};

type SignupRow = {
  game_id: string;
};

export const getAdminHostsMetrics = cache(async (): Promise<AdminHostMetric[]> => {
  try {
    const supabase = await createClient();
    const { data: gamesData, error: gamesError } = await supabase
      .from("games")
      .select("id, date, cap, etransfer")
      .order("date", { ascending: false });
    if (gamesError) return [];

    const games = (gamesData ?? []) as GameRow[];
    if (games.length === 0) return [];

    const gameIds = games.map((game) => game.id);
    const { data: signupData } = await supabase
      .from("signups")
      .select("game_id")
      .in("game_id", gameIds);

    const signupCountByGameId = new Map<string, number>();
    for (const row of (signupData ?? []) as SignupRow[]) {
      signupCountByGameId.set(row.game_id, (signupCountByGameId.get(row.game_id) ?? 0) + 1);
    }

    const now = Date.now();
    const byHost = new Map<string, AdminHostMetric>();
    for (const game of games) {
      const payoutEmail = game.etransfer?.trim().toLowerCase() || "unassigned@6ixback.com";
      const hostKey = payoutEmail;
      const booked = signupCountByGameId.get(game.id) ?? 0;
      const dateMs = new Date(game.date).getTime();
      const metric = byHost.get(hostKey) ?? {
        hostKey,
        payoutEmail,
        gameCount: 0,
        totalCapacity: 0,
        totalBooked: 0,
        upcomingCount: 0,
        lastGameDate: null,
      };
      metric.gameCount += 1;
      metric.totalCapacity += Number(game.cap) || 0;
      metric.totalBooked += booked;
      if (Number.isFinite(dateMs) && dateMs >= now) {
        metric.upcomingCount += 1;
      }
      if (!metric.lastGameDate || game.date > metric.lastGameDate) {
        metric.lastGameDate = game.date;
      }
      byHost.set(hostKey, metric);
    }

    return Array.from(byHost.values()).sort((a, b) => b.gameCount - a.gameCount);
  } catch {
    return [];
  }
});
