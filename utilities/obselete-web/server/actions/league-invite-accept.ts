'use server';

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createLeaguePaymentReferenceCode } from "@/lib/league-payment-code";
import { sendLeaguePaymentInstructionsEmail } from "@/lib/league-emails";
import type { ActionResult } from "@/types/action-result";
import { parseAcceptLeagueInviteFromFormData } from "@/types/schemas/league-form";

export async function acceptLeagueInvite(
  formData: FormData
): Promise<ActionResult<{ referenceCode: string }>> {
  const parsed = parseAcceptLeagueInviteFromFormData(formData);
  if (!parsed.ok) return parsed;

  const admin = createAdminClient();
  const token = parsed.data.token;

  const { data: invite, error: iErr } = await admin
    .from("league_member_invites")
    .select("id, team_id, email, status, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (iErr || !invite) {
    return { ok: false, error: "Invite not found." };
  }

  if (invite.status === "accepted") {
    return { ok: false, error: "This invite was already used." };
  }

  if (invite.status !== "pending") {
    return { ok: false, error: "This invite is no longer valid." };
  }

  const exp = new Date(invite.expires_at as string).getTime();
  if (Number.isFinite(exp) && exp < Date.now()) {
    await admin
      .from("league_member_invites")
      .update({ status: "expired" })
      .eq("id", invite.id);
    return { ok: false, error: "This invite has expired." };
  }

  const { data: team, error: tErr } = await admin
    .from("league_teams")
    .select("id, name, division_id")
    .eq("id", invite.team_id)
    .maybeSingle();

  if (tErr || !team) {
    return { ok: false, error: "Team not found." };
  }

  const { data: division, error: dErr } = await admin
    .from("league_divisions")
    .select("season_id")
    .eq("id", team.division_id)
    .maybeSingle();

  if (dErr || !division) {
    return { ok: false, error: "Division not found." };
  }

  const { data: season, error: sErr } = await admin
    .from("league_seasons")
    .select("id, name, etransfer_instructions, listed, league_id")
    .eq("id", division.season_id)
    .maybeSingle();

  if (sErr || !season || season.listed === false) {
    return { ok: false, error: "Season not available." };
  }

  const { data: league, error: lErr } = await admin
    .from("leagues")
    .select("name")
    .eq("id", season.league_id as string)
    .maybeSingle();

  if (lErr || !league) {
    return { ok: false, error: "League not found." };
  }

  const { data: waiver, error: wErr } = await admin
    .from("league_waiver_versions")
    .select("id, version_label")
    .eq("season_id", season.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (wErr || !waiver) {
    return { ok: false, error: "Waiver is not configured for this season." };
  }

  const inviteEmail = (invite.email as string).trim().toLowerCase();

  const { data: existingMember } = await admin
    .from("league_team_members")
    .select("id")
    .eq("team_id", team.id)
    .ilike("email", inviteEmail)
    .maybeSingle();

  let memberId: string;

  if (existingMember) {
    memberId = existingMember.id as string;
    await admin
      .from("league_team_members")
      .update({ name: parsed.data.name.trim() })
      .eq("id", memberId);
  } else {
    const { data: inserted, error: mErr } = await admin
      .from("league_team_members")
      .insert({
        team_id: team.id,
        email: inviteEmail,
        name: parsed.data.name.trim(),
        role: "member",
      })
      .select("id")
      .single();

    if (mErr || !inserted) {
      return { ok: false, error: mErr?.message ?? "Could not save roster member." };
    }
    memberId = inserted.id as string;
  }

  const { data: existingAccept } = await admin
    .from("league_member_waiver_acceptances")
    .select("id")
    .eq("member_id", memberId)
    .eq("waiver_version_id", waiver.id)
    .maybeSingle();

  if (!existingAccept) {
    const { error: aErr } = await admin.from("league_member_waiver_acceptances").insert({
      member_id: memberId,
      waiver_version_id: waiver.id,
      invite_id: invite.id,
    });
    if (aErr) {
      return { ok: false, error: aErr.message };
    }
  }

  const { data: existingPay } = await admin
    .from("league_member_payments")
    .select("id, reference_code, status")
    .eq("member_id", memberId)
    .maybeSingle();

  let referenceCode: string;
  let shouldEmailPayment = true;

  if (existingPay) {
    referenceCode = existingPay.reference_code as string;
    shouldEmailPayment = existingPay.status === "pending";
  } else {
    referenceCode = createLeaguePaymentReferenceCode();
    const { error: pErr } = await admin.from("league_member_payments").insert({
      member_id: memberId,
      reference_code: referenceCode,
      status: "pending",
      etransfer_to: null,
    });
    if (pErr) {
      return { ok: false, error: pErr.message };
    }
  }

  await admin
    .from("league_member_invites")
    .update({
      status: "accepted",
      consumed_at: new Date().toISOString(),
    })
    .eq("id", invite.id);

  if (shouldEmailPayment) {
    const etransfer =
      (season.etransfer_instructions as string)?.trim() ||
      "The organizer will send e-transfer details separately.";
    const sent = await sendLeaguePaymentInstructionsEmail({
      to: inviteEmail,
      name: parsed.data.name.trim(),
      teamName: team.name as string,
      leagueName: league.name as string,
      seasonName: season.name as string,
      referenceCode,
      etransferInstructions: etransfer,
      waiverVersionLabel: waiver.version_label as string,
    });
    if (!sent.ok) {
      return { ok: false, error: sent.error };
    }
  }

  revalidatePath("/app/league-team");
  revalidatePath("/leagues");
  return { ok: true, data: { referenceCode } };
}
