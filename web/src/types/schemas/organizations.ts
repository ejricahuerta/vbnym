import { z } from "zod";

import type { ActionResult } from "@/types/action-result";

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(2).max(120),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;

export const deleteOrganizationSchema = z.object({
  organizationId: z.string().uuid(),
});

export type DeleteOrganizationInput = z.infer<typeof deleteOrganizationSchema>;

function f(fd: FormData, key: string): string {
  const value = fd.get(key);
  return typeof value === "string" ? value : "";
}

export function parseCreateOrganizationFormData(formData: FormData): ActionResult<CreateOrganizationInput> {
  const parsed = createOrganizationSchema.safeParse({ name: f(formData, "name") });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid organization name." };
  }
  return { ok: true, data: parsed.data };
}

export function parseDeleteOrganizationFormData(formData: FormData): ActionResult<DeleteOrganizationInput> {
  const parsed = deleteOrganizationSchema.safeParse({ organizationId: f(formData, "organizationId") });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid organization." };
  }
  return { ok: true, data: parsed.data };
}
