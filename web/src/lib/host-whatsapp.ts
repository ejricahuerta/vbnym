/** Normalize optional phone input to E.164 digits only, or null if unset (games WhatsApp, admin phone, etc.). */
export function parseOptionalE164PhoneFromForm(raw: string): { ok: true; value: string | null } | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: true, value: null };
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 0) {
    return { ok: false, error: "Use digits with country code, or leave the field blank." };
  }
  let e164 = digits;
  if (digits.length === 10 && /^[2-9]\d{9}$/.test(digits)) {
    e164 = `1${digits}`;
  }
  if (e164.length < 10 || e164.length > 15 || !/^\d+$/.test(e164)) {
    return {
      ok: false,
      error: "Enter 10 to 15 digits including country code, or leave blank.",
    };
  }
  return { ok: true, value: e164 };
}

/** @alias Games may still label this “WhatsApp” in UI; parsing rules match {@link parseOptionalE164PhoneFromForm}. */
export function parseHostWhatsappE164FromForm(raw: string): { ok: true; value: string | null } | { ok: false; error: string } {
  return parseOptionalE164PhoneFromForm(raw);
}

export function buildGameHostMessageHref(params: {
  hostWhatsappE164: string | null;
  hostEmail: string;
  gameTitle: string;
}): string {
  const opener = `Hi! I am interested in ${params.gameTitle}.`;
  const digits = params.hostWhatsappE164?.trim() ?? "";
  if (/^\d{10,15}$/.test(digits)) {
    return `https://wa.me/${digits}?text=${encodeURIComponent(opener)}`;
  }
  const subject = `Question about ${params.gameTitle}`;
  const addr = params.hostEmail.trim();
  return `mailto:${encodeURIComponent(addr)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(opener)}`;
}
