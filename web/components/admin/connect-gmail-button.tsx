"use client";

import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  className?: string;
  /** Universal org inbox (admin settings) vs per-game dedicated inbox. */
  mode?: "universal" | "game";
  /** Required when `mode` is `game`. */
  gameId?: string;
  children?: React.ReactNode;
};

export function ConnectGmailButton({
  variant = "default",
  size,
  className,
  mode = "universal",
  gameId,
  children,
}: Props) {
  const href =
    mode === "game" && gameId
      ? `/api/admin/gmail/oauth/start?mode=game&gameId=${encodeURIComponent(gameId)}`
      : "/api/admin/gmail/oauth/start?mode=universal";

  return (
    <Button type="button" variant={variant} size={size} className={className} asChild>
      <a href={href} className="inline-flex items-center gap-2">
        <Mail className="size-4 shrink-0" aria-hidden />
        {children ?? "Connect Gmail"}
      </a>
    </Button>
  );
}
