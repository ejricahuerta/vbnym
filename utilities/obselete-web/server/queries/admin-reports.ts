import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

export type AdminReportItem = {
  id: string;
  severity: "low" | "medium" | "high";
  category: "payment" | "capacity" | "data";
  title: string;
  detail: string;
  gameId: string | null;
  gameLabel: string | null;
  createdAt: string | null;
};

type SignupRow = {
  id: string;
  game_id: string;
  email: string;
  paid: boolean;
  payment_code_expires_at: string | null;
  created_at: string | null;
};

type GameRow = {
  id: string;
  location: string;
  date: string;
  cap: number;
};

export const getAdminReportsFeed = cache(async (): Promise<AdminReportItem[]> => {
  try {
    const supabase = await createClient();
    const { data: gamesData } = await supabase
      .from("games")
      .select("id, location, date, cap")
      .order("date", { ascending: false })
      .limit(300);
    const games = (gamesData ?? []) as GameRow[];
    const byGameId = new Map(games.map((game) => [game.id, game] as const));

    const gameIds = games.map((game) => game.id);
    if (gameIds.length === 0) return [];

    const { data: signupsData } = await supabase
      .from("signups")
      .select("id, game_id, email, paid, payment_code_expires_at, created_at")
      .in("game_id", gameIds)
      .order("created_at", { ascending: false });
    const signups = (signupsData ?? []) as SignupRow[];

    const nowMs = Date.now();
    const reports: AdminReportItem[] = [];
    const signupCountByGameId = new Map<string, number>();
    for (const signup of signups) {
      signupCountByGameId.set(signup.game_id, (signupCountByGameId.get(signup.game_id) ?? 0) + 1);
      const expiryMs = signup.payment_code_expires_at
        ? new Date(signup.payment_code_expires_at).getTime()
        : Number.NaN;
      if (!signup.paid && Number.isFinite(expiryMs) && expiryMs < nowMs) {
        const game = byGameId.get(signup.game_id);
        reports.push({
          id: `payment-${signup.id}`,
          severity: "medium",
          category: "payment",
          title: "Expired unpaid hold",
          detail: `${signup.email} still has an unpaid signup with an expired payment hold.`,
          gameId: signup.game_id,
          gameLabel: game ? `${game.location} (${game.date})` : null,
          createdAt: signup.created_at,
        });
      }
    }

    for (const game of games) {
      const booked = signupCountByGameId.get(game.id) ?? 0;
      if (booked > game.cap) {
        reports.push({
          id: `capacity-${game.id}`,
          severity: "high",
          category: "capacity",
          title: "Capacity exceeded",
          detail: `Booked players (${booked}) exceed cap (${game.cap}).`,
          gameId: game.id,
          gameLabel: `${game.location} (${game.date})`,
          createdAt: game.date,
        });
      }
    }

    return reports.slice(0, 150);
  } catch {
    return [];
  }
});
