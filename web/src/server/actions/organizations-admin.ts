'use server';

import { revalidatePath } from "next/cache";

import { isAdminAuthorized } from "@/lib/auth";
import { DEFAULT_ORGANIZATION_ID } from "@/lib/organization-default";
import { createServerSupabase } from "@/lib/supabase-server";
import type { ActionResult } from "@/types/action-result";
import {
  parseCreateOrganizationFormData,
  parseDeleteOrganizationFormData,
} from "@/types/schemas/organizations";

export async function createOrganization(formData: FormData): Promise<ActionResult<{ id: string }>> {
  if (!(await isAdminAuthorized())) {
    return { ok: false, error: "Admin authorization required." };
  }
  const parsed = parseCreateOrganizationFormData(formData);
  if (!parsed.ok) return parsed;

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("organizations")
    .insert({ name: parsed.data.name })
    .select("id")
    .single<{ id: string }>();

  if (error || !data) {
    const msg = error?.message ?? "Could not create organization.";
    if (msg.toLowerCase().includes("unique") || msg.toLowerCase().includes("duplicate")) {
      return { ok: false, error: "An organization with that name already exists." };
    }
    return { ok: false, error: msg };
  }

  revalidatePath("/admin");
  return { ok: true, data: { id: data.id } };
}

export async function deleteOrganization(formData: FormData): Promise<ActionResult<null>> {
  if (!(await isAdminAuthorized())) {
    return { ok: false, error: "Admin authorization required." };
  }
  const parsed = parseDeleteOrganizationFormData(formData);
  if (!parsed.ok) return parsed;

  if (parsed.data.organizationId === DEFAULT_ORGANIZATION_ID) {
    return { ok: false, error: "The default organization cannot be deleted." };
  }

  const supabase = createServerSupabase();

  const [{ count: gameCount }, { count: signupCount }, { count: requestCount }] = await Promise.all([
    supabase
      .from("games")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", parsed.data.organizationId),
    supabase
      .from("signups")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", parsed.data.organizationId),
    supabase
      .from("host_access_requests")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", parsed.data.organizationId),
  ]);

  const total = (gameCount ?? 0) + (signupCount ?? 0) + (requestCount ?? 0);
  if (total > 0) {
    return {
      ok: false,
      error:
        "This organization is still linked to games, signups, or access requests. Remove or reassign those first.",
    };
  }

  const { error } = await supabase.from("organizations").delete().eq("id", parsed.data.organizationId);
  if (error) {
    return { ok: false, error: error.message ?? "Could not delete organization." };
  }

  revalidatePath("/admin");
  return { ok: true, data: null };
}
