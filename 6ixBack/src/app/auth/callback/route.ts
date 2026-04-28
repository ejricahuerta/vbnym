import { NextRequest } from "next/server";

import { respondToMagicLinkCallback } from "@/lib/magic-link-callback";

export async function GET(request: NextRequest): Promise<Response> {
  return await respondToMagicLinkCallback(request);
}
