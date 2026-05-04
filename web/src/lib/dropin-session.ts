import type { GameKind } from "@/types/domain";

export type GameSessionTiming = {
  kind: GameKind;
  starts_at: string;
  duration_minutes: number;
};

export function getGameSessionEndMs(game: GameSessionTiming): number {
  const startMs = Date.parse(game.starts_at);
  if (Number.isNaN(startMs)) return Number.NaN;
  return startMs + game.duration_minutes * 60_000;
}

/** True only for drop-ins whose scheduled end is at or before `nowMs`. */
export function isDropInSessionEnded(game: GameSessionTiming, nowMs: number): boolean {
  if (game.kind !== "dropin") return false;
  const endMs = getGameSessionEndMs(game);
  if (Number.isNaN(endMs)) return false;
  return nowMs >= endMs;
}

/** Drop-ins past scheduled end are omitted from public browse/landing (and host default list). */
export function includeGameInPublicLiveList(game: GameSessionTiming, nowMs: number): boolean {
  return !isDropInSessionEnded(game, nowMs);
}
