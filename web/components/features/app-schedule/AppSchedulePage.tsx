import { cookies } from "next/headers";

import { GamesHome } from "@/components/games/games-home";
import { SixBackPageShell } from "@/components/shared/SixBackPageShell";
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
      <SixBackPageShell className="max-w-5xl pb-4">
        <p className="eyebrow">Browse</p>
        <h1 className="display mt-2 text-5xl sm:text-6xl">What&apos;s on this week</h1>
        <p className="mt-3 max-w-2xl text-sm text-[var(--ink-2)] sm:text-base">
          Filter by day, venue, and map/list mode to find your next session fast.
        </p>
      </SixBackPageShell>
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
