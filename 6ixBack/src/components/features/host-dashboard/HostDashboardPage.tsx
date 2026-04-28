import type { ReactElement } from "react";
import { Suspense } from "react";

import { redirect } from "next/navigation";

import { HostDashboardClient } from "@/components/features/host-dashboard/HostDashboardClient";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getHostSessionEmail } from "@/lib/auth";
import { getSignupsGroupedByGameId, listLiveGamesForHost } from "@/server/queries/games";
import { isHostGmailConnected } from "@/server/queries/host-gmail";

export async function HostDashboardPage(): Promise<ReactElement> {
  const hostSessionEmail = await getHostSessionEmail();

  if (!hostSessionEmail) {
    redirect("/host/login");
  }

  const games = await listLiveGamesForHost(hostSessionEmail);
  const signupsByGameId = await getSignupsGroupedByGameId(games.map((g) => g.id));
  const hostGmailConnected = await isHostGmailConnected(hostSessionEmail);

  return (
    <div>
      <SiteHeader />
      <Suspense fallback={null}>
        <HostDashboardClient
          games={games}
          signupsByGameId={signupsByGameId}
          hostGmailConnected={hostGmailConnected}
        />
      </Suspense>
      <SiteFooter />
    </div>
  );
}
