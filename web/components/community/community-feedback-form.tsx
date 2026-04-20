"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  COMMUNITY_CATEGORIES,
  type CommunityCategory,
  type CommunityFeedbackResult,
} from "@/lib/community-feedback";
import { submitCommunityFeedback } from "@/server/actions/community-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormSubmitButton } from "@/components/ui/form-submit-button";

const BLURBS: Record<CommunityCategory, string> = {
  bug: "What were you trying to do, what happened instead, and which device or browser you use if relevant.",
  feature: "Describe the improvement and why it would help players or organizers.",
  sponsor: "Tell us how you would like to support the league and the best way to reach you.",
  host_game: "Proposed dates, venue or area, level, expected cost, and anything else we should know.",
  ads: "Share your brand, audience, and what you have in mind. We will follow up if it is a fit.",
};

const initialState: CommunityFeedbackResult = { ok: false };

export function CommunityFeedbackForm() {
  const [instance, setInstance] = useState(0);
  return (
    <CommunityFeedbackFormInner key={instance} onSendAnother={() => setInstance((n) => n + 1)} />
  );
}

function CommunityFeedbackFormInner({ onSendAnother }: { onSendAnother: () => void }) {
  const [state, action] = useActionState(submitCommunityFeedback, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [category, setCategory] = useState<CommunityCategory>("feature");

  useEffect(() => {
    if (state.ok && formRef.current) {
      formRef.current.reset();
    }
  }, [state.ok]);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      {state.ok ? (
        <>
          <div
            className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-4 text-sm text-foreground"
            role="status"
          >
            <p className="font-semibold text-foreground">Thanks — we received your message.</p>
            <p className="mt-2 text-muted-foreground">
              Volunteers read every submission. If a reply is needed, we will use the email you provided.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button type="button" variant="outline" className="rounded-xl" onClick={onSendAnother}>
              Send another
            </Button>
            <Button asChild className="rounded-xl">
              <Link href="/">Back to games</Link>
            </Button>
          </div>
        </>
      ) : (
        <form ref={formRef} action={action} className="space-y-6">
          {state.error ? (
            <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {state.error}
            </p>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="community-category">Topic</Label>
            <select
              id="community-category"
              name="category"
              required
              value={category}
              onChange={(e) => setCategory(e.target.value as CommunityCategory)}
              aria-describedby="community-category-hint"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {COMMUNITY_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm" id="community-category-hint">
              {BLURBS[category]}
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="community-name">Name</Label>
              <Input id="community-name" name="name" required autoComplete="name" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="community-email">Email</Label>
              <Input
                id="community-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="community-phone">Phone (optional)</Label>
            <Input id="community-phone" name="phone" type="tel" autoComplete="tel" className="rounded-xl" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="community-message">Message</Label>
            <Textarea
              id="community-message"
              name="message"
              required
              rows={7}
              className="min-h-[140px] resize-y rounded-xl"
              placeholder="Write your message here…"
            />
          </div>

          <FormSubmitButton type="submit" className="w-full rounded-xl sm:w-auto" pendingLabel="Sending…">
            Send message
          </FormSubmitButton>
        </form>
      )}
    </div>
  );
}
