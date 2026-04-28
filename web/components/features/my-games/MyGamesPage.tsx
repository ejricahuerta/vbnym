import { Suspense } from "react";
import { Lock } from "lucide-react";

import { FindMyGamesDialog } from "@/components/games/find-my-games-dialog";
import { MyGamesClient } from "@/components/games/my-games-client";
import { MyGamesRecoveryBanner } from "@/components/games/my-games-recovery-banner";
import { PlayerPageHeading } from "@/components/layout/player-page-heading";
import { SixBackPageShell, SixBackSection } from "@/components/shared/SixBackPageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getMyGamesAccessState } from "@/lib/my-games-saved-ids";
import { getUpcomingGamesWithSignups } from "@/server/queries/games";

export async function MyGamesPage() {
  const { isAuthenticated, savedGameIds } = await getMyGamesAccessState();
  const { games, signupsByGameId } = isAuthenticated
    ? await getUpcomingGamesWithSignups()
    : { games: [], signupsByGameId: {} };

  return (
    <SixBackPageShell className="max-w-6xl">
      <PlayerPageHeading
        title="My games"
        description="Your upcoming volleyball sessions and payment details."
      />
      <Suspense fallback={null}>
        <MyGamesRecoveryBanner />
      </Suspense>
      <SixBackSection
        title="Saved Sessions"
        eyebrow="Player Portal"
        description="Access your registered games, payment states, and upcoming schedules in one place."
      >
        {isAuthenticated ? (
          <MyGamesClient
            games={games}
            signupsByGameId={signupsByGameId}
            savedGameIds={savedGameIds}
          />
        ) : (
          <Card className="gap-0 overflow-hidden rounded-xl border border-accent/35 shadow-sm">
            <CardContent className="flex flex-col items-center px-6 py-10 text-center sm:px-10 sm:py-14">
              <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-accent/10 text-accent sm:size-16">
                <Lock className="size-7 sm:size-8" aria-hidden />
              </div>
              <h2 className="font-heading text-lg font-bold tracking-tight text-foreground sm:text-xl">
                Login to see your games
              </h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Use the email you signed up with. We&apos;ll send a secure magic
                link to this browser.
              </p>
              <FindMyGamesDialog>
                <Button className="mt-6 rounded-xl" size="lg">
                  Login
                </Button>
              </FindMyGamesDialog>
            </CardContent>
          </Card>
        )}
      </SixBackSection>
    </SixBackPageShell>
  );
}
