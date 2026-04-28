'use server';

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types/action-result";
import { parseHostPublishForm } from "@/types/schemas/host-publish";

function toEndTime(startTime: string, durationMinutes: number): string {
  const [hourRaw, minuteRaw] = startTime.split(":");
  const hour = Number.parseInt(hourRaw ?? "", 10);
  const minute = Number.parseInt(minuteRaw ?? "", 10);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return startTime;
  const total = hour * 60 + minute + durationMinutes;
  const endHour = Math.floor((total % (24 * 60)) / 60);
  const endMinute = total % 60;
  return `${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}`;
}

export async function publishHostedGame(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Sign in to post your game." };
  }

  const parsed = parseHostPublishForm(formData);
  if (!parsed.ok) return parsed;
  if (parsed.data.mode !== "drop-in") {
    return { ok: false, error: "Only Drop-in is available right now." };
  }

  const endTime = toEndTime(parsed.data.startTime, parsed.data.durationMinutes);
  const entryInstructions = [
    `Skill: ${parsed.data.skillLevel}`,
    `Format: ${parsed.data.format}`,
    `Payout Name: ${parsed.data.payoutDisplayName}`,
  ].join(" | ");

  const { data: created, error: createError } = await supabase
    .from("games")
    .insert({
      location: parsed.data.title,
      address: parsed.data.venue,
      date: parsed.data.date,
      time: parsed.data.startTime,
      end_time: endTime,
      cap: parsed.data.playerCap,
      price: parsed.data.price,
      etransfer: parsed.data.etransferEmail,
      listed: true,
      entry_instructions: entryInstructions,
      court: parsed.data.format,
    })
    .select("id")
    .single<{ id: string }>();

  if (createError || !created?.id) {
    return { ok: false, error: createError?.message ?? "Could not publish game." };
  }

  const { error: syncConfigError } = await supabase.from("game_email_sync_config").upsert(
    {
      game_id: created.id,
      use_universal_fallback: true,
      preferred_gmail_connection_id: null,
    },
    { onConflict: "game_id" }
  );

  if (syncConfigError) {
    return { ok: false, error: syncConfigError.message };
  }

  revalidatePath("/app");
  revalidatePath(`/app/games/${created.id}`);
  revalidatePath("/host");
  revalidatePath("/admin/games");
  return { ok: true, data: { id: created.id } };
}
