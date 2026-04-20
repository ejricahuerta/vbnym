import { NextRequest, NextResponse } from "next/server";

import { getPlayerUpcomingGamesByEmail } from "@/server/queries/player-games-by-email";
import {
  MY_GAMES_COOKIE,
  MY_GAMES_COOKIE_MAX_AGE_SEC,
  parseMyGamesCookieValue,
} from "@/lib/saved-games-cookie";
import {
  PLAYER_RECOVER_SESSION_COOKIE,
  PLAYER_RECOVER_SESSION_MAX_AGE_SEC,
} from "@/lib/player-recover-cookie";
import {
  createPlayerRecoverSessionToken,
  verifyPlayerMagicLinkToken,
} from "@/lib/player-magic-link";
import { publicOriginFromRequest } from "@/lib/request-public-origin";

function redirect(
  request: NextRequest,
  recover: "ok" | "invalid" | "missing"
): NextResponse {
  const url = new URL("/app/my-games", publicOriginFromRequest(request));
  url.searchParams.set("recover", recover);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const raw = request.nextUrl.searchParams.get("t");
  if (!raw?.trim()) {
    return redirect(request, "missing");
  }

  const verified = verifyPlayerMagicLinkToken(raw);
  if (!verified) {
    return redirect(request, "invalid");
  }

  const sessionToken = createPlayerRecoverSessionToken(verified.email);
  if (!sessionToken) {
    return redirect(request, "invalid");
  }

  const { games } = await getPlayerUpcomingGamesByEmail(verified.email);
  const idsFromRoster = games.map((g) => g.id);
  const existing = parseMyGamesCookieValue(
    request.cookies.get(MY_GAMES_COOKIE)?.value
  );
  const merged = [...new Set([...existing, ...idsFromRoster])];

  const url = new URL("/app/my-games", publicOriginFromRequest(request));
  url.searchParams.set("recover", "ok");
  const res = NextResponse.redirect(url);

  const secure = process.env.NODE_ENV === "production";
  res.cookies.set(PLAYER_RECOVER_SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: PLAYER_RECOVER_SESSION_MAX_AGE_SEC,
  });

  res.cookies.set(MY_GAMES_COOKIE, merged.join(","), {
    httpOnly: false,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: MY_GAMES_COOKIE_MAX_AGE_SEC,
  });

  return res;
}
