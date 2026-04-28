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
