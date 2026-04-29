import type { GameKind } from "@/types/domain";

export const COMING_SOON_GAME_KINDS: readonly GameKind[] = ["league", "tournament"] as const;

export const COMING_SOON_LABEL = "Coming Soon";

export function isGameKindComingSoon(kind: GameKind): boolean {
  return COMING_SOON_GAME_KINDS.includes(kind);
}
