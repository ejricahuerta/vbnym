"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Phase = "visible" | "exiting" | "gone";

export function PageSplash() {
  const [phase, setPhase] = useState<Phase>("visible");

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const minMs = reduced ? 0 : 480;
    const fadeMs = reduced ? 100 : 300;

    let cancelled = false;
    let t1: number | undefined;
    let t2: number | undefined;

    const t0 = performance.now();
    const onReady = () => {
      const wait = Math.max(0, minMs - (performance.now() - t0));
      t1 = window.setTimeout(() => {
        if (cancelled) return;
        setPhase("exiting");
        t2 = window.setTimeout(() => {
          if (!cancelled) setPhase("gone");
        }, fadeMs);
      }, wait);
    };

    if (document.readyState === "complete") onReady();
    else window.addEventListener("load", onReady, { once: true });

    return () => {
      cancelled = true;
      window.removeEventListener("load", onReady);
      if (t1 !== undefined) window.clearTimeout(t1);
      if (t2 !== undefined) window.clearTimeout(t2);
    };
  }, []);

  if (phase === "gone") return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy={phase === "visible"}
      aria-label="Loading"
      className={cn(
        "fixed inset-0 z-[100001] flex flex-col items-center justify-center gap-4 bg-primary px-6 text-primary-foreground transition-[opacity] duration-300 ease-out motion-reduce:transition-none",
        phase === "exiting" ? "pointer-events-none opacity-0" : "opacity-100",
      )}
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="flex size-16 items-center justify-center overflow-hidden rounded-2xl bg-white p-2 shadow-lg ring-1 ring-black/10 motion-safe:animate-pulse">
        <Image
          src="/nym-logo.png"
          alt=""
          width={56}
          height={56}
          className="object-contain"
          priority
        />
      </div>
      <div className="text-center font-heading text-lg font-semibold tracking-tight sm:text-xl">
        NYM Volleyball
      </div>
      <Loader2
        className="size-6 text-white/65 motion-safe:animate-spin motion-reduce:animate-none"
        aria-hidden
      />
    </div>
  );
}
