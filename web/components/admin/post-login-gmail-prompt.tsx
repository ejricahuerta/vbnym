"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type PostLoginGmailPromptProps = {
  gmailConnected: boolean;
  allowlisted: boolean;
};

export function PostLoginGmailPrompt({
  gmailConnected,
  allowlisted,
}: PostLoginGmailPromptProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const open =
    searchParams.get("connect_gmail") === "1" &&
    !gmailConnected &&
    allowlisted;

  function dismiss() {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("connect_gmail");
    const q = next.toString();
    router.replace(q ? `${pathname}?${q}` : pathname);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && dismiss()}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Mail className="size-6" aria-hidden />
          </div>
          <DialogTitle className="text-center">
            Connect Gmail for payment sync
          </DialogTitle>
          <DialogDescription className="text-center">
            Grant read-only access to the inbox that receives Interac
            notifications so pending players can be marked paid automatically.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center">
          <Button variant="outline" onClick={dismiss}>
            Not now
          </Button>
          <Button asChild>
            <a href="/api/admin/gmail/oauth/start?mode=universal">Connect Gmail</a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
