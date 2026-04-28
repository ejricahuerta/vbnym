import { NextRequest, NextResponse } from "next/server";

import { configuredPublicOrigin } from "@/lib/configured-public-origin";
import {
  LEAGUE_PORTAL_SESSION_COOKIE,
  LEAGUE_PORTAL_SESSION_MAX_AGE_SEC,
} from "@/lib/league-portal-cookie";
import {
  createLeaguePortalSessionToken,
  verifyLeaguePortalMagicLinkToken,
} from "@/lib/league-magic-link";
import { getLeagueTeamPortalBundlesForEmail } from "@/server/queries/team-portal";

function redirect(recover: "ok" | "invalid" | "missing"): NextResponse {
  const url = new URL("/app/league-team", configuredPublicOrigin());
  url.searchParams.set("recover", recover);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const raw = request.nextUrl.searchParams.get("t");
  if (!raw?.trim()) {
    return redirect("missing");
  }

  const verified = verifyLeaguePortalMagicLinkToken(raw);
  if (!verified) {
    return redirect("invalid");
  }

  const sessionToken = createLeaguePortalSessionToken(verified.email);
  if (!sessionToken) {
    return redirect("invalid");
  }

  const bundles = await getLeagueTeamPortalBundlesForEmail(verified.email);
  if (bundles.length === 0) {
    return redirect("invalid");
  }

  const url = new URL("/app/league-team", configuredPublicOrigin());
  url.searchParams.set("recover", "ok");
  const res = NextResponse.redirect(url);

  const secure = process.env.NODE_ENV === "production";
  res.cookies.set(LEAGUE_PORTAL_SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: LEAGUE_PORTAL_SESSION_MAX_AGE_SEC,
  });

  return res;
}
