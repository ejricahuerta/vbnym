'use server';

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isAuthorizedAdmin } from "@/lib/auth";
import { parseAdminVenueFormFromFormData } from "@/types/schemas/venue-form";
import type { ActionResult } from "@/types/action-result";

export async function createVenue(
  formData: FormData
): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAuthorizedAdmin(user)) {
    return { ok: false, error: "Admin login required." };
  }

  const parsed = parseAdminVenueFormFromFormData(formData);
  if (!parsed.ok) return parsed;

  if (parsed.data.payload.is_featured) {
    await supabase.from("venues").update({ is_featured: false });
  }

  const { error } = await supabase.from("venues").insert(parsed.data.payload as never);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/venues");
  revalidatePath("/admin/games");
  revalidatePath("/", "page");
  revalidatePath("/app");
  return { ok: true, data: null };
}

export async function updateVenue(
  formData: FormData
): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAuthorizedAdmin(user)) {
    return { ok: false, error: "Admin login required." };
  }

  const parsed = parseAdminVenueFormFromFormData(formData);
  if (!parsed.ok) return parsed;
  if (!parsed.data.id) {
    return { ok: false, error: "Missing venue id." };
  }

  if (parsed.data.payload.is_featured) {
    await supabase.from("venues").update({ is_featured: false });
  }

  const { error } = await supabase
    .from("venues")
    .update(parsed.data.payload as never)
    .eq("id", parsed.data.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/venues");
  revalidatePath("/admin/games");
  revalidatePath(`/admin/venues/${parsed.data.id}/edit`);
  revalidatePath("/", "page");
  revalidatePath("/app");
  return { ok: true, data: null };
}

export async function deleteVenue(formData: FormData): Promise<ActionResult<null>> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { ok: false, error: "Missing venue id." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAuthorizedAdmin(user)) {
    return { ok: false, error: "Admin login required." };
  }

  const { error } = await supabase.from("venues").delete().eq("id", id);
  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/venues");
  revalidatePath("/admin/games");
  revalidatePath("/", "page");
  revalidatePath("/app");
  return { ok: true, data: null };
}
