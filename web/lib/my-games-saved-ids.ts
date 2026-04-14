import "server-only";

import { cookies } from "next/headers";

import { getPlayerUpcomingGamesByEmail } from "@/lib/data/player-games-by-email";
import { verifyPlayerRecoverSessionToken } from "@/lib/player-magic-link";
import { PLAYER_RECOVER_SESSION_COOKIE } from "@/lib/player-recover-cookie";
import {
  MY_GAMES_COOKIE,
  parseMyGamesCookieValue,
} from "@/lib/saved-games-cookie";

/**
 * Auth/session info and game ids for the My games page.
 */
export async function getMyGamesAccessState(): Promise<{
  isAuthenticated: boolean;
  savedGameIds: string[];
}> {
  const cookieStore = await cookies();
  const fromBrowser = parseMyGamesCookieValue(
    cookieStore.get(MY_GAMES_COOKIE)?.value
  );
  const session = verifyPlayerRecoverSessionToken(
    cookieStore.get(PLAYER_RECOVER_SESSION_COOKIE)?.value
  );
  if (!session) {
    return { isAuthenticated: false, savedGameIds: [] };
  }
  const games = await getPlayerUpcomingGamesByEmail(session.email);
  const fromSession = games.map((g) => g.id);
  return {
    isAuthenticated: true,
    savedGameIds: [...new Set([...fromBrowser, ...fromSession])],
  };
}
