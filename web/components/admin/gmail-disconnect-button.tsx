"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SubmitSpinner } from "@/components/ui/submit-spinner";

export function GmailDisconnectButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function disconnect() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/gmail/oauth/disconnect", { method: "POST" });
      const body = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !body.ok) {
        setError(body.error ?? "Failed to disconnect Gmail.");
        return;
      }
      setOpen(false);
      router.push("/admin/payments?success=gmail_disconnected");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to disconnect Gmail.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        Disconnect
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Disconnect Gmail?</DialogTitle>
            <DialogDescription>
              The stored refresh token and connected account will be removed. Payment sync will stop
              working until you reconnect.
            </DialogDescription>
          </DialogHeader>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={disconnect} disabled={pending}>
              {pending ? (
                <>
                  <SubmitSpinner />
                  Disconnecting…
                </>
              ) : (
                "Disconnect"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
