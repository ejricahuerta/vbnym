"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const MESSAGES: Record<string, { tone: "success" | "error" | "muted"; text: string }> = {
  ok: {
    tone: "success",
    text: "You are signed in to the team portal on this browser. Schedule and roster are below. This session expires after about a week unless you use another sign-in link.",
  },
  invalid: {
    tone: "error",
    text: "That sign-in link is invalid or expired, or this email is not on a league roster. Request a new link below.",
  },
  missing: {
    tone: "muted",
    text: "No sign-in token was provided. Use the link from your email.",
  },
};

export function LeaguePortalRecoveryBanner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const recover = searchParams.get("recover");
  const [persistedRecover, setPersistedRecover] = useState<string | null>(null);

  const displayKind =
    persistedRecover ?? (recover && MESSAGES[recover] ? recover : null);

  useEffect(() => {
    if (!recover || !MESSAGES[recover]) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync URL cleanup with one-shot banner state
    setPersistedRecover((p) => p ?? recover);
    const next = new URLSearchParams(searchParams.toString());
    next.delete("recover");
    const q = next.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  }, [pathname, recover, router, searchParams]);

  if (!displayKind || !MESSAGES[displayKind]) {
    return null;
  }

  const { tone, text } = MESSAGES[displayKind];
  return (
    <div
      role="status"
      className={cn(
        "mb-6 rounded-xl border px-4 py-3 text-sm",
        tone === "success" &&
          "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800/40 dark:bg-emerald-950/35 dark:text-emerald-100",
        tone === "error" &&
          "border-destructive/30 bg-destructive/5 text-destructive",
        tone === "muted" && "border-border bg-muted/40 text-muted-foreground"
      )}
    >
      {text}
    </div>
  );
}
