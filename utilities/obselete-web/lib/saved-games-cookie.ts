/** Cookie written by `saveGameId` (client). Parsed the same on server for SSR. */
export const MY_GAMES_COOKIE = "nym_my_games";

export const MY_GAMES_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 365;

export function parseMyGamesCookieValue(
  raw: string | undefined | null
): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}
