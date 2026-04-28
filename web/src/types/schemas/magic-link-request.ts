import { z } from "zod";

export const magicLinkEmailSchema = z.object({
  email: z.email(),
});

export type MagicLinkEmailInput = z.infer<typeof magicLinkEmailSchema>;

export function parseMagicLinkEmail(formData: FormData): MagicLinkEmailInput | null {
  const raw = formData.get("email");
  const email = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  const parsed = magicLinkEmailSchema.safeParse({ email });
  return parsed.success ? parsed.data : null;
}
