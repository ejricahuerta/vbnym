import { z } from "zod";

import type { ActionResult } from "@/types/action-result";

const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i, "Use letters, numbers, and hyphens only.");

const emailSchema = z.string().trim().email();

export const createLeagueFormSchema = z.object({
  slug: slugSchema,
  name: z.string().trim().min(2).max(200),
  description: z.string().trim().max(10_000).optional().default(""),
});

export type CreateLeagueFormInput = z.infer<typeof createLeagueFormSchema>;

export const createLeagueSeasonFormSchema = z.object({
  leagueId: z.string().uuid(),
  slug: slugSchema,
  name: z.string().trim().min(2).max(200),
  description: z.string().trim().max(10_000).optional().default(""),
  listed: z.boolean().optional().default(true),
  etransferInstructions: z.string().trim().max(8000).optional().default(""),
  waiverVersionLabel: z.string().trim().min(1).max(80),
  waiverBody: z.string().trim().min(20).max(50_000),
  divisionName: z.string().trim().min(1).max(120).optional().default("Open"),
});

export type CreateLeagueSeasonFormInput = z.infer<typeof createLeagueSeasonFormSchema>;

export const createFacilityPermitFormSchema = z.object({
  seasonId: z.string().uuid(),
  issuerType: z.enum(["city", "school_board", "private_facility"]),
  referenceNumber: z.string().trim().max(200).optional().default(""),
  status: z.enum(["draft", "active", "expired", "cancelled"]).default("active"),
  validFrom: z.preprocess(
    (v) => (v === "" || v == null ? null : v),
    z.string().nullable()
  ),
  validTo: z.preprocess(
    (v) => (v === "" || v == null ? null : v),
    z.string().nullable()
  ),
  notes: z.string().trim().max(5000).optional().default(""),
  documentUrl: z
    .preprocess(
      (v) => (typeof v === "string" && v.trim() === "" ? null : v),
      z.string().url().max(2000).nullable()
    )
    .optional(),
});

export type CreateFacilityPermitFormInput = z.infer<typeof createFacilityPermitFormSchema>;

const emptyToNullUuid = z.preprocess(
  (v) => (v === "" || v == null ? null : v),
  z.string().uuid().nullable()
);

export const attachLeagueFixtureFormSchema = z.object({
  seasonId: z.string().uuid(),
  gameId: z.string().uuid(),
  homeTeamId: emptyToNullUuid.optional(),
  awayTeamId: emptyToNullUuid.optional(),
  roundNumber: z.preprocess(
    (v) => (v === "" || v == null ? null : v),
    z.coerce.number().int().min(0).max(999).nullable()
  ),
  matchday: z.preprocess(
    (v) => (v === "" || v == null ? null : v),
    z.coerce.number().int().min(0).max(999).nullable()
  ),
  notes: z.string().trim().max(2000).optional().default(""),
});

export type AttachLeagueFixtureFormInput = z.infer<typeof attachLeagueFixtureFormSchema>;

export const registerCaptainTeamFormSchema = z.object({
  seasonId: z.string().uuid(),
  divisionId: z.string().uuid(),
  teamName: z.string().trim().min(2).max(120),
  captainName: z.string().trim().min(2).max(120),
  captainEmail: emailSchema,
  rosterEmails: z
    .string()
    .trim()
    .optional()
    .default("")
    .transform((raw) => {
      const parts = raw
        .split(/[\n,;]+/)
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      return [...new Set(parts)];
    })
    .pipe(z.array(emailSchema).max(30)),
  termsAccepted: z.boolean().refine((v) => v, "You must accept the terms."),
});

export type RegisterCaptainTeamFormInput = z.infer<typeof registerCaptainTeamFormSchema>;

export const acceptLeagueInviteFormSchema = z.object({
  token: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
  waiverAccepted: z.boolean().refine((v) => v, "You must accept the waiver."),
});

export type AcceptLeagueInviteFormInput = z.infer<typeof acceptLeagueInviteFormSchema>;

export const confirmLeagueMemberPaymentFormSchema = z.object({
  paymentId: z.string().uuid(),
});

export type ConfirmLeagueMemberPaymentFormInput = z.infer<
  typeof confirmLeagueMemberPaymentFormSchema
