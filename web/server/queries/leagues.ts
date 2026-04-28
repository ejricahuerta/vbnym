import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

export type LeagueRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  created_at: string;
};

export type LeagueSeasonRow = {
  id: string;
  league_id: string;
  slug: string;
  name: string;
  description: string | null;
  listed: boolean;
  etransfer_instructions: string;
  registration_opens_at: string | null;
  registration_closes_at: string | null;
  created_at: string;
};

export type LeagueDivisionRow = {
  id: string;
  season_id: string;
  name: string;
  sort_order: number;
  created_at: string;
};

export const listPublicLeagues = cache(async (): Promise<LeagueRow[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leagues")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as LeagueRow[];
});

export const getLeagueBySlug = cache(
  async (slug: string): Promise<LeagueRow | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("leagues")
      .select("*")
      .eq("slug", slug.trim().toLowerCase())
      .maybeSingle();

    if (error || !data) return null;
    return data as LeagueRow;
  }
);

export const getPublicSeasonBySlugs = cache(
  async (leagueSlug: string, seasonSlug: string): Promise<{
    league: LeagueRow;
    season: LeagueSeasonRow;
    divisions: LeagueDivisionRow[];
  } | null> => {
    const league = await getLeagueBySlug(leagueSlug);
    if (!league) return null;

    const supabase = await createClient();
    const { data: season, error: sErr } = await supabase
      .from("league_seasons")
      .select("*")
      .eq("league_id", league.id)
      .eq("slug", seasonSlug.trim().toLowerCase())
      .maybeSingle();

    if (sErr || !season) return null;
    const seasonRow = season as LeagueSeasonRow;
    if (seasonRow.listed === false) return null;

    const { data: divisions } = await supabase
      .from("league_divisions")
      .select("*")
      .eq("season_id", seasonRow.id)
      .order("sort_order", { ascending: true });

    return {
      league,
      season: seasonRow,
      divisions: (divisions ?? []) as LeagueDivisionRow[],
    };
  }
);

export const getLatestWaiverVersionForSeason = cache(
  async (seasonId: string): Promise<{
    id: string;
    version_label: string;
    body_text: string;
  } | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("league_waiver_versions")
      .select("id, version_label, body_text")
      .eq("season_id", seasonId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return data as { id: string; version_label: string; body_text: string };
  }
);
