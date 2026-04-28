"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RegistrationPoliciesSection } from "@/components/legal/registration-policies-section";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CancellationPolicyDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[min(90vh,640px)] w-[calc(100%-2rem)] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
        showCloseButton
      >
        <DialogHeader className="shrink-0 border-b px-5 py-4 pr-14 text-left sm:px-6">
          <DialogTitle className="text-base font-semibold leading-snug sm:text-lg">
            Cancellation, payment timing and refunds
          </DialogTitle>
          <DialogDescription className="text-left text-xs sm:text-sm">
            How holds, waitlist invites, and cancellations work for 6IX BACK drop-in games.
          </DialogDescription>
        </DialogHeader>

        <RegistrationPoliciesSection className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6" />
      </DialogContent>
    </Dialog>
  );
}
