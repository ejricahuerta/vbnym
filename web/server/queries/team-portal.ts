import "server-only";

import { cache } from "react";

import { normalizeGame } from "@/lib/normalize-game";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Game } from "@/types/vbnym";

export type TeamPortalMemberRow = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  waiver_accepted: boolean;
  payment_status: "none" | "pending" | "confirmed" | "cancelled";
};

export type TeamPortalFixtureRow = {
  fixtureId: string;
  game: Game;
  homeTeamName: string | null;
  awayTeamName: string | null;
  roundNumber: number | null;
  matchday: number | null;
};

export type TeamPortalTeamBundle = {
  teamId: string;
  teamName: string;
  role: "captain" | "member";
  leagueName: string;
  seasonName: string;
  seasonSlug: string;
  leagueSlug: string;
  fixtures: TeamPortalFixtureRow[];
  roster: TeamPortalMemberRow[];
};

/**
 * All league teams this email belongs to, with schedule + roster (service role).
 */
export const getLeagueTeamPortalBundlesForEmail = cache(
  async (email: string): Promise<TeamPortalTeamBundle[]> => {
    const normalized = email.trim().toLowerCase();
    if (!normalized.includes("@")) return [];

    const supabase = createAdminClient();

    const { data: memberships, error: mErr } = await supabase
      .from("league_team_members")
      .select("id, team_id, role")
      .ilike("email", normalized);

    if (mErr || !memberships?.length) return [];

    const teamIds = [...new Set(memberships.map((m) => m.team_id as string))];

    const { data: teams, error: tErr } = await supabase
      .from("league_teams")
      .select("id, name, division_id")
      .in("id", teamIds);

    if (tErr || !teams?.length) return [];

    const divisionIds = [...new Set(teams.map((t) => t.division_id as string))];
    const { data: divisions } = await supabase
      .from("league_divisions")
      .select("id, season_id, name")
      .in("id", divisionIds);

    const divisionMap = new Map((divisions ?? []).map((d) => [d.id, d]));
    const seasonIds = [...new Set((divisions ?? []).map((d) => d.season_id as string))];

    const { data: seasons } = await supabase
      .from("league_seasons")
      .select("id, name, slug, league_id")
      .in("id", seasonIds);

    const seasonMap = new Map((seasons ?? []).map((s) => [s.id, s]));
    const leagueIds = [...new Set((seasons ?? []).map((s) => s.league_id as string))];

    const { data: leagues } = await supabase
      .from("leagues")
      .select("id, name, slug")
      .in("id", leagueIds);

    const leagueMap = new Map((leagues ?? []).map((l) => [l.id, l]));

    const bundles: TeamPortalTeamBundle[] = [];

    for (const team of teams) {
      const div = divisionMap.get(team.division_id);
      if (!div) continue;
      const season = seasonMap.get(div.season_id);
      if (!season) continue;
      const league = leagueMap.get(season.league_id);
      if (!league) continue;

      const membership = memberships.find((m) => m.team_id === team.id);
      const role =
        membership?.role === "captain" ? ("captain" as const) : ("member" as const);

      const { data: allSeasonFixtures } = await supabase
        .from("league_fixtures")
        .select(
          "id, game_id, home_team_id, away_team_id, round_number, matchday"
        )
        .eq("season_id", season.id);

      const fixtureRows = (allSeasonFixtures ?? []).filter(
        (f) => f.home_team_id === team.id || f.away_team_id === team.id
      );

      const gameIds = [...new Set(fixtureRows.map((f) => f.game_id as string))];
      const { data: gameRows } =
        gameIds.length > 0
          ? await supabase.from("games").select("*").in("id", gameIds)
          : { data: [] as Record<string, unknown>[] };

      const gamesById = new Map(
        (gameRows ?? []).map((g) => [g.id as string, normalizeGame(g as Game)])
      );

      const teamIdsOnCard = new Set<string>();
      for (const f of fixtureRows) {
        if (f.home_team_id) teamIdsOnCard.add(f.home_team_id as string);
        if (f.away_team_id) teamIdsOnCard.add(f.away_team_id as string);
      }
      const { data: nameRows } =
        teamIdsOnCard.size > 0
          ? await supabase
              .from("league_teams")
              .select("id, name")
              .in("id", [...teamIdsOnCard])
          : { data: [] as { id: string; name: string }[] };

      const teamNameById = new Map(
        (nameRows ?? []).map((t) => [t.id as string, t.name as string])
      );

      const fixtures: TeamPortalFixtureRow[] = fixtureRows
        .map((f) => {
          const g = gamesById.get(f.game_id as string);
          if (!g) return null;
          return {
            fixtureId: f.id as string,
            game: g,
            homeTeamName: f.home_team_id
              ? teamNameById.get(f.home_team_id as string) ?? null
              : null,
            awayTeamName: f.away_team_id
              ? teamNameById.get(f.away_team_id as string) ?? null
              : null,
            roundNumber: (f.round_number as number | null) ?? null,
            matchday: (f.matchday as number | null) ?? null,
          };
        })
        .filter(Boolean) as TeamPortalFixtureRow[];

      fixtures.sort(
        (a, b) =>
          new Date(a.game.date).getTime() - new Date(b.game.date).getTime() ||
          (a.game.time ?? "").localeCompare(b.game.time ?? "")
      );

      const { data: rosterMembers } = await supabase
        .from("league_team_members")
        .select("id, email, name, role")
        .eq("team_id", team.id);

      const memberIds = (rosterMembers ?? []).map((r) => r.id as string);

      const { data: acceptances } =
        memberIds.length > 0
          ? await supabase
              .from("league_member_waiver_acceptances")
              .select("member_id")
              .in("member_id", memberIds)
          : { data: [] as { member_id: string }[] };

      const acceptedSet = new Set((acceptances ?? []).map((a) => a.member_id));

      const { data: payments } =
        memberIds.length > 0
          ? await supabase
              .from("league_member_payments")
              .select("member_id, status")
              .in("member_id", memberIds)
          : { data: [] as { member_id: string; status: string }[] };

      const paymentByMember = new Map<string, string>();
      for (const p of payments ?? []) {
        paymentByMember.set(p.member_id, p.status);
      }

      const roster: TeamPortalMemberRow[] = (rosterMembers ?? []).map((r) => {
        const st = paymentByMember.get(r.id as string);
        let paymentStatus: TeamPortalMemberRow["payment_status"] = "none";
        if (st === "pending") paymentStatus = "pending";
        else if (st === "confirmed") paymentStatus = "confirmed";
        else if (st === "cancelled") paymentStatus = "cancelled";

        return {
          id: r.id as string,
          email: r.email as string,
          name: (r.name as string | null) ?? null,
          role: r.role as string,
          waiver_accepted: acceptedSet.has(r.id as string),
          payment_status: paymentStatus,
        };
      });

      roster.sort((a, b) => {
        if (a.role === "captain" && b.role !== "captain") return -1;
        if (b.role === "captain" && a.role !== "captain") return 1;
        return a.email.localeCompare(b.email);
      });

      bundles.push({
        teamId: team.id as string,
        teamName: team.name as string,
        role,
        leagueName: league.name as string,
        seasonName: season.name as string,
        seasonSlug: season.slug as string,
        leagueSlug: league.slug as string,
        fixtures,
        roster,
      });
    }

    bundles.sort((a, b) => a.leagueName.localeCompare(b.leagueName));
    return bundles;
  }
);
