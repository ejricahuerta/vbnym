"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { disconnectGameGmail } from "@/server/actions/game-gmail";

export function GameGmailDisconnectButton({ gameId }: { gameId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const r = await disconnectGameGmail(gameId);
          if (r.ok) router.refresh();
        })
      }
    >
      {pending ? "Disconnecting…" : "Disconnect game Gmail"}
    </Button>
  );
}
