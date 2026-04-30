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
    .select("id, game_id, player_email, status, payment_status, added_by_name, added_by_email, games!inner ( id, starts_at, signed_count, waitlist_count )")
    .eq("id", parsed.signupId)
    .eq("game_id", parsed.gameId)
    .maybeSingle<{
      id: string;
      game_id: string;
      player_email: string;
      added_by_name: string;
      added_by_email: string;
      status: "active" | "waitlist" | "removed" | "deleted";
      payment_status: "paid" | "pending" | "refund" | "canceled";
      games:
        | {
            id: string;
            starts_at: string;
            signed_count: number;
            waitlist_count: number;
          }
        | {
            id: string;
            starts_at: string;
            signed_count: number;
            waitlist_count: number;
          }[]
        | null;
    }>();
  if (signupErr || !signup) {
    return NextResponse.redirect(resultUrl("not-found"));
  }

  if (signup.player_email.trim().toLowerCase() !== parsed.playerEmail) {
    return NextResponse.redirect(resultUrl("invalid"));
  }

  if (signup.status === "removed" || signup.status === "deleted") {
    return NextResponse.redirect(resultUrl("done"));
  }

  if (signup.payment_status !== "paid") {
    return NextResponse.redirect(resultUrl("not-eligible"));
  }

  const gameRef = Array.isArray(signup.games) ? signup.games[0] : signup.games;
  if (!gameRef) {
    return NextResponse.redirect(resultUrl("not-found"));
  }

  const cancelCutoffMs = Date.parse(gameRef.starts_at) - TWO_HOURS_MS;
  if (!Number.isFinite(cancelCutoffMs) || Date.now() >= cancelCutoffMs) {
    return NextResponse.redirect(resultUrl("too-late"));
  }

  const { error: cancelErr } = await supabase
    .from("signups")
    .update({
      status: "removed",
      payment_status: "refund",
      refund_owner_name: signup.added_by_name,
      refund_owner_email: signup.added_by_email,
    })
    .eq("id", parsed.signupId)
    .eq("game_id", parsed.gameId)
    .in("status", ["active", "waitlist"]);
  if (cancelErr) {
    return NextResponse.redirect(resultUrl("failed"));
  }

  if (signup.status === "active") {
    await supabase
      .from("games")
      .update({ signed_count: Math.max(0, gameRef.signed_count - 1) })
      .eq("id", parsed.gameId);
  } else if (signup.status === "waitlist") {
    await supabase
      .from("games")
      .update({ waitlist_count: Math.max(0, gameRef.waitlist_count - 1) })
      .eq("id", parsed.gameId);
  }

  return NextResponse.redirect(resultUrl("done"));
}
