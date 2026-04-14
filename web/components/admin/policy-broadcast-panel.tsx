"use client";

import { useState } from "react";
import { broadcastPlayerPolicyUpdate } from "@/actions/admin-policy-broadcast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export function PolicyBroadcastPanel() {
  const [includePast, setIncludePast] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (
      !window.confirm(
        includePast
          ? "Send the policy update to every distinct email ever captured on signups or waitlists? This may include people not on current runs."
          : "Send the policy update to everyone on an upcoming run (signups) or active waitlist (pending / invited) for those dates?"
      )
    ) {
      return;
    }
    setPending(true);
    setMessage(null);
    const r = await broadcastPlayerPolicyUpdate(includePast);
    setPending(false);
    if (r.ok) {
      setMessage(
        r.recipients === 0
          ? "No matching recipients (no upcoming games in range, or no emails)."
          : `Sent ${r.sent} message(s) to ${r.recipients} unique address(es).`
      );
    } else {
      setMessage(r.error);
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <h2 className="font-heading text-lg font-semibold text-foreground">Policy update email</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Sends one message per address with cancellation, refund, waitlist, waiver summary and a link to the full
        policies page. This does <span className="font-medium text-foreground">not</span> resend payment codes or change
        signups.
      </p>
      <div className="mt-4 flex items-start gap-3">
        <Checkbox
          id="include-past-policy-broadcast"
          checked={includePast}
          onCheckedChange={(c) => setIncludePast(c === true)}
          className="mt-0.5"
        />
        <Label htmlFor="include-past-policy-broadcast" className="cursor-pointer text-sm font-normal leading-snug">
          Include <strong>all</strong> past signups and waitlists (entire database), not only upcoming games.
        </Label>
      </div>
      <Button type="submit" className="mt-4 rounded-xl" disabled={pending}>
        {pending ? "Sending…" : "Send policy update emails"}
      </Button>
      {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
    </form>
  );
}
