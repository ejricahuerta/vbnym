import { z } from "zod";

export const hostAccessRequestSchema = z.object({
  email: z.email(),
  name: z.string().min(1).max(200),
  message: z.string().max(2000).optional(),
});

export type HostAccessRequestInput = z.infer<typeof hostAccessRequestSchema>;

export function parseHostAccessRequest(formData: FormData): HostAccessRequestInput | null {
  const rawEmail = formData.get("email");
  const rawName = formData.get("name");
  const rawMessage = formData.get("message");
  const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
  const name = typeof rawName === "string" ? rawName.trim() : "";
  const messageRaw = typeof rawMessage === "string" ? rawMessage.trim() : "";
  const message = messageRaw.length > 0 ? messageRaw : undefined;
  const parsed = hostAccessRequestSchema.safeParse({ email, name, message });
  return parsed.success ? parsed.data : null;
}
