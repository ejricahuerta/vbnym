import { NextRequest } from "next/server";

import { respondToMagicLinkCallback } from "@/lib/magic-link-callback";

/** @deprecated Prefer `/auth/callback`; kept so older magic-link emails keep working. */
export async function GET(request: NextRequest): Promise<Response> {
  return await respondToMagicLinkCallback(request);
}