>;

function fieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".") || "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export function parseCreateLeagueFromFormData(
  formData: FormData
): ActionResult<CreateLeagueFormInput> {
  const raw = {
    slug: formData.get("slug"),
    name: formData.get("name"),
    description: formData.get("description") ?? "",
  };
  const parsed = createLeagueFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Invalid league details.", fieldErrors: fieldErrors(parsed.error) };
  }
  return { ok: true, data: parsed.data };
}

export function parseCreateLeagueSeasonFromFormData(
  formData: FormData
): ActionResult<CreateLeagueSeasonFormInput> {
  const raw = {
    leagueId: formData.get("league_id"),
    slug: formData.get("slug"),
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    listed: formData.get("listed") === "on",
    etransferInstructions: formData.get("etransfer_instructions") ?? "",
    waiverVersionLabel: formData.get("waiver_version_label"),
    waiverBody: formData.get("waiver_body"),
    divisionName: formData.get("division_name") ?? "Open",
  };
  const parsed = createLeagueSeasonFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Invalid season details.", fieldErrors: fieldErrors(parsed.error) };
  }
  return { ok: true, data: parsed.data };
}

export function parseFacilityPermitFromFormData(
  formData: FormData
): ActionResult<CreateFacilityPermitFormInput> {
  const raw = {
    seasonId: formData.get("season_id"),
    issuerType: formData.get("issuer_type"),
    referenceNumber: formData.get("reference_number") ?? "",
    status: formData.get("status") ?? "active",
    validFrom: formData.get("valid_from") || null,
    validTo: formData.get("valid_to") || null,
    notes: formData.get("notes") ?? "",
    documentUrl: formData.get("document_url"),
  };
  const parsed = createFacilityPermitFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Invalid permit details.", fieldErrors: fieldErrors(parsed.error) };
  }
  return { ok: true, data: parsed.data };
}

export function parseAttachFixtureFromFormData(
  formData: FormData
): ActionResult<AttachLeagueFixtureFormInput> {
  const raw = {
    seasonId: formData.get("season_id"),
    gameId: formData.get("game_id"),
    homeTeamId: formData.get("home_team_id") || null,
    awayTeamId: formData.get("away_team_id") || null,
    roundNumber: formData.get("round_number") || null,
    matchday: formData.get("matchday") || null,
    notes: formData.get("notes") ?? "",
  };
  const parsed = attachLeagueFixtureFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Invalid fixture details.", fieldErrors: fieldErrors(parsed.error) };
  }
  return { ok: true, data: parsed.data };
}

export function parseRegisterCaptainTeamFromFormData(
  formData: FormData
): ActionResult<RegisterCaptainTeamFormInput> {
  const raw = {
    seasonId: formData.get("season_id"),
    divisionId: formData.get("division_id"),
    teamName: formData.get("team_name"),
    captainName: formData.get("captain_name"),
    captainEmail: formData.get("captain_email"),
    rosterEmails: formData.get("roster_emails") ?? "",
    termsAccepted: formData.get("terms_accepted") === "on",
  };
  const parsed = registerCaptainTeamFormSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Check the form and try again.",
      fieldErrors: fieldErrors(parsed.error),
    };
  }
  return { ok: true, data: parsed.data };
}

export function parseAcceptLeagueInviteFromFormData(
  formData: FormData
): ActionResult<AcceptLeagueInviteFormInput> {
  const raw = {
    token: formData.get("token"),
    name: formData.get("name"),
    waiverAccepted: formData.get("waiver_accepted") === "on",
  };
  const parsed = acceptLeagueInviteFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Invalid submission.", fieldErrors: fieldErrors(parsed.error) };
  }
  return { ok: true, data: parsed.data };
}

export function parseConfirmLeaguePaymentFromFormData(
  formData: FormData
): ActionResult<ConfirmLeagueMemberPaymentFormInput> {
  const raw = { paymentId: formData.get("payment_id") };
  const parsed = confirmLeagueMemberPaymentFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Invalid payment.", fieldErrors: fieldErrors(parsed.error) };
  }
  return { ok: true, data: parsed.data };
}
