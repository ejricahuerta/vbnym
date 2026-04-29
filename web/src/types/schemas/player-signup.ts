import { z } from "zod";

import type { ActionResult } from "@/types/action-result";

export const playerCancelSignupSchema = z.object({
  gameId: z.string().uuid(),
  signupId: z.string().uuid(),
});

export type PlayerCancelSignupInput = z.infer<typeof playerCancelSignupSchema>;

function f(fd: FormData, key: string): string {
  const value = fd.get(key);
  return typeof value === "string" ? value : "";
}

export function parsePlayerCancelSignupFormData(formData: FormData): ActionResult<PlayerCancelSignupInput> {
  const parsed = playerCancelSignupSchema.safeParse({
    gameId: f(formData, "gameId"),
    signupId: f(formData, "signupId"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid cancellation request." };
  }
  return { ok: true, data: parsed.data };
}
