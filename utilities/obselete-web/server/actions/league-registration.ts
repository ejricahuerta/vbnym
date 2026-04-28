'use server';

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendLeagueCaptainConfirmationEmail,
  sendLeagueMemberInviteEmail,
} from "@/lib/league-emails";
import type { ActionResult } from "@/types/action-result";
import { parseRegisterCaptainTeamFromFormData } from "@/types/schemas/league-form";

function registrationOpen(params: {
  opens: string | null;
  closes: string | null;
}): { ok: true } | { ok: false; error: string } {
  const now = Date.now();
  if (params.opens) {
    const t = new Date(params.opens).getTime();
    if (Number.isFinite(t) && t > now) {
      return { ok: false, error: "Registration is not open yet." };
    }
  }
  if (params.closes) {
    const t = new Date(params.closes).getTime();
    if (Number.isFinite(t) && t < now) {
      return { ok: false, error: "Registration is closed for this season." };
    }
  }
  return { ok: true };
}

export async function registerCaptainTeam(
  formData: FormData
): Promise<ActionResult<{ teamId: string }>> {
  const parsed = parseRegisterCaptainTeamFromFormData(formData);
  if (!parsed.ok) return parsed;

  const admin = createAdminClient();
  const captainEmail = parsed.data.captainEmail.trim().toLowerCase();

  const { data: season, error: sErr } = await admin
    .from("league_seasons")
    .select(
      "id, name, slug, league_id, listed, registration_opens_at, registration_closes_at"
    )
    .eq("id", parsed.data.seasonId)
    .maybeSingle();

  if (sErr || !season || season.listed === false) {
    return { ok: false, error: "Season not found or not available." };
  }

  const reg = registrationOpen({
    opens: season.registration_opens_at as string | null,
    closes: season.registration_closes_at as string | null,
  });
  if (!reg.ok) return reg;

  const { data: division, error: dErr } = await admin
    .from("league_divisions")
    .select("id, season_id")
    .eq("id", parsed.data.divisionId)
    .maybeSingle();

  if (dErr || !division || division.season_id !== season.id) {
    return { ok: false, error: "Invalid division for this season." };
  }

  const { data: league, error: lErr } = await admin
    .from("leagues")
    .select("id, name, slug")
    .eq("id", season.league_id)
    .maybeSingle();

  if (lErr || !league) {
    return { ok: false, error: "League not found." };
  }

  const { data: waiver } = await admin
    .from("league_waiver_versions")
    .select("id, version_label")
    .eq("season_id", season.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!waiver) {
    return { ok: false, error: "This season has no waiver configured yet." };
  }

  const { data: team, error: tErr } = await admin
    .from("league_teams")
    .insert({
      division_id: parsed.data.divisionId,
      name: parsed.data.teamName.trim(),
      captain_email: captainEmail,
      captain_name: parsed.data.captainName.trim(),
      status: "active",
    })
    .select("id")
    .single();

  if (tErr || !team) {
    return { ok: false, error: tErr?.message ?? "Could not create team." };
  }

  const teamId = team.id as string;

  const { data: capRow, error: capErr } = await admin
    .from("league_team_members")
    .insert({
      team_id: teamId,
      email: captainEmail,
      name: parsed.data.captainName.trim(),
      role: "captain",
    })
    .select("id")
    .single();

  if (capErr || !capRow) {
    return { ok: false, error: capErr?.message ?? "Could not save captain." };
  }

  const { error: capWaErr } = await admin
    .from("league_member_waiver_acceptances")
    .insert({
      member_id: capRow.id as string,
      waiver_version_id: waiver.id as string,
      invite_id: null,
    });

  if (capWaErr) {
    return { ok: false, error: capWaErr.message };
  }

  const roster = parsed.data.rosterEmails.filter((e) => e !== captainEmail);

  for (const email of roster) {
    let token: string | null = null;
    const { data: inserted, error: invErr } = await admin
      .from("league_member_invites")
      .insert({
        team_id: teamId,
        email,
        status: "pending",
      })
      .select("token")
      .single();

    if (!invErr && inserted) {
      token = String(inserted.token);
    } else {
      const { data: pending } = await admin
        .from("league_member_invites")
        .select("token")
        .eq("team_id", teamId)
        .eq("status", "pending")
        .ilike("email", email)
        .maybeSingle();
      if (pending?.token) token = String(pending.token);
    }

    if (!token) continue;

    await sendLeagueMemberInviteEmail({
      to: email,
      teamName: parsed.data.teamName.trim(),
      leagueName: league.name as string,
      seasonName: season.name as string,
      inviteToken: token,
      waiverVersionLabel: waiver.version_label as string,
    });
  }

  await sendLeagueCaptainConfirmationEmail({
    to: captainEmail,
    captainName: parsed.data.captainName.trim(),
    teamName: parsed.data.teamName.trim(),
    leagueName: league.name as string,
    seasonName: season.name as string,
  });

  revalidatePath("/leagues");
  revalidatePath("/app/league-team");
  return { ok: true, data: { teamId } };
}
