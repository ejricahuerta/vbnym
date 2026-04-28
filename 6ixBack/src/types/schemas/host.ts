import { z } from "zod";

import type { ActionResult } from "@/types/action-result";

export const hostPublishSchema = z.object({
  kind: z.enum(["dropin", "league", "tournament"]),
  title: z.string().trim().min(3),
  venueName: z.string().trim().min(2),
  venueArea: z.string().trim().optional(),
  startsAt: z.string().trim().min(1),
  durationMinutes: z.coerce.number().int().min(30),
  skillLevel: z.string().trim().min(2),
  capacity: z.coerce.number().int().min(2),
  priceCents: z.coerce.number().int().min(0),
  format: z.string().trim().min(2),
  hostName: z.string().trim().min(2),
  hostEmail: z.email(),
  joinAsPlayer: z.boolean(),
});

export type HostPublishInput = z.infer<typeof hostPublishSchema>;

export const hostInteracEmailSchema = z.object({
  gameId: z.string().uuid(),
  hostEmail: z.email(),
});

export type HostInteracEmailInput = z.infer<typeof hostInteracEmailSchema>;

function f(fd: FormData, key: string): string {
  const value = fd.get(key);
  return typeof value === "string" ? value : "";
}

export function parseHostPublishFormData(formData: FormData): ActionResult<HostPublishInput> {
  const parsed = hostPublishSchema.safeParse({
    kind: f(formData, "kind"),
    title: f(formData, "title"),
    venueName: f(formData, "venueName"),
    venueArea: f(formData, "venueArea"),
    startsAt: f(formData, "startsAt"),
    durationMinutes: f(formData, "durationMinutes"),
    skillLevel: f(formData, "skillLevel"),
    capacity: f(formData, "capacity"),
    priceCents: f(formData, "priceCents"),
    format: f(formData, "format"),
    hostName: f(formData, "hostName"),
    hostEmail: f(formData, "hostEmail"),
    joinAsPlayer: f(formData, "joinAsPlayer") === "on",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid host publish data." };
  }
  return { ok: true, data: parsed.data };
}

export function parseHostInteracEmailFormData(formData: FormData): ActionResult<HostInteracEmailInput> {
  const parsed = hostInteracEmailSchema.safeParse({
    gameId: f(formData, "gameId"),
    hostEmail: f(formData, "hostEmail"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid payment email." };
  }
  return { ok: true, data: parsed.data };
}
