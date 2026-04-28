"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createLeague } from "@/server/actions/league-hosting";

export function CreateLeagueForm() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className="space-y-4 rounded-xl border bg-card p-4"
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          const res = await createLeague(fd);
          setMessage(res.ok ? "League created." : res.error);
          if (res.ok) e.currentTarget.reset();
        });
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="league_slug">Slug (url)</Label>
          <Input id="league_slug" name="slug" required placeholder="summer-2026" className="rounded-lg" />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="league_name">Name</Label>
          <Input id="league_name" name="name" required className="rounded-lg" />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="league_desc">Description</Label>
          <Textarea id="league_desc" name="description" rows={3} className="rounded-lg" />
        </div>
      </div>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <Button type="submit" disabled={pending} className="rounded-lg">
        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
        Create league
      </Button>
    </form>
  );
}
