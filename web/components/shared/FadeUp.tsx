"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type FadeUpProps = {
  children: ReactNode;
  className?: string;
  /** Stagger: delay before transition starts once in view (ms). */
  delayMs?: number;
  /** If false, element fades out again when leaving the viewport. */
  once?: boolean;
};

export function FadeUp({ children, className, delayMs = 0, once = true }: FadeUpProps) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [reduceMotion] = useState(prefersReducedMotion);
  const [visible, setVisible] = useState(prefersReducedMotion);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (reduceMotion) return;

    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((e) => e.isIntersecting);
        if (hit) {
          setVisible(true);
          if (once) obs.disconnect();
        } else if (!once) {
          setVisible(false);
        }
      },
      { root: null, rootMargin: "0px 0px -6% 0px", threshold: 0.06 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [once, reduceMotion]);

  return (
    <div
      ref={ref}
      className={cn(
        reduceMotion ? "translate-y-0 opacity-100" : "duration-700 ease-out transition-[opacity,transform]",
        !reduceMotion && (visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"),
        className
      )}
      style={visible && !reduceMotion ? { transitionDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </div>
  );
}
