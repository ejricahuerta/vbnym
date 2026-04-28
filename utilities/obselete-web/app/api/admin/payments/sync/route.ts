import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAuthorizedAdmin } from "@/lib/auth";
import { syncPaidSignupsFromGmail } from "@/lib/gmail-sync";
import { notifyAndCleanExpiredHolds } from "@/lib/hold-expiry";

export async function POST(request: NextRequest) {
  const expectedCronToken = process.env.PAYMENT_SYNC_CRON_TOKEN;
  const providedCronToken = request.headers.get("x-cron-token");
  const isCronAuthorized =
    Boolean(expectedCronToken) && providedCronToken === expectedCronToken;

  if (!isCronAuthorized) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!isAuthorizedAdmin(user)) {
      return NextResponse.json(
        { ok: false, error: "Only @ednsy.com or ADMIN_EMAILS accounts can trigger sync." },
        { status: 403 }
      );
    }
  }

  try {
    const admin = createAdminClient();
    const expired = await notifyAndCleanExpiredHolds(admin);
    const matched = await syncPaidSignupsFromGmail(admin, new URL(request.url).origin);
    return NextResponse.json({ ok: true, matched, expired });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payment sync failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
