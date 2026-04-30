"use client";

import { useSyncExternalStore } from "react";

/** Matches game detail / layout breakpoint in `globals.css` (`min-width: 920px`). */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onStoreChange);
      return () => mq.removeEventListener("change", onStoreChange);
    },
    () => window.matchMedia(query).matches,
    () => false
  );
}
