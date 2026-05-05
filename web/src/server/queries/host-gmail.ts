import "server-only";

import { cache } from "react";

import { hostGmailConnectionId } from "@/lib/host-gmail";
import { createServerSupabase } from "@/lib/supabase-server";

export const isHostGmailConnected = cache(async (hostEmail: string): Promise<boolean> => {
  const email = hostEmail.trim().toLowerCase();
  if (!email) return false;
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("gmail_connections")
    .select("id")
    .eq("id", hostGmailConnectionId(email))
    .maybeSingle<{ id: string }>();
  return Boolean(data?.id);
});

/** Lowercased owner email → whether that organizer has a Gmail sync row. */
export const mapGmailConnectedForOwnerEmails = cache(
  async (ownerEmails: string[]): Promise<Record<string, boolean>> => {
    const normalized = [...new Set(ownerEmails.map((e) => e.trim().toLowerCase()).filter(Boolean))];
    if (normalized.length === 0) return {};
    const ids = normalized.map((email) => hostGmailConnectionId(email));
    try {
      const supabase = createServerSupabase();
      const { data } = await supabase.from("gmail_connections").select("id").in("id", ids);
      const connected = new Set((data ?? []).map((row) => row.id as string));
      const out: Record<string, boolean> = {};
      for (const email of normalized) {
        out[email] = connected.has(hostGmailConnectionId(email));
      }
      return out;
    } catch {
      return Object.fromEntries(normalized.map((email) => [email, false]));
    }
  }
);
