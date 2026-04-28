import { z } from "zod";

export const addApprovedHostSchema = z.object({
  email: z.email(),
});

export type AddApprovedHostInput = z.infer<typeof addApprovedHostSchema>;

export function parseAddApprovedHost(formData: FormData): AddApprovedHostInput | null {
  const raw = formData.get("email");
  const email = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  const parsed = addApprovedHostSchema.safeParse({ email });
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
