import { cookies } from "next/headers";
import { SiteHeader } from "@/components/layout/site-header";
import { MobileDock } from "@/components/layout/mobile-dock";
import { PlayerPageHeading } from "@/components/layout/player-page-heading";
import { Suspense } from "react";
import { getUpcomingGamesWithSignups } from "@/lib/data/games";
import {
  MY_GAMES_COOKIE,
  parseMyGamesCookieValue,
} from "@/lib/saved-games-cookie";
import { MyGamesClient } from "@/components/games/my-games-client";
import { EmailGameLookup } from "@/components/games/email-game-lookup";

export default async function MyGamesPage() {
  const { games, signupsByGameId } = await getUpcomingGamesWithSignups();
  const cookieStore = await cookies();
  const savedGameIds = parseMyGamesCookieValue(
    cookieStore.get(MY_GAMES_COOKIE)?.value
  );

  return (
    <div className="flex min-h-dvh flex-col bg-background pb-24 md:pb-8">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 lg:max-w-5xl lg:py-10">
        <PlayerPageHeading
          title="My games"
          description="Your upcoming volleyball sessions and payment details."
        />
        <div className="mt-6 sm:mt-8">
          <MyGamesClient
            games={games}
            signupsByGameId={signupsByGameId}
            savedGameIds={savedGameIds}
          />
        </div>
        <div className="mt-8 sm:mt-10">
          <details className="group rounded-2xl border bg-card shadow-sm">
            <summary className="cursor-pointer px-5 py-4 text-sm font-medium text-muted-foreground hover:text-foreground">
              Can&apos;t find your game? Look it up by email
            </summary>
            <div className="border-t px-5 pb-5 pt-4">
              <EmailGameLookup />
            </div>
          </details>
        </div>
      </main>
      <Suspense fallback={null}>
        <MobileDock />
      </Suspense>
    </div>
  );
}
