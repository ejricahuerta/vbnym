"use client";

import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  variant?: React.ComponentProps<typeof Button>["variant"];
  className?: string;
};

export function ConnectGmailButton({ variant = "default", className }: Props) {
  return (
    <Button type="button" variant={variant} className={className} asChild>
      <a href="/api/admin/gmail/oauth/start" className="inline-flex items-center gap-2">
        <Mail className="size-4 shrink-0" aria-hidden />
        Connect Gmail
      </a>
    </Button>
  );
}
