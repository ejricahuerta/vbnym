import "server-only";

import { cache } from "react";

import { createServerSupabase } from "@/lib/supabase-server";

import type { ApprovedHostRow, HostAccessRequestRow } from "@/types/hosts";

export const isApprovedHostEmail = cache(
  async (email: string): Promise<boolean> => {
    const normalized = email.trim().toLowerCase();
    if (!normalized.includes("@")) return false;
    try {
      const supabase = createServerSupabase();
      const { data, error } = await supabase
        .from("approved_hosts")
        .select("email")
        .eq("email", normalized)
        .maybeSingle<{ email: string }>();
      if (error) return false;
      return Boolean(data?.email);
    } catch {
      return false;
    }
  }
);

export const listApprovedHosts = cache(async (): Promise<ApprovedHostRow[]> => {
  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from("approved_hosts")
      .select("email, created_at")
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return data as ApprovedHostRow[];
  } catch {
    return [];
  }
});

export const listPendingHostAccessRequests = cache(async (): Promise<HostAccessRequestRow[]> => {
  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from("host_access_requests")
      .select("id, email, name, message, status, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return data as HostAccessRequestRow[];
  } catch {
    return [];
  }
});
