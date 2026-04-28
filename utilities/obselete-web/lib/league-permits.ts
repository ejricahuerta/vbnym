import "server-only";

import type { AdminSupabaseClient } from "@/lib/supabase/admin";

export type FacilityPermitRow = {
  id: string;
  season_id: string;
  issuer_type: string;
  status: string;
  valid_from: string | null;
  valid_to: string | null;
};

/**
 * Returns true when the season has at least one permit row that is active and
 * covers `onDate` (inclusive). Dates use calendar day in UTC for stored DATE columns.
 */
export async function seasonHasActivePermitOnDate(
  supabase: AdminSupabaseClient,
  seasonId: string,
  onDate: Date
): Promise<boolean> {
  const day = onDate.toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("facility_permits")
    .select("id, valid_from, valid_to, status")
    .eq("season_id", seasonId)
    .eq("status", "active");

  if (error || !data?.length) return false;

  for (const row of data as FacilityPermitRow[]) {
    if (row.valid_from && day < row.valid_from) continue;
    if (row.valid_to && day > row.valid_to) continue;
    return true;
  }
  return false;
}

export function isPermitWindowActive(
  row: Pick<FacilityPermitRow, "valid_from" | "valid_to" | "status">,
  onDate: Date
): boolean {
  if (row.status !== "active") return false;
  const day = onDate.toISOString().slice(0, 10);
  if (row.valid_from && day < row.valid_from) return false;
  if (row.valid_to && day > row.valid_to) return false;
  return true;
}
