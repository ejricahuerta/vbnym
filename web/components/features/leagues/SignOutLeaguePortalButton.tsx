"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { clearLeaguePortalSession } from "@/server/actions/clear-league-portal-session";
import { cn } from "@/lib/utils";

export function SignOutLeaguePortalButton({ className }: { className?: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn("gap-2 rounded-xl", className)}
      disabled={pending}
      onClick={() => startTransition(() => clearLeaguePortalSession())}
    >
      <LogOut className="size-4" aria-hidden />
      Sign out
    </Button>
  );
}
