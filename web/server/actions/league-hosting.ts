'use server';

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAuthorizedAdmin } from "@/lib/auth";
import { seasonHasActivePermitOnDate } from "@/lib/league-permits";
import type { ActionResult } from "@/types/action-result";
import {
  parseAttachFixtureFromFormData,
  parseCreateLeagueFromFormData,
  parseCreateLeagueSeasonFromFormData,
  parseFacilityPermitFromFormData,
} from "@/types/schemas/league-form";

export async function createLeague(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAuthorizedAdmin(user)) {
    return { ok: false, error: "Admin login required." };
  }

  const parsed = parseCreateLeagueFromFormData(formData);
  if (!parsed.ok) return parsed;

  const { data, error } = await supabase
    .from("leagues")
    .insert({
      slug: parsed.data.slug.trim().toLowerCase(),
      name: parsed.data.name.trim(),
      description: parsed.data.description?.trim() || null,
    })
    .select("id")
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/leagues");
  revalidatePath("/leagues");
  return { ok: true, data: { id: data.id as string } };
}

export async function createLeagueSeason(
  formData: FormData
): Promise<ActionResult<{ seasonId: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAuthorizedAdmin(user)) {
    return { ok: false, error: "Admin login required." };
  }

  const parsed = parseCreateLeagueSeasonFromFormData(formData);
  if (!parsed.ok) return parsed;

  const d = parsed.data;

  const { data: season, error: sErr } = await supabase
    .from("league_seasons")
    .insert({
      league_id: d.leagueId,
      slug: d.slug.trim().toLowerCase(),
      name: d.name.trim(),
      description: d.description?.trim() || null,
      listed: d.listed,
      etransfer_instructions: d.etransferInstructions.trim(),
    })
    .select("id")
    .single();

  if (sErr || !season) {
    return { ok: false, error: sErr?.message ?? "Could not create season." };
  }

  const seasonId = season.id as string;

  const { error: wErr } = await supabase.from("league_waiver_versions").insert({
    season_id: seasonId,
    version_label: d.waiverVersionLabel.trim(),
    body_text: d.waiverBody.trim(),
  });

  if (wErr) {
    return { ok: false, error: wErr.message };
  }

  const { error: dErr } = await supabase.from("league_divisions").insert({
    season_id: seasonId,
    name: d.divisionName.trim(),
    sort_order: 0,
  });

  if (dErr) {
    return { ok: false, error: dErr.message };
  }

  revalidatePath("/admin/leagues");
  revalidatePath("/leagues");
  return { ok: true, data: { seasonId } };
}

export async function createFacilityPermit(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAuthorizedAdmin(user)) {
    return { ok: false, error: "Admin login required." };
  }

  const parsed = parseFacilityPermitFromFormData(formData);
  if (!parsed.ok) return parsed;

  const p = parsed.data;

  const { data, error } = await supabase
    .from("facility_permits")
    .insert({
      season_id: p.seasonId,
      issuer_type: p.issuerType,
      reference_number: p.referenceNumber?.trim() || null,
      status: p.status,
      valid_from: p.validFrom?.trim() || null,
      valid_to: p.validTo?.trim() || null,
      notes: p.notes?.trim() || null,
      document_url: p.documentUrl ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not save permit." };
  }

  revalidatePath("/admin/leagues");
  return { ok: true, data: { id: data.id as string } };
}

export async function attachLeagueFixture(
  formData: FormData
): Promise<ActionResult<{ fixtureId: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAuthorizedAdmin(user)) {
    return { ok: false, error: "Admin login required." };
  }

  const parsed = parseAttachFixtureFromFormData(formData);
  if (!parsed.ok) return parsed;

  const admin = createAdminClient();
  const okPermit = await seasonHasActivePermitOnDate(
    admin,
    parsed.data.seasonId,
    new Date()
  );
  if (!okPermit) {
    return {
      ok: false,
      error:
        "This season needs at least one active facility permit (valid dates, status active) before linking games.",
    };
  }

  const { data: game, error: gErr } = await supabase
    .from("games")
    .select("id")
    .eq("id", parsed.data.gameId)
    .maybeSingle();

  if (gErr || !game) {
    return { ok: false, error: "Game not found." };
  }

  const { data: existing } = await supabase
    .from("league_fixtures")
    .select("id")
    .eq("game_id", parsed.data.gameId)
    .maybeSingle();

  if (existing) {
    return { ok: false, error: "That game is already linked to a league fixture." };
  }

  const { data: fx, error: fErr } = await supabase
    .from("league_fixtures")
    .insert({
      season_id: parsed.data.seasonId,
      home_team_id: parsed.data.homeTeamId,
      away_team_id: parsed.data.awayTeamId,
      game_id: parsed.data.gameId,
      round_number: parsed.data.roundNumber,
      matchday: parsed.data.matchday,
      notes: parsed.data.notes?.trim() || null,
    })
    .select("id")
    .single();

  if (fErr || !fx) {
    return { ok: false, error: fErr?.message ?? "Could not create fixture." };
  }

  revalidatePath("/admin/leagues");
  revalidatePath("/leagues");
  revalidatePath("/app/league-team");
  return { ok: true, data: { fixtureId: fx.id as string } };
}
