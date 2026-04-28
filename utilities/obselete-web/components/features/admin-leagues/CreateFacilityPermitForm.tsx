"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createFacilityPermit } from "@/server/actions/league-hosting";

type Props = { seasonId: string };

export function CreateFacilityPermitForm({ seasonId }: Props) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className="space-y-3 rounded-xl border bg-card p-4"
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        const fd = new FormData(e.currentTarget);
        fd.set("season_id", seasonId);
        startTransition(async () => {
          const res = await createFacilityPermit(fd);
          setMessage(res.ok ? "Permit saved." : res.error);
          if (res.ok) e.currentTarget.reset();
        });
      }}
    >
      <input type="hidden" name="season_id" value={seasonId} readOnly />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="issuer_type">Issuer</Label>
          <select
            id="issuer_type"
            name="issuer_type"
            required
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="city">City (e.g. Toronto PFR)</option>
            <option value="school_board">School board (e.g. TDSB)</option>
            <option value="private_facility">Private facility</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            required
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
            defaultValue="active"
          >
            <option value="draft">draft</option>
            <option value="active">active</option>
            <option value="expired">expired</option>
            <option value="cancelled">cancelled</option>
          </select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="reference_number">Reference #</Label>
          <Input id="reference_number" name="reference_number" className="rounded-lg" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="valid_from">Valid from (date)</Label>
          <Input id="valid_from" name="valid_from" type="date" className="rounded-lg" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="valid_to">Valid to (date)</Label>
          <Input id="valid_to" name="valid_to" type="date" className="rounded-lg" />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="document_url">Document URL (optional)</Label>
          <Input id="document_url" name="document_url" type="url" className="rounded-lg" />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" rows={2} className="rounded-lg" />
        </div>
      </div>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <Button type="submit" disabled={pending} size="sm" className="rounded-lg">
        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
        Add permit
      </Button>
    </form>
  );
}
