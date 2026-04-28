import { NextRequest, NextResponse } from "next/server";

import { sendGmailReauthReminder } from "@/lib/gmail-reauth-reminder";

async function handle(req: NextRequest): Promise<Response> {
  const expected = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization");
  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await sendGmailReauthReminder();
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest): Promise<Response> {
  return handle(req);
}

export async function POST(req: NextRequest): Promise<Response> {
  return handle(req);
}
