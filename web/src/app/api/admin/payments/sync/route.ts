import { NextRequest, NextResponse } from "next/server";

import { syncPaidSignupsFromGmail } from "@/lib/gmail";
import { isAdminAuthorized } from "@/lib/auth";

function isCronAuthorized(request: NextRequest): boolean {
  const expected = process.env.CRON_SECRET?.trim();
  const auth = request.headers.get("authorization");
  return Boolean(expected) && auth === `Bearer ${expected}`;
}

export async function POST(request: NextRequest): Promise<Response> {
  if (!isCronAuthorized(request) && !(await isAdminAuthorized())) {
    return NextResponse.json(
      { ok: false, error: "Only admins can trigger payment sync." },
      { status: 403 }
    );
  }

  try {
    const matched = await syncPaidSignupsFromGmail();
    const expired = 0;
    return NextResponse.json({ ok: true, matched, expired });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payment sync failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
