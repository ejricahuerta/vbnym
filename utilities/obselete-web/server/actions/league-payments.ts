'use server';

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { isAuthorizedAdmin } from "@/lib/auth";
import type { ActionResult } from "@/types/action-result";
import { parseConfirmLeaguePaymentFromFormData } from "@/types/schemas/league-form";

export async function confirmLeagueMemberPayment(
  formData: FormData
): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAuthorizedAdmin(user)) {
    return { ok: false, error: "Admin login required." };
  }

  const parsed = parseConfirmLeaguePaymentFromFormData(formData);
  if (!parsed.ok) return parsed;

  const { data, error } = await supabase
    .from("league_member_payments")
    .update({
      status: "confirmed",
      confirmed_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.paymentId)
    .eq("status", "pending")
    .select("id");

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!data?.length) {
    return {
      ok: false,
      error: "Payment not found or already confirmed.",
    };
  }

  revalidatePath("/admin/leagues");
  revalidatePath("/app/league-team");
  return { ok: true, data: null };
}
