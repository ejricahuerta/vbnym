import type { ReactElement } from "react";
import { Suspense } from "react";

import { redirect } from "next/navigation";

import { HostDashboardClient } from "@/components/features/host-dashboard/HostDashboardClient";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getHostSessionEmail } from "@/lib/auth";
import { includeGameInPublicLiveList } from "@/lib/dropin-session";
import { getSignupsGroupedByGameId, listLiveGamesForHost } from "@/server/queries/games";
import { isHostGmailConnected } from "@/server/queries/host-gmail";
import { listOrganizations } from "@/server/queries/organizations";

export async function HostDashboardPage(): Promise<ReactElement> {
  const hostSessionEmail = await getHostSessionEmail();

  if (!hostSessionEmail) {
    redirect("/host/login");
  }

  const games = await listLiveGamesForHost(hostSessionEmail);
  const nowMs = Date.now();
  const liveGames = games.filter((g) => g.status === "live");
  const cancelledGames = games.filter((g) => g.status === "cancelled");
  const activeGames = liveGames.filter((game) => includeGameInPublicLiveList(game, nowMs));
  const pastDropinGames = liveGames.filter(
    (game) => game.kind === "dropin" && !includeGameInPublicLiveList(game, nowMs)
  );
  const gameIds = [...activeGames, ...pastDropinGames, ...cancelledGames].map((g) => g.id);
  const [signupsByGameId, hostGmailConnected, organizations] = await Promise.all([
    getSignupsGroupedByGameId(gameIds, { includeAllPaymentStatuses: true }),
    isHostGmailConnected(hostSessionEmail),
    listOrganizations(),
  ]);

  return (
    <div className="host-dashboard-page">
      <SiteHeader />
      <div className="host-dashboard-page-scroll">
        <Suspense fallback={null}>
          <HostDashboardClient
            activeGames={activeGames}
            pastDropinGames={pastDropinGames}
            cancelledGames={cancelledGames}
            signupsByGameId={signupsByGameId}
            hostGmailConnected={hostGmailConnected}
            organizations={organizations}
          />
        </Suspense>
        <SiteFooter />
      </div>
    </div>
  );
}
