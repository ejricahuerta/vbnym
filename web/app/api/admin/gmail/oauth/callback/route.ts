import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  decodeGmailOAuthState,
  exchangeGmailCode,
} from "@/lib/gmail-sync";
import { isAuthorizedAdmin } from "@/lib/auth";
import {
  gmailAssumedExpiresAfterConnect,
  gmailAssumedExpiresAfterGameConnect,
} from "@/lib/gmail-reauth-reminder";
import { configuredPublicOrigin } from "@/lib/configured-public-origin";

export async function GET(request: NextRequest) {
  const publicOrigin = configuredPublicOrigin();
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const stateRaw = requestUrl.searchParams.get("state");
  const state = decodeGmailOAuthState(stateRaw);
  const paymentsDest = new URL("/admin/payments", publicOrigin);

  if (!code) {
    paymentsDest.searchParams.set("error", "missing_google_code");
    return NextResponse.redirect(paymentsDest);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAuthorizedAdmin(user)) {
    paymentsDest.searchParams.set("error", "not_allowed");
    return NextResponse.redirect(paymentsDest);
  }

  try {
    const admin = createAdminClient();
    const { refreshToken, connectedEmail, providerRefreshExpiresAt } =
      await exchangeGmailCode(publicOrigin, code);
    const connectedAt = new Date();

    if (!state || state.mode === "universal") {
      const payload: Record<string, string | boolean | null> = {};
      if (refreshToken) payload.gmail_refresh_token = refreshToken;
      if (connectedEmail) payload.gmail_connected_email = connectedEmail;
      payload.gmail_connected_at = connectedAt.toISOString();
      payload.gmail_assumed_expires_at = gmailAssumedExpiresAfterConnect(connectedAt);
      payload.gmail_reauth_reminder_sent_for_expires_at = null;
      payload.gmail_reauth_required = false;

      const { error } = await admin.from("admin_settings").update(payload).eq("id", 1);
      if (error) {
        paymentsDest.searchParams.set("error", error.message);
        return NextResponse.redirect(paymentsDest);
      }

      paymentsDest.searchParams.set("success", "gmail_connected");
      return NextResponse.redirect(paymentsDest);
    }

    const gameDest = new URL(`/admin/games/${state.gameId}/edit`, publicOrigin);
    const { data: gameRow, error: gameErr } = await admin
      .from("games")
      .select("id")
      .eq("id", state.gameId)
      .maybeSingle<{ id: string }>();

    if (gameErr || !gameRow?.id) {
      gameDest.searchParams.set("error", "invalid_game");
      return NextResponse.redirect(gameDest);
    }

    const connPayload: Record<string, string | boolean | null> = {
      gmail_connected_email: connectedEmail,
      gmail_connected_at: connectedAt.toISOString(),
      gmail_assumed_expires_at: gmailAssumedExpiresAfterGameConnect(connectedAt),
      gmail_provider_refresh_expires_at: providerRefreshExpiresAt,
      gmail_reauth_reminder_sent_for_expires_at: null,
      reauth_required: false,
    };
    if (refreshToken) connPayload.gmail_refresh_token = refreshToken;

    const { data: existingCfg } = await admin
      .from("game_email_sync_config")
      .select("preferred_gmail_connection_id")
      .eq("game_id", state.gameId)
      .maybeSingle<{ preferred_gmail_connection_id: string | null }>();

    const existingConnId = existingCfg?.preferred_gmail_connection_id?.trim();

    if (existingConnId) {
      const { error: upConnErr } = await admin
        .from("gmail_connections")
        .update(connPayload)
        .eq("id", existingConnId);
      if (upConnErr) {
        gameDest.searchParams.set("error", upConnErr.message);
        return NextResponse.redirect(gameDest);
      }
    } else {
      const { data: curCfg } = await admin
        .from("game_email_sync_config")
        .select("use_universal_fallback")
        .eq("game_id", state.gameId)
        .maybeSingle<{ use_universal_fallback: boolean | null }>();
      const useFallback = curCfg?.use_universal_fallback !== false;

      const { data: inserted, error: insErr } = await admin
        .from("gmail_connections")
        .insert(connPayload)
        .select("id")
        .single<{ id: string }>();
      if (insErr || !inserted?.id) {
        gameDest.searchParams.set("error", insErr?.message ?? "insert_failed");
        return NextResponse.redirect(gameDest);
      }
      const { error: cfgErr } = await admin.from("game_email_sync_config").upsert(
        {
          game_id: state.gameId,
          preferred_gmail_connection_id: inserted.id,
          use_universal_fallback: useFallback,
        },
        { onConflict: "game_id" }
      );
      if (cfgErr) {
        gameDest.searchParams.set("error", cfgErr.message);
        return NextResponse.redirect(gameDest);
      }
    }

    gameDest.searchParams.set("success", "gmail_game_connected");
    return NextResponse.redirect(gameDest);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gmail OAuth callback failed.";
    paymentsDest.searchParams.set("error", message);
    return NextResponse.redirect(paymentsDest);
  }
}
