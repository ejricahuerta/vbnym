import { createClient } from "@/lib/supabase/server";
import { isAllowedAdminEmail } from "@/lib/auth";
import { GmailDisconnectButton } from "@/components/admin/gmail-disconnect-button";
import { PaymentSyncPanel } from "@/components/admin/payment-sync-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getAdminPaymentSettingsRow } from "@/server/queries/admin-settings";

export async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams?: Promise<{ success?: string; error?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const settings = await getAdminPaymentSettingsRow();

  const currentEmail = user?.email?.toLowerCase() ?? "";
  const allowlisted = isAllowedAdminEmail(currentEmail);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Payment sync</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Admin-triggered Gmail sync maps payment codes from emails to pending players and marks
          matching signups paid.
        </p>
      </div>

      {!allowlisted ? (
        <Card size="sm" className="border-destructive/30 bg-destructive/10 py-3 text-destructive">
          <CardContent className="px-3 py-0 text-sm">
            Admin Gmail tools require an @ednsy.com account or an address listed in
            `ADMIN_EMAILS`.
          </CardContent>
        </Card>
      ) : null}

      {params.success ? (
        <Card size="sm" className="border-emerald-500/30 bg-emerald-500/10 py-3 text-emerald-700">
          <CardContent className="px-3 py-0 text-sm">
            {params.success === "gmail_connected"
              ? "Gmail OAuth connected."
              : params.success === "gmail_disconnected"
                ? "Gmail OAuth disconnected."
                : params.success}
          </CardContent>
        </Card>
      ) : null}

      {params.error ? (
        <Card size="sm" className="border-destructive/30 bg-destructive/10 py-3 text-destructive">
          <CardContent className="px-3 py-0 text-sm">{params.error}</CardContent>
        </Card>
      ) : null}

      <Card className="space-y-4 p-6">
        <div className="space-y-1">
          <h2 className="text-base font-semibold">Gmail OAuth</h2>
          <p className="text-sm text-muted-foreground">
            Connected account: {settings?.gmail_connected_email ?? "Not connected"}
          </p>
          <p className="text-sm text-muted-foreground">
            Connected at:{" "}
            {settings?.gmail_connected_at
              ? new Date(settings.gmail_connected_at).toLocaleString()
              : "—"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild disabled={!allowlisted}>
            <a href="/api/admin/gmail/oauth/start">
              {settings?.gmail_connected_email ? "Reconnect Gmail OAuth" : "Connect Gmail OAuth"}
            </a>
          </Button>
          {settings?.gmail_connected_email && allowlisted ? (
            <GmailDisconnectButton />
          ) : null}
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <div className="space-y-1">
          <h2 className="text-base font-semibold">Trigger secure sync</h2>
          <p className="text-sm text-muted-foreground">
            Last sync:{" "}
            {settings?.last_synced_at ? new Date(settings.last_synced_at).toLocaleString() : "Never"}
          </p>
          <p className="text-sm text-muted-foreground">
            Last matched pending players: {settings?.last_sync_matched ?? 0}
          </p>
        </div>
        {allowlisted ? <PaymentSyncPanel /> : null}
      </Card>
    </div>
  );
}
