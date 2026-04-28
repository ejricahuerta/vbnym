"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminGmailConnected } from "@/components/admin/admin-gmail-gate-context";
import { AdminConnectGmailDialogInner } from "@/components/admin/admin-connect-gmail-dialog-inner";
import { CreateVenueForm } from "@/components/admin/create-venue-form";
import { Button } from "@/components/ui/button";
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

type Props = {
  /** e.g. `outline` when shown next to Create game */
  variant?: React.ComponentProps<typeof Button>["variant"];
};

export function CreateVenueModal({ variant = "outline" }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const gmailConnected = useAdminGmailConnected();

  return (
    <Dialog modal={false} open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant={variant}>
          Add venue
        </Button>
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
      >
        {gmailConnected ? (
          <>
            <div className="shrink-0 border-b border-border px-6 pb-4 pt-6 pr-14">
              <DialogHeader className="p-0">
                <DialogTitle>Add venue</DialogTitle>
                <DialogDescription>
                  Save a gym or court so new games can load its name, address, and map
                  pin in one step.
                </DialogDescription>
              </DialogHeader>
            </div>
            <div className="flex min-h-0 flex-1 flex-col">
              <CreateVenueForm
                embedded
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
