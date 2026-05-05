import type { ReactElement } from "react";
import { Suspense } from "react";

import { redirect } from "next/navigation";

import { HostDashboardClient } from "@/components/features/host-dashboard/HostDashboardClient";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getHostSessionEmail, isAdminAuthorized } from "@/lib/auth";
import { includeGameInPublicLiveList } from "@/lib/dropin-session";
import {
  getSignupsGroupedByGameId,
  listLiveGamesForAdmin,
  listLiveGamesForHost,
} from "@/server/queries/games";
import { isHostGmailConnected, mapGmailConnectedForOwnerEmails } from "@/server/queries/host-gmail";
import { listOrganizations } from "@/server/queries/organizations";

export async function HostDashboardPage(): Promise<ReactElement> {
  const [hostSessionEmail, adminAuthorized] = await Promise.all([getHostSessionEmail(), isAdminAuthorized()]);

  if (!hostSessionEmail && !adminAuthorized) {
    redirect("/host/login");
  }

  const games = adminAuthorized
    ? await listLiveGamesForAdmin()
    : await listLiveGamesForHost(hostSessionEmail!);
  const nowMs = Date.now();
  const liveGames = games.filter((g) => g.status === "live");
  const cancelledGames = games.filter((g) => g.status === "cancelled");
  const activeGames = liveGames.filter((game) => includeGameInPublicLiveList(game, nowMs));
  const pastDropinGames = liveGames.filter(
    (game) => game.kind === "dropin" && !includeGameInPublicLiveList(game, nowMs)
  );
  const gameIds = [...activeGames, ...pastDropinGames, ...cancelledGames].map((g) => g.id);
  const ownerKeys = [...new Set(games.map((g) => g.owner_email.trim().toLowerCase()))];
  const [signupsByGameId, hostGmailConnected, organizations, gmailConnectedByOwnerEmail] = await Promise.all([
    getSignupsGroupedByGameId(gameIds, { includeAllPaymentStatuses: true }),
    hostSessionEmail ? isHostGmailConnected(hostSessionEmail) : Promise.resolve(false),
    listOrganizations(),
    adminAuthorized && ownerKeys.length > 0
      ? mapGmailConnectedForOwnerEmails(ownerKeys)
      : Promise.resolve(null as Record<string, boolean> | null),
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
            gmailConnectedByOwnerEmail={gmailConnectedByOwnerEmail}
            hostMagicLinkSignedIn={Boolean(hostSessionEmail)}
            organizations={organizations}
          />
        </Suspense>
        <SiteFooter />
      </div>
    </div>
  );
}
