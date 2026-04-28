import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createGmailOAuthUrl, encodeGmailOAuthState } from "@/lib/gmail-sync";
import { isAuthorizedAdmin } from "@/lib/auth";
import { configuredPublicOrigin } from "@/lib/configured-public-origin";

export async function GET(request: NextRequest) {
  const publicOrigin = configuredPublicOrigin();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAuthorizedAdmin(user)) {
    return NextResponse.redirect(new URL("/admin/login?error=not_allowed", publicOrigin));
  }

  try {
    const mode =
      request.nextUrl.searchParams.get("mode") === "game" ? "game" : "universal";
    const gameId = request.nextUrl.searchParams.get("gameId")?.trim();
    if (mode === "game" && !gameId) {
      const dest = new URL("/admin/games", publicOrigin);
      dest.searchParams.set("error", "missing_game_id_for_gmail_oauth");
      return NextResponse.redirect(dest);
    }
    const state = encodeGmailOAuthState({
      v: 1,
      mode,
      gameId: mode === "game" ? gameId : undefined,
    });
    const url = createGmailOAuthUrl(publicOrigin, state);
    return NextResponse.redirect(url);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not start Gmail OAuth.";
    const destination = new URL("/admin/payments", publicOrigin);
    destination.searchParams.set("error", message);
    return NextResponse.redirect(destination);
  }
}
