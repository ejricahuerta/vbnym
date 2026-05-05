import { z } from "zod";

function formStr(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v : "";
}

export const addApprovedHostSchema = z.object({
  email: z.email(),
  displayName: z.string().trim().max(120).optional(),
  hostPhone: z.string().optional(),
});

export type AddApprovedHostInput = z.infer<typeof addApprovedHostSchema>;

export function parseAddApprovedHost(formData: FormData): AddApprovedHostInput | null {
  const parsed = addApprovedHostSchema.safeParse({
    email: formStr(formData, "email").trim().toLowerCase(),
    displayName: formStr(formData, "displayName").trim() || undefined,
    hostPhone: formStr(formData, "hostPhone"),
  });
  return parsed.success ? parsed.data : null;
}

export const updateApprovedHostSchema = z.object({
  currentEmail: z.email(),
  newEmail: z.email(),
  displayName: z.string().trim().min(2).max(120),
  hostPhone: z.string(),
});

export type UpdateApprovedHostInput = z.infer<typeof updateApprovedHostSchema>;

export function parseUpdateApprovedHost(formData: FormData): UpdateApprovedHostInput | null {
  const parsed = updateApprovedHostSchema.safeParse({
    currentEmail: formStr(formData, "currentEmail").trim().toLowerCase(),
    newEmail: formStr(formData, "newEmail").trim().toLowerCase(),
    displayName: formStr(formData, "displayName"),
    hostPhone: formStr(formData, "hostPhone"),
  });
  return parsed.success ? parsed.data : null;
}

export const approveHostRequestSchema = z.object({
  requestId: z.string().uuid(),
});

export type ApproveHostRequestInput = z.infer<typeof approveHostRequestSchema>;

export function parseApproveHostRequest(formData: FormData): ApproveHostRequestInput | null {
  const raw = formData.get("requestId");
  const requestId = typeof raw === "string" ? raw.trim() : "";
  const parsed = approveHostRequestSchema.safeParse({ requestId });
  return parsed.success ? parsed.data : null;
}
