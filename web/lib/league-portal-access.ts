import "server-only";

import { cookies } from "next/headers";

import { verifyLeaguePortalSessionToken } from "@/lib/league-magic-link";
import { LEAGUE_PORTAL_SESSION_COOKIE } from "@/lib/league-portal-cookie";

export async function getLeaguePortalAccessState(): Promise<{
  isAuthenticated: boolean;
  email: string | null;
}> {
  const cookieStore = await cookies();
  const session = verifyLeaguePortalSessionToken(
    cookieStore.get(LEAGUE_PORTAL_SESSION_COOKIE)?.value
  );
  if (!session) {
    return { isAuthenticated: false, email: null };
  }
  return { isAuthenticated: true, email: session.email };
}
