import { NextRequest, NextResponse } from "next/server";

import { fetchRecentPaymentCodes } from "@/lib/gmail";
import { createServerSupabase } from "@/lib/supabase-server";

export async function GET(req: NextRequest): Promise<Response> {
  const expected = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization");
  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabase();
  const { data: rows } = await supabase
    .from("gmail_connections")
    .select("id, access_token")
    .eq("active", true);

  const tokens =
    rows?.map((row) => row.access_token).filter((t): t is string => Boolean(t)) ?? [];

  if (tokens.length === 0) {
    return NextResponse.json({ ok: false, error: "No active gmail connection." }, { status: 400 });
  }

  const codeSets = await Promise.all(tokens.map((token) => fetchRecentPaymentCodes(token)));
  const codes = [...new Set(codeSets.flat())];
  if (codes.length > 0) {
    await supabase
      .from("signups")
      .update({ payment_status: "paid" })
      .in("payment_code", codes)
      .eq("status", "active");
  }
  return NextResponse.json({ ok: true, matched: codes.length });
}
