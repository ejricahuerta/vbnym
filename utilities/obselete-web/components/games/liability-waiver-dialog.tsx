"use client";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LiabilityWaiverSection } from "@/components/legal/liability-waiver-section";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => void;
};

export function LiabilityWaiverDialog({ open, onOpenChange, onAccept }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[min(90vh,720px)] w-[calc(100%-2rem)] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
        showCloseButton
      >
        <DialogHeader className="shrink-0 border-b px-5 py-4 pr-14 text-left sm:px-6">
          <DialogTitle className="text-base font-semibold leading-snug sm:text-lg">
            Liability waiver and release of claims
          </DialogTitle>
          <DialogDescription className="text-left text-xs sm:text-sm">
            Recreational volleyball drop-in program → Ontario, Canada. Please read carefully before accepting
            below.
          </DialogDescription>
        </DialogHeader>

        <LiabilityWaiverSection className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6" />

        <DialogFooter className="shrink-0 flex-col gap-2 border-t bg-muted/20 px-5 py-3 sm:flex-row sm:justify-end sm:px-6">
          <DialogClose asChild>
            <Button type="button" variant="outline" className="w-full rounded-xl sm:w-auto">
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            className="w-full rounded-xl sm:w-auto"
            onClick={() => {
              onAccept();
            }}
          >
            Accept
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
