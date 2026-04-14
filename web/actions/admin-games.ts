"use server";

import { revalidatePath } from "next/cache";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isAuthorizedAdmin } from "@/lib/auth";

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

function organizerDisplayName(user: User): string {
  const meta = user.user_metadata ?? {};
  const full =
    typeof meta.full_name === "string" ? meta.full_name.trim() : "";
  const short = typeof meta.name === "string" ? meta.name.trim() : "";
  if (full) return full;
  if (short) return short;
  const email = user.email?.trim() ?? "";
  const local = email.split("@")[0]?.replace(/[._]+/g, " ").trim();
  return local || "Organizer";
}

async function insertOrganizerSignupIfMissing(
  supabase: ServerSupabase,
  opts: { gameId: string; email: string; name: string }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const email = opts.email.trim().toLowerCase();
  const { data: existing } = await supabase
    .from("signups")
    .select("id")
    .eq("game_id", opts.gameId)
    .eq("email", email)
    .maybeSingle();
  if (existing) return { ok: true };

  const { error } = await supabase.from("signups").insert({
    game_id: opts.gameId,
    name: opts.name,
    email,
    friends: [],
    paid: true,
    payment_code: null,
    payment_code_expires_at: null,
    phone: null,
    waiver_accepted: true,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

type GamePayload = {
  venue_id: string | null;
  location: string;
  address: string | null;
  date: string;
  time: string;
  end_time: string | null;
  cap: number;
  price: number;
  etransfer: string;
  lat: number | null;
  lng: number | null;
  listed: boolean;
  registration_opens_at: string | null;
  entry_instructions: string | null;
  court: string | null;
};

function parseGameForm(formData: FormData):
  | { ok: false; error: string }
  | { ok: true; id: string | null; payload: GamePayload; admin_will_play: boolean } {
  const id = String(formData.get("id") ?? "").trim() || null;
  const venueIdRaw = String(formData.get("venue_id") ?? "").trim();
  const venue_id = venueIdRaw || null;
  const location = String(formData.get("location") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const time = String(formData.get("time") ?? "").trim();
  const endTimeRaw = String(formData.get("end_time") ?? "").trim();
  const cap = Number(formData.get("cap"));
  const price = Number(formData.get("price"));
  const etransfer = String(formData.get("etransfer") ?? "").trim();
  const addressRaw = String(formData.get("address") ?? "").trim();
  const entryRaw = String(formData.get("entry_instructions") ?? "").trim();
  const courtRaw = String(formData.get("court") ?? "").trim();
  const admin_will_play = String(formData.get("admin_will_play") ?? "") === "on";

  if (!location) {
    return { ok: false, error: "Location is required." };
  }
  if (!date) {
    return { ok: false, error: "Date is required." };
  }
  if (!time) {
    return { ok: false, error: "Time is required." };
  }

  let end_time: string | null = null;
  if (endTimeRaw) {
    if (!/^\d{2}:\d{2}$/.test(endTimeRaw)) {
      return { ok: false, error: "Invalid end time." };
    }
    end_time = endTimeRaw;
  }

  function hhmmToMinutes(s: string): number {
    const [h, m] = s.split(":").map((x) => Number.parseInt(x, 10));
    if (!Number.isFinite(h) || !Number.isFinite(m)) return NaN;
    return h * 60 + m;
  }
  if (end_time) {
    const a = hhmmToMinutes(time);
    const b = hhmmToMinutes(end_time);
    if (!Number.isFinite(a) || !Number.isFinite(b)) {
      return { ok: false, error: "Invalid time range." };
    }
    if (b <= a) {
      return { ok: false, error: "End time must be after start time." };
    }
  }
  if (!etransfer) {
    return { ok: false, error: "E-transfer email is required." };
  }
  if (!Number.isFinite(cap) || cap < 2) {
    return { ok: false, error: "Cap must be a number and at least 2." };
  }
  if (!Number.isFinite(price)) {
    return { ok: false, error: "Invalid price." };
  }

  const latRaw = String(formData.get("lat") ?? "").trim();
  const lngRaw = String(formData.get("lng") ?? "").trim();
  const visibility = String(formData.get("visibility") ?? "public").trim();
  const listed = visibility !== "invite";
  const opensRaw = String(formData.get("registration_opens_at") ?? "").trim();

  let registration_opens_at: string | null = null;
  if (opensRaw) {
    const d = new Date(opensRaw);
    if (!Number.isNaN(d.getTime())) registration_opens_at = d.toISOString();
  }

  const lat = latRaw ? Number(latRaw) : null;
  const lng = lngRaw ? Number(lngRaw) : null;
  if (latRaw && !Number.isFinite(lat)) {
    return { ok: false, error: "Invalid latitude." };
  }
  if (lngRaw && !Number.isFinite(lng)) {
    return { ok: false, error: "Invalid longitude." };
  }

  return {
    ok: true,
    id,
    admin_will_play,
    payload: {
      venue_id,
      location,
      address: addressRaw || null,
      date,
      time,
      end_time,
      cap,
      price,
      etransfer,
      lat: latRaw && Number.isFinite(lat) ? lat : null,
      lng: lngRaw && Number.isFinite(lng) ? lng : null,
      listed,
      registration_opens_at,
      entry_instructions: entryRaw || null,
      court: courtRaw || null,
    },
  };
}

export async function createGame(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAuthorizedAdmin(user)) return { ok: false as const, error: "Admin login required." };

  const parsed = parseGameForm(formData);
  if (!parsed.ok) return parsed;

  if (parsed.admin_will_play) {
    const email = user.email?.trim().toLowerCase();
    if (!email) {
      return {
        ok: false as const,
        error:
          "Your account has no email, so you cannot be added as a player. Uncheck \"I'm playing\" or use an account with an email.",
      };
    }
  }

  const { data: inserted, error } = await supabase
    .from("games")
    .insert(parsed.payload as never)
    .select("id")
    .single();

  if (error) return { ok: false as const, error: error.message };

  if (parsed.admin_will_play && user.email) {
    const added = await insertOrganizerSignupIfMissing(supabase, {
      gameId: inserted.id as string,
      email: user.email,
      name: organizerDisplayName(user),
    });
    if (!added.ok) {
      return {
        ok: false as const,
        error: `Game was created, but you could not be added as a player: ${added.error}. You can remove the empty game from admin or add yourself from the signup page.`,
      };
    }
  }

  revalidatePath("/admin/games");
  revalidatePath("/admin/signups");
  revalidatePath("/", "page");
  if (parsed.admin_will_play && inserted?.id) {
    revalidatePath(`/games/${inserted.id as string}`);
  }
  return { ok: true as const };
}

export async function updateGame(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAuthorizedAdmin(user)) return { ok: false as const, error: "Admin login required." };

  const parsed = parseGameForm(formData);
  if (!parsed.ok) return parsed;
  if (!parsed.id) {
    return { ok: false as const, error: "Missing game id." };
  }

  if (parsed.admin_will_play) {
    const email = user.email?.trim().toLowerCase();
    if (!email) {
      return {
        ok: false as const,
        error:
          "Your account has no email, so you cannot be added as a player. Uncheck \"I'm playing\" or use an account with an email.",
      };
    }
  }

  const { error } = await supabase
    .from("games")
    .update(parsed.payload as never)
    .eq("id", parsed.id);

  if (error) return { ok: false as const, error: error.message };

  if (parsed.admin_will_play && user.email) {
    const added = await insertOrganizerSignupIfMissing(supabase, {
      gameId: parsed.id,
      email: user.email,
      name: organizerDisplayName(user),
    });
    if (!added.ok) {
      return {
        ok: false as const,
        error: `Game was saved, but you could not be added as a player: ${added.error}. Try again from the public game page if there is still room.`,
      };
    }
  }

  revalidatePath("/admin/games");
  revalidatePath("/admin/signups");
  revalidatePath(`/admin/games/${parsed.id}/edit`);
  revalidatePath(`/games/${parsed.id}`);
  revalidatePath("/", "page");
  return { ok: true as const };
}

export async function deleteGame(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAuthorizedAdmin(user)) return;

  const { error } = await supabase.from("games").delete().eq("id", id);
  if (error) {
    console.error(error.message);
    return;
  }

  revalidatePath("/admin/games");
  revalidatePath("/", "page");
}
