import { z } from "zod";

import type { ActionResult } from "@/types/action-result";

export const hostAccessRequestSchema = z.object({
  email: z.email(),
  name: z.string().min(1).max(200),
  message: z.string().max(2000).optional(),
  organizationId: z.string().uuid(),
  contextGameId: z.string().uuid().optional(),
});

export type HostAccessRequestInput = z.infer<typeof hostAccessRequestSchema>;

function f(fd: FormData, key: string): string {
  const value = fd.get(key);
  return typeof value === "string" ? value : "";
}

export function parseHostAccessRequest(formData: FormData): ActionResult<HostAccessRequestInput> {
  const rawEmail = formData.get("email");
  const rawName = formData.get("name");
  const rawMessage = formData.get("message");
  const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
  const name = typeof rawName === "string" ? rawName.trim() : "";
  const messageRaw = typeof rawMessage === "string" ? rawMessage.trim() : "";
  const message = messageRaw.length > 0 ? messageRaw : undefined;
  const organizationId = f(formData, "organizationId");
  const contextGameRaw = f(formData, "contextGameId");
  const contextGameId = contextGameRaw.length > 0 ? contextGameRaw : undefined;
  const parsed = hostAccessRequestSchema.safeParse({ email, name, message, organizationId, contextGameId });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Enter your name, a valid email, and an organization.",
    };
  }
  return { ok: true, data: parsed.data };
}
