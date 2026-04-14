"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  COMMUNITY_CATEGORY_VALUES,
  type CommunityFeedbackResult,
} from "@/lib/community-feedback";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clamp(s: string, max: number): string {
  const t = s.trim();
  return t.length > max ? t.slice(0, max) : t;
}

export async function submitCommunityFeedback(
  _prev: CommunityFeedbackResult | null,
  formData: FormData
): Promise<CommunityFeedbackResult> {
  const category = String(formData.get("category") ?? "").trim();
  if (!COMMUNITY_CATEGORY_VALUES.has(category)) {
    return { ok: false, error: "Choose a topic for your message." };
  }

  const name = clamp(String(formData.get("name") ?? ""), 160);
  if (name.length < 2) {
    return { ok: false, error: "Please enter your name." };
  }

  const email = clamp(String(formData.get("email") ?? ""), 254).toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  const phoneRaw = String(formData.get("phone") ?? "").trim();
  const phone = phoneRaw.length === 0 ? null : clamp(phoneRaw, 40);

  const message = clamp(String(formData.get("message") ?? ""), 8000);
  if (message.length < 10) {
    return { ok: false, error: "Please add a bit more detail (at least 10 characters)." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("community_submissions").insert({
    category,
    name,
    email,
    phone,
    message,
  });

  if (error) {
    console.error("community_submissions insert", error);
    return { ok: false, error: "Something went wrong. Please try again in a moment." };
  }

  return { ok: true };
}
