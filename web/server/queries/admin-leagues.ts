import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

import type { LeagueRow, LeagueSeasonRow } from "@/server/queries/leagues";

export const getLeagueByIdForAdmin = cache(
  async (leagueId: string): Promise<LeagueRow | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("leagues")
      .select("*")
      .eq("id", leagueId)
      .maybeSingle();
    if (error || !data) return null;
    return data as LeagueRow;
  }
);

export const getSeasonByIdForAdmin = cache(
  async (seasonId: string): Promise<LeagueSeasonRow | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("league_seasons")
      .select("*")
      .eq("id", seasonId)
      .maybeSingle();
    if (error || !data) return null;
    return data as LeagueSeasonRow;
  }
);

export const listFacilityPermitsForSeasonAdmin = cache(
  async (seasonId: string) => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("facility_permits")
      .select("*")
      .eq("season_id", seasonId)
      .order("created_at", { ascending: false });
    return data ?? [];
  }
);

export const listLeaguesForAdmin = cache(async (): Promise<LeagueRow[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leagues")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as LeagueRow[];
});

export const listSeasonsForLeagueAdmin = cache(
  async (leagueId: string): Promise<LeagueSeasonRow[]> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("league_seasons")
      .select("*")
      .eq("league_id", leagueId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data as LeagueSeasonRow[];
  }
);

export type LeaguePendingPaymentRow = {
  payment_id: string;
  reference_code: string;
  status: string;
  member_email: string;
  member_name: string | null;
  team_name: string;
};

export type LeagueTeamOptionRow = { id: string; name: string; division_id: string };

export const listTeamsForSeasonAdmin = cache(
  async (seasonId: string): Promise<LeagueTeamOptionRow[]> => {
    const supabase = await createClient();
    const { data: divisions } = await supabase
      .from("league_divisions")
      .select("id")
      .eq("season_id", seasonId);

    const divisionIds = (divisions ?? []).map((d) => d.id as string);
    if (divisionIds.length === 0) return [];

    const { data: teams } = await supabase
      .from("league_teams")
      .select("id, name, division_id")
      .in("division_id", divisionIds)
      .order("name", { ascending: true });

    return (teams ?? []) as LeagueTeamOptionRow[];
  }
);

export const listPendingLeaguePaymentsForSeason = cache(
  async (seasonId: string): Promise<LeaguePendingPaymentRow[]> => {
    const supabase = await createClient();
    const { data: divisions } = await supabase
      .from("league_divisions")
      .select("id")
      .eq("season_id", seasonId);

    const divisionIds = (divisions ?? []).map((d) => d.id as string);
    if (divisionIds.length === 0) return [];

    const { data: teams } = await supabase
      .from("league_teams")
      .select("id, name")
      .in("division_id", divisionIds);

    const teamIds = (teams ?? []).map((t) => t.id as string);
    const teamNameById = new Map(
      (teams ?? []).map((t) => [t.id as string, t.name as string])
    );
    if (teamIds.length === 0) return [];

    const { data: members } = await supabase
      .from("league_team_members")
      .select("id, team_id, email, name")
      .in("team_id", teamIds);

    const memberIds = (members ?? []).map((m) => m.id as string);
    if (memberIds.length === 0) return [];

    const { data: payments } = await supabase
      .from("league_member_payments")
      .select("id, member_id, reference_code, status")
      .in("member_id", memberIds)
      .eq("status", "pending");

    const memberById = new Map(
      (members ?? []).map((m) => [
        m.id as string,
        {
          team_id: m.team_id as string,
          email: m.email as string,
          name: (m.name as string | null) ?? null,
        },
      ])
    );

    const rows: LeaguePendingPaymentRow[] = [];
    for (const p of payments ?? []) {
      const m = memberById.get(p.member_id as string);
      if (!m) continue;
      rows.push({
        payment_id: p.id as string,
        reference_code: p.reference_code as string,
        status: p.status as string,
        member_email: m.email,
        member_name: m.name,
        team_name: teamNameById.get(m.team_id) ?? "Team",
      });
    }

    return rows;
  }
);
