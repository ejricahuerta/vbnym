'use server';

import { z } from "zod";

import { isAllowedAdminEmail } from "@/lib/auth";

const formSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export type VerifyAdminLoginEmailResult =
  | { ok: true }
  | { ok: false; error: string };

export async function verifyAdminLoginEmail(
  formData: FormData
): Promise<VerifyAdminLoginEmailResult> {
  const parsed = formSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { ok: false, error: "Enter a valid email address." };
  }
  const { email } = parsed.data;
  if (!isAllowedAdminEmail(email)) {
    return {
      ok: false,
      error: "This email is not authorized for admin access.",
    };
  }
  return { ok: true };
}

