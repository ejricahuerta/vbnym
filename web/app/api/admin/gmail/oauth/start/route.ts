import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createGmailOAuthUrl } from "@/lib/gmail-sync";
import { isAuthorizedAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAuthorizedAdmin(user)) {
    return NextResponse.redirect(new URL("/admin/login?error=not_allowed", request.url));
  }

  try {
    const url = createGmailOAuthUrl(new URL(request.url).origin);
    return NextResponse.redirect(url);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not start Gmail OAuth.";
    const destination = new URL("/admin/payments", request.url);
    destination.searchParams.set("error", message);
    return NextResponse.redirect(destination);
  }
}
