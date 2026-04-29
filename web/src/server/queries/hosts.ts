import "server-only";

import { cache } from "react";

import { createServerSupabase } from "@/lib/supabase-server";

import type { ApprovedHostRow, HostAccessRequestContextGame, HostAccessRequestRow } from "@/types/hosts";

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

type HostAccessRequestDbRow = {
  id: string;
  email: string;
  name: string;
  message: string | null;
  status: string;
  created_at: string;
  organization_id: string;
  context_game_id: string | null;
  /** PostgREST may return a single object or a one-element array for FK embeds. */
  organizations: { name: string } | { name: string }[] | null;
};

function normalizeOrgEmbed(
  raw: HostAccessRequestDbRow["organizations"]
): { name: string } | null {
  if (raw == null) return null;
  if (Array.isArray(raw)) return raw[0] ?? null;
  return raw;
}

export const listPendingHostAccessRequests = cache(async (): Promise<HostAccessRequestRow[]> => {
  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from("host_access_requests")
      .select("id, email, name, message, status, created_at, organization_id, context_game_id, organizations ( name )")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (error || !data) return [];

    const rows = data as HostAccessRequestDbRow[];
    const gameIds = [...new Set(rows.map((r) => r.context_game_id).filter((id): id is string => Boolean(id)))];
    let gamesById = new Map<string, HostAccessRequestContextGame>();
    if (gameIds.length > 0) {
      const { data: gameRows } = await supabase
        .from("games")
        .select("id, title, starts_at")
        .in("id", gameIds);
      gamesById = new Map(
        ((gameRows ?? []) as HostAccessRequestContextGame[]).map((g) => [g.id, g])
      );
    }

    return rows.map((r) => ({
      id: r.id,
      email: r.email,
      name: r.name,
      message: r.message,
      status: r.status,
      created_at: r.created_at,
      organization_id: r.organization_id,
      organizations: normalizeOrgEmbed(r.organizations),
      context_game_id: r.context_game_id,
      context_game: r.context_game_id ? gamesById.get(r.context_game_id) ?? null : null,
    }));
  } catch {
    return [];
  }
});
