import { NextRequest, NextResponse } from "next/server";

import { appOrigin } from "@/lib/env";
import { verifyPlayerCancelSignupLinkToken } from "@/lib/magic-link";
import { createServerSupabase } from "@/lib/supabase-server";

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

export async function GET(req: NextRequest): Promise<Response> {
  const origin = appOrigin().replace(/\/$/, "");
  const resultUrl = (status: string) => `${origin}/signup/cancel?status=${encodeURIComponent(status)}`;
  const token = req.nextUrl.searchParams.get("t");
  const parsed = verifyPlayerCancelSignupLinkToken(token);
  if (!parsed) {
    return NextResponse.redirect(resultUrl("invalid"));
  }

  const supabase = createServerSupabase();
  const { data: signup, error: signupErr } = await supabase
    .from("signups")
    .select("id, game_id, player_email, status, payment_status")
    .eq("id", parsed.signupId)
    .eq("game_id", parsed.gameId)
    .maybeSingle<{
      id: string;
      game_id: string;
      player_email: string;
      status: "active" | "waitlist" | "canceled" | "removed" | "deleted";
      payment_status: "paid" | "pending" | "refund" | "canceled";
    }>();
  if (signupErr || !signup) {
    return NextResponse.redirect(resultUrl("not-found"));
  }

  if (signup.player_email.trim().toLowerCase() !== parsed.playerEmail) {
    return NextResponse.redirect(resultUrl("invalid"));
  }

  if (signup.status === "canceled" || signup.status === "removed" || signup.status === "deleted") {
    return NextResponse.redirect(resultUrl("done"));
  }

  if (signup.payment_status !== "paid") {
    return NextResponse.redirect(resultUrl("not-eligible"));
  }

  const { data: game, error: gameErr } = await supabase
    .from("games")
    .select("id, starts_at, signed_count, waitlist_count")
    .eq("id", parsed.gameId)
    .maybeSingle<{ id: string; starts_at: string; signed_count: number; waitlist_count: number }>();
  if (gameErr || !game) {
    return NextResponse.redirect(resultUrl("not-found"));
  }

  const cancelCutoffMs = Date.parse(game.starts_at) - TWO_HOURS_MS;
  if (!Number.isFinite(cancelCutoffMs) || Date.now() >= cancelCutoffMs) {
    return NextResponse.redirect(resultUrl("too-late"));
  }

  const { error: cancelErr } = await supabase
    .from("signups")
    .update({ status: "canceled", payment_status: "refund" })
    .eq("id", parsed.signupId)
    .eq("game_id", parsed.gameId)
    .in("status", ["active", "waitlist"]);
  if (cancelErr) {
    return NextResponse.redirect(resultUrl("failed"));
  }

  if (signup.status === "active") {
    await supabase
      .from("games")
      .update({ signed_count: Math.max(0, game.signed_count - 1) })
      .eq("id", parsed.gameId);
  } else if (signup.status === "waitlist") {
    await supabase
      .from("games")
      .update({ waitlist_count: Math.max(0, game.waitlist_count - 1) })
      .eq("id", parsed.gameId);
  }

  return NextResponse.redirect(resultUrl("done"));
}
