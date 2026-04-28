import { formatGameTimeRangeLabel } from "@/lib/game-display";
import type { Game } from "@/types/vbnym";

/** True when `q` matches location, address, court, date substring, or time-range label (case-insensitive). */
export function gameMatchesSearchQuery(game: Game, q: string): boolean {
  if (!q.trim()) return true;
  const s = q.toLowerCase();
  return (
    game.location.toLowerCase().includes(s) ||
    (game.address?.toLowerCase().includes(s) ?? false) ||
    (game.court?.toLowerCase().includes(s) ?? false) ||
    game.date.includes(s) ||
    formatGameTimeRangeLabel(game).toLowerCase().includes(s)
  );
}
