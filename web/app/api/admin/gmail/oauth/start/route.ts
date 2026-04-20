import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createGmailOAuthUrl } from "@/lib/gmail-sync";
import { isAuthorizedAdmin } from "@/lib/auth";
import { publicOriginFromRequest } from "@/lib/request-public-origin";

export async function GET(request: NextRequest) {
  const publicOrigin = publicOriginFromRequest(request);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAuthorizedAdmin(user)) {
    return NextResponse.redirect(new URL("/admin/login?error=not_allowed", publicOrigin));
  }

  try {
    const url = createGmailOAuthUrl(publicOrigin);
    return NextResponse.redirect(url);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not start Gmail OAuth.";
    const destination = new URL("/admin/payments", publicOrigin);
    destination.searchParams.set("error", message);
    return NextResponse.redirect(destination);
  }
}
