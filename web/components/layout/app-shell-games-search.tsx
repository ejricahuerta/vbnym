"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function AppShellGamesSearchInner({
  pathname,
  className,
  placeholder = "Search games...",
  inputClassName,
}: {
  pathname: string;
  className?: string;
  placeholder?: string;
  inputClassName?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQ = pathname === "/app" ? (searchParams.get("q") ?? "") : "";
  const [draft, setDraft] = useState("");

  const pushAppQuery = useCallback(
    (next: string) => {
      const trimmed = next.trim();
      const params = new URLSearchParams(searchParams.toString());
      if (trimmed) params.set("q", trimmed);
      else params.delete("q");
      const s = params.toString();
      router.replace(s ? `/app?${s}` : "/app", { scroll: false });
    },
    [router, searchParams]
  );

  const navigateToAppSearch = useCallback(
    (next: string) => {
      const trimmed = next.trim();
      const params = new URLSearchParams();
      if (trimmed) params.set("q", trimmed);
      const s = params.toString();
      router.replace(s ? `/app?${s}` : "/app", { scroll: false });
      setDraft("");
    },
    [router]
  );

  useEffect(() => {
    if (pathname === "/app" || !draft.trim()) return;
    const t = window.setTimeout(() => {
      navigateToAppSearch(draft);
    }, 280);
    return () => window.clearTimeout(t);
  }, [draft, pathname, navigateToAppSearch]);

  const value = pathname === "/app" ? urlQ : draft;

  return (
    <div className={cn("relative min-w-0 flex-1", className)}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-app-chrome-muted"
        aria-hidden
      />
      <Input
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          if (pathname === "/app") {
            pushAppQuery(v);
          } else if (pathname.startsWith("/app/")) {
            setDraft(v);
          }
        }}
        onKeyDown={(e) => {
          if (e.key !== "Enter") return;
          e.preventDefault();
          if (pathname === "/app") {
            pushAppQuery(value);
          } else if (pathname.startsWith("/app/")) {
            navigateToAppSearch(draft);
          }
        }}
        placeholder={placeholder}
        className={cn(
          "h-10 rounded-full border-0 bg-app-chrome-search pl-10 pr-4 text-sm text-footer-foreground shadow-none",
          "placeholder:text-app-chrome-muted",
          "ring-1 ring-inset ring-white/10 focus-visible:ring-2 focus-visible:ring-accent/80",
          inputClassName
        )}
        aria-label="Search games"
      />
    </div>
  );
}

type AppShellGamesSearchProps = {
  className?: string;
  placeholder?: string;
  /** Extra classes on the input (e.g. mobile pill border). */
  inputClassName?: string;
  variant?: "toolbar" | "mobile";
};

export function AppShellGamesSearch({
  className,
  placeholder,
  inputClassName,
  variant = "toolbar",
}: AppShellGamesSearchProps) {
  const pathname = usePathname();
  const mobileInput =
    variant === "mobile"
      ? cn(
          "h-11 border border-white/15 bg-app-chrome-search/90 ring-0 focus-visible:ring-2 focus-visible:ring-accent/80",
          inputClassName
        )
      : inputClassName;

  return (
    <AppShellGamesSearchInner
      key={pathname}
      pathname={pathname}
      className={className}
      placeholder={placeholder}
      inputClassName={mobileInput}
    />
  );
}
