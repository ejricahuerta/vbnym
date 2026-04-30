import { z } from "zod";

import type { ActionResult } from "@/types/action-result";

export const signupSchema = z.object({
  gameId: z.string().uuid(),
  addedByName: z.string().trim().min(2),
  addedByEmail: z.email(),
  includeSigner: z.boolean(),
  players: z.array(z.string().trim().min(2)).max(6),
});

export type SignupInput = z.infer<typeof signupSchema>;

function f(fd: FormData, key: string): string {
  const value = fd.get(key);
  return typeof value === "string" ? value : "";
}

export function parseSignupFormData(formData: FormData): ActionResult<SignupInput> {
  const includeSignerValue = f(formData, "includeSigner");
  const playersRaw = f(formData, "playersJson");
  let players: string[] = [];
  try {
    const parsedPlayers: unknown = JSON.parse(playersRaw);
    if (Array.isArray(parsedPlayers)) {
      players = parsedPlayers.filter((value): value is string => typeof value === "string");
    }
  } catch {
    return { ok: false, error: "Invalid signup payload." };
  }

  const parsed = signupSchema.safeParse({
    gameId: f(formData, "gameId"),
    addedByName: f(formData, "addedByName"),
    addedByEmail: f(formData, "addedByEmail"),
    includeSigner: includeSignerValue === "true",
    players,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid signup payload." };
  }
  if (!parsed.data.includeSigner && parsed.data.players.length === 0) {
    return { ok: false, error: "Add at least one player name for this signup type." };
  }
  if (parsed.data.includeSigner && parsed.data.players.length > 5) {
    return { ok: false, error: "You can add up to 6 players including yourself." };
  }
  return { ok: true, data: parsed.data };
}
