"use client";

import { List, Map } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  /** Icon-only on narrow widths; labels from `sm` up. */
  compact?: boolean;
};

export function AppShellGamesViewToggle({ className, compact = false }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  if (pathname !== "/app") return null;

  const view = searchParams.get("view") === "map" ? "map" : "list";

  function setView(next: "list" | "map"): void {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "map") params.set("view", "map");
    else params.delete("view");
    const s = params.toString();
    router.push(s ? `/app?${s}` : "/app", { scroll: false });
  }

  return (
    <ToggleGroup
      type="single"
      value={view}
      onValueChange={(v) => {
        if (v === "list" || v === "map") setView(v);
      }}
      variant="default"
      spacing={2}
      className={cn(
        "shrink-0 rounded-full bg-app-chrome-search p-1 shadow-none",
        "max-lg:border max-lg:border-white/15 max-lg:ring-0",
        "lg:ring-1 lg:ring-inset lg:ring-white/10",
        className
      )}
    >
      <ToggleGroupItem
        value="list"
        aria-label="List view"
        className={cn(
          "gap-1.5 rounded-full px-2.5 text-footer-foreground data-[state=on]:bg-accent data-[state=on]:text-accent-foreground sm:px-3",
          compact && "px-2 sm:px-3"
        )}
      >
        <List className="size-4 shrink-0" aria-hidden />
        <span className={cn(compact && "hidden sm:inline")}>List</span>
      </ToggleGroupItem>
      <ToggleGroupItem
        value="map"
        aria-label="Map view"
        className={cn(
          "gap-1.5 rounded-full px-2.5 text-footer-foreground data-[state=on]:bg-accent data-[state=on]:text-accent-foreground sm:px-3",
          compact && "px-2 sm:px-3"
        )}
      >
        <Map className="size-4 shrink-0" aria-hidden />
        <span className={cn(compact && "hidden sm:inline")}>Map</span>
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
