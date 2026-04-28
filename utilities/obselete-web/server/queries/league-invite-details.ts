import "server-only";

import { cache } from "react";

import { createAdminClient } from "@/lib/supabase/admin";

export type LeagueInviteDetails = {
  invite: {
    id: string;
    team_id: string;
    email: string;
    status: string;
    expires_at: string;
    token: string;
  };
  team: { id: string; name: string; division_id: string };
  season: {
    id: string;
    name: string;
    slug: string;
    etransfer_instructions: string;
    league_id: string;
  };
  league: { id: string; name: string; slug: string };
  waiver: { id: string; version_label: string; body_text: string } | null;
};

/**
 * Loads invite context for the public accept page (service role; token is secret).
 */
export const getLeagueInviteDetailsByToken = cache(
  async (token: string): Promise<LeagueInviteDetails | null> => {
    const trimmed = token.trim();
    if (!/^[0-9a-f-]{36}$/i.test(trimmed)) return null;

    const supabase = createAdminClient();
    const { data: invite, error: iErr } = await supabase
      .from("league_member_invites")
      .select("id, team_id, email, status, expires_at, token")
      .eq("token", trimmed)
      .maybeSingle();

    if (iErr || !invite) return null;

    const { data: team, error: tErr } = await supabase
      .from("league_teams")
      .select("id, name, division_id")
      .eq("id", invite.team_id)
      .maybeSingle();

    if (tErr || !team) return null;

    const { data: division, error: dErr } = await supabase
      .from("league_divisions")
      .select("season_id")
      .eq("id", team.division_id)
      .maybeSingle();

    if (dErr || !division) return null;

    const { data: season, error: sErr } = await supabase
      .from("league_seasons")
      .select("id, name, slug, etransfer_instructions, league_id, listed")
      .eq("id", division.season_id)
      .maybeSingle();

    if (sErr || !season || season.listed === false) return null;

    const { data: league, error: lErr } = await supabase
      .from("leagues")
      .select("id, name, slug")
      .eq("id", season.league_id)
      .maybeSingle();

    if (lErr || !league) return null;

    const { data: waiver } = await supabase
      .from("league_waiver_versions")
      .select("id, version_label, body_text")
      .eq("season_id", season.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return {
      invite: invite as LeagueInviteDetails["invite"],
      team: team as LeagueInviteDetails["team"],
      season: {
        id: season.id,
        name: season.name,
        slug: season.slug,
        etransfer_instructions: season.etransfer_instructions ?? "",
        league_id: season.league_id,
      },
      league: league as LeagueInviteDetails["league"],
      waiver: waiver
        ? (waiver as { id: string; version_label: string; body_text: string })
        : null,
    };
  }
);
