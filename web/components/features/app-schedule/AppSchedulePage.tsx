import { cookies } from "next/headers";

import { GamesHome } from "@/components/games/games-home";
import { MY_GAMES_COOKIE, parseMyGamesCookieValue } from "@/lib/saved-games-cookie";
import { getUpcomingGamesWithSignups } from "@/server/queries/games";

export async function AppSchedulePage() {
  const [{ games, signupsByGameId, usingMock, fetchError }, cookieStore] = await Promise.all([
    getUpcomingGamesWithSignups(),
    cookies(),
  ]);

  const myGameIds = parseMyGamesCookieValue(cookieStore.get(MY_GAMES_COOKIE)?.value);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <GamesHome
        games={games}
        signupsByGameId={signupsByGameId}
        usingMock={usingMock}
        fetchError={fetchError}
        myGameIds={myGameIds}
      />
    </div>
  );
}
