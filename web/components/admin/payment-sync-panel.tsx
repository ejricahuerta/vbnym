"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SubmitSpinner } from "@/components/ui/submit-spinner";

type SyncState = {
  kind: "idle" | "success" | "error";
  message: string | null;
};

export function PaymentSyncPanel() {
  const [pending, setPending] = useState(false);
  const [state, setState] = useState<SyncState>({ kind: "idle", message: null });

  async function runSync() {
    setPending(true);
    setState({ kind: "idle", message: null });
    try {
      const response = await fetch("/api/admin/payments/sync", { method: "POST" });
      const payload = (await response.json()) as {
        ok: boolean;
        matched?: number;
        error?: string;
      };
      if (!response.ok || !payload.ok) {
        setState({
          kind: "error",
          message: payload.error ?? "Could not sync Gmail payments.",
        });
        return;
      }
      setState({
        kind: "success",
        message: `Matched ${payload.matched ?? 0} pending player payment(s).`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Payment sync failed.";
      setState({ kind: "error", message });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <Button type="button" className="gap-2" onClick={runSync} disabled={pending}>
        {pending ? (
          <>
            <SubmitSpinner />
            Checking Gmail…
          </>
        ) : (
          "Sync pending players from Gmail"
        )}
      </Button>
      {state.message ? (
        <p
          className={
            state.kind === "error" ? "text-sm text-destructive" : "text-sm text-emerald-600"
          }
        >
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
