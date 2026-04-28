"use client";

import { Mail } from "lucide-react";
import { ConnectGmailButton } from "@/components/admin/connect-gmail-button";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function AdminConnectGmailDialogInner() {
  return (
    <>
      <div className="shrink-0 border-b border-border px-6 pb-4 pt-6 pr-14">
        <DialogHeader className="space-y-3 p-0">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Mail className="size-6" aria-hidden />
          </div>
          <DialogTitle className="text-center">Connect Gmail</DialogTitle>
          <DialogDescription className="text-center">
            Grant read-only access to the inbox that receives Interac notifications so
            pending players can be marked paid automatically. Connect Gmail first, then
            you can add venues and schedule games.
          </DialogDescription>
        </DialogHeader>
      </div>
      <div className="px-6 pb-6 pt-4">
        <DialogFooter className="p-0 sm:justify-center">
          <ConnectGmailButton className="w-full sm:w-auto" />
        </DialogFooter>
      </div>
    </>
  );
}
