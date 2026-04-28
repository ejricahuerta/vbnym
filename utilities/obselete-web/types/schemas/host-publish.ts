import { z } from "zod";

import type { ActionResult } from "@/types/action-result";

const hostPublishSchema = z.object({
  mode: z.enum(["drop-in", "league", "tournament"]),
  title: z.string().trim().min(3, "Title is required."),
  venue: z.string().trim().min(2, "Venue is required."),
  skillLevel: z.string().trim().min(2, "Skill level is required."),
  date: z.string().trim().min(1, "Date is required."),
  startTime: z.string().trim().min(1, "Start time is required."),
  durationMinutes: z.coerce.number().int().min(60, "Duration must be at least 60 minutes."),
  playerCap: z.coerce.number().int().min(2, "Player cap must be at least 2."),
  price: z.coerce.number().nonnegative("Price must be 0 or higher."),
  format: z.string().trim().min(2, "Format is required."),
  payoutDisplayName: z.string().trim().min(2, "Display name is required."),
  etransferEmail: z.email("Valid Interac e-transfer email is required."),
});

export type HostPublishInput = z.infer<typeof hostPublishSchema>;

function getFormValue(formData: FormData, key: string): string {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw : "";
}

export function parseHostPublishForm(formData: FormData): ActionResult<HostPublishInput> {
  const parsed = hostPublishSchema.safeParse({
    mode: getFormValue(formData, "mode"),
    title: getFormValue(formData, "title"),
    venue: getFormValue(formData, "venue"),
    skillLevel: getFormValue(formData, "skillLevel"),
    date: getFormValue(formData, "date"),
    startTime: getFormValue(formData, "startTime"),
    durationMinutes: getFormValue(formData, "durationMinutes"),
    playerCap: getFormValue(formData, "playerCap"),
    price: getFormValue(formData, "price"),
    format: getFormValue(formData, "format"),
    payoutDisplayName: getFormValue(formData, "payoutDisplayName"),
    etransferEmail: getFormValue(formData, "etransferEmail"),
  });

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return {
      ok: false,
      error: firstIssue?.message ?? "Invalid host form submission.",
    };
  }

  return { ok: true, data: parsed.data };
}
