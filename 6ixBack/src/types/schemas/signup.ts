import { z } from "zod";

import type { ActionResult } from "@/types/action-result";

export const signupSchema = z.object({
  gameId: z.string().uuid(),
  playerName: z.string().trim().min(2),
  playerEmail: z.email(),
});

export type SignupInput = z.infer<typeof signupSchema>;

function f(fd: FormData, key: string): string {
  const value = fd.get(key);
  return typeof value === "string" ? value : "";
}

export function parseSignupFormData(formData: FormData): ActionResult<SignupInput> {
  const parsed = signupSchema.safeParse({
    gameId: f(formData, "gameId"),
    playerName: f(formData, "playerName"),
    playerEmail: f(formData, "playerEmail"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid signup payload." };
  }
  return { ok: true, data: parsed.data };
}
