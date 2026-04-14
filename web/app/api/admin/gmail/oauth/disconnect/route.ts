import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAuthorizedAdmin } from "@/lib/auth";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAuthorizedAdmin(user)) {
    return NextResponse.json({ ok: false, error: "Not allowed." }, { status: 403 });
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("admin_settings")
      .update({
        gmail_refresh_token: null,
        gmail_connected_email: null,
        gmail_connected_at: null,
        gmail_assumed_expires_at: null,
        gmail_reauth_reminder_sent_for_expires_at: null,
      })
      .eq("id", 1);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to disconnect Gmail.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
