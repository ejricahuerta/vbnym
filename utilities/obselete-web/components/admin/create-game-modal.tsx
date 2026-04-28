"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminGmailConnected } from "@/components/admin/admin-gmail-gate-context";
import { AdminConnectGmailDialogInner } from "@/components/admin/admin-connect-gmail-dialog-inner";
import { CreateGameForm } from "@/components/admin/create-game-form";
import { Button } from "@/components/ui/button";
import type { Venue } from "@/types/vbnym";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function isGooglePlacesUiTarget(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest(".pac-container"));
}

export function CreateGameModal({ venues = [] }: { venues?: Venue[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const gmailConnected = useAdminGmailConnected();

  return (
    <Dialog modal={false} open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button">Create game</Button>
      </DialogTrigger>
      <DialogContent
        className={
          gmailConnected
            ? "flex max-h-[min(85vh,calc(100dvh-6rem))] flex-col gap-0 overflow-hidden p-0"
            : "gap-0 overflow-hidden p-0 sm:max-w-md"
        }
        onPointerDownOutside={(event) => {
          if (gmailConnected && isGooglePlacesUiTarget(event.target)) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          if (gmailConnected && isGooglePlacesUiTarget(event.target)) event.preventDefault();
        }}
        onFocusOutside={(event) => {
          if (!gmailConnected) return;
          const next = event.detail.originalEvent.relatedTarget;
          if (isGooglePlacesUiTarget(next)) event.preventDefault();
        }}
      >
        {gmailConnected ? (
          <>
            <div className="shrink-0 border-b border-border px-6 pb-4 pt-6 pr-14">
              <DialogHeader className="p-0">
                <DialogTitle>Create game</DialogTitle>
                <DialogDescription>
                  New games appear on the public schedule when listed as public.
                </DialogDescription>
              </DialogHeader>
            </div>
            <div className="flex min-h-0 flex-1 flex-col">
              <CreateGameForm
                embedded
                venues={venues}
                onCreated={() => {
                  setOpen(false);
                  router.refresh();
                }}
              />
            </div>
          </>
        ) : (
          <AdminConnectGmailDialogInner />
        )}
      </DialogContent>
    </Dialog>
  );
}
