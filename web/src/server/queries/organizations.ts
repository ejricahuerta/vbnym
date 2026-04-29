import "server-only";

import { cache } from "react";

import { createServerSupabase } from "@/lib/supabase-server";
import type { OrganizationRow } from "@/types/domain";

export const listOrganizations = cache(async (): Promise<OrganizationRow[]> => {
  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from("organizations")
      .select("id, name, created_at")
      .order("name", { ascending: true });
    if (error || !data) return [];
    return data as OrganizationRow[];
  } catch {
    return [];
  }
});
