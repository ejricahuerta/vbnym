"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";

type Props = Omit<ButtonProps, "onClick"> & {
  gameId: string;
  gameTitle: string;
};

export function ShareGameButton({ gameId, gameTitle, ...rest }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = `${window.location.origin}/games/${gameId}`;
    const shareData = { title: gameTitle, url };

    if (typeof navigator.share === "function") {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        /* user cancelled or not supported — fall through to clipboard */
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  }

  return (
    <Button type="button" onClick={handleShare} {...rest}>
      {copied ? (
        <Check className="size-4 text-green-600" aria-hidden />
      ) : (
        <Share2 className="size-4" aria-hidden />
      )}
      <span className="sr-only">Share {gameTitle}</span>
    </Button>
  );
}
