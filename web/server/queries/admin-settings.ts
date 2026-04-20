import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

export type AdminPaymentSettingsRow = {
  gmail_connected_email: string | null;
  gmail_connected_at: string | null;
  last_synced_at: string | null;
  last_sync_matched: number | null;
};

export const getAdminPaymentSettingsRow = cache(
  async (): Promise<AdminPaymentSettingsRow | null> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("admin_settings")
      .select("gmail_connected_email, gmail_connected_at, last_synced_at, last_sync_matched")
      .eq("id", 1)
      .maybeSingle<AdminPaymentSettingsRow>();
    return data ?? null;
  }
);
