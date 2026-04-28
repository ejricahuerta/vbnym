"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signupForRun } from "@/server/actions/signup";

export function ReferenceSignupForm({
  gameId,
  full,
}: {
  gameId: string;
  full: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setMessage(null);
    setError(null);
    const fd = new FormData();
    fd.set("game_id", gameId);
    fd.set("name", name);
    fd.set("email", email);
    fd.set("waiver_accepted", "on");
    startTransition(async () => {
      const result = await signupForRun(fd);
      if (!result.ok) {
        setError(result.error ?? "Could not submit signup.");
        return;
      }
      if (result.waitlisted) {
        setMessage("You are on the waitlist. We'll notify you if a spot opens.");
      } else {
        setMessage("Signup created. Check your inbox for payment instructions.");
      }
      setName("");
      setEmail("");
    });
  }

  return (
    <div className="card p-4">
      <p className="text-sm font-semibold uppercase tracking-[0.08em]">
        {full ? "Join Waitlist" : "Sign Up"}
      </p>
      <div className="mt-3 grid gap-2">
        <Input placeholder="Your name" value={name} onChange={(event) => setName(event.target.value)} />
        <Input type="email" placeholder="Your email" value={email} onChange={(event) => setEmail(event.target.value)} />
        <Button type="button" onClick={submit} disabled={pending}>
          {pending ? "Submitting..." : full ? "Join Waitlist" : "Sign Up"}
        </Button>
      </div>
      {message ? <p className="mt-2 text-sm text-green-700">{message}</p> : null}
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
