import { NextRequest, NextResponse } from "next/server";

import { syncPaidSignupsFromGmail } from "@/lib/gmail";

async function handle(req: NextRequest): Promise<Response> {
  const expected = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization");
  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const matched = await syncPaidSignupsFromGmail();
    return NextResponse.json({ ok: true, matched });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payment sync failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

export async function GET(req: NextRequest): Promise<Response> {
  return handle(req);
}

export async function POST(req: NextRequest): Promise<Response> {
  return handle(req);
}
