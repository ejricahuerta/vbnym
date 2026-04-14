import { cookies } from "next/headers";
import { getUpcomingGamesWithSignups } from "@/lib/data/games";
import { parseMyGamesCookieValue, MY_GAMES_COOKIE } from "@/lib/saved-games-cookie";
import { GamesHome } from "@/components/games/games-home";

export default async function AppHomePage() {
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
