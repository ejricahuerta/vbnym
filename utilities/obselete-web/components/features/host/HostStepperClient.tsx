"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { ConnectGmailButton } from "@/components/admin/connect-gmail-button";
import { SixBackSection } from "@/components/shared/SixBackPageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { publishHostedGame } from "@/server/actions/host-publish";

const FLOW = ["Type", "Details", "Payment", "Publish"] as const;

export function HostStepperClient({ signedIn }: { signedIn: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [okMessage, setOkMessage] = useState<string | null>(null);

  const [mode, setMode] = useState<"drop-in" | "league" | "tournament">("drop-in");
  const [title, setTitle] = useState("");
  const [venue, setVenue] = useState("");
  const [skillLevel, setSkillLevel] = useState("Intermediate");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("120");
  const [playerCap, setPlayerCap] = useState("16");
  const [price, setPrice] = useState("15");
  const [format, setFormat] = useState("Co-ed 6s");
  const [payoutDisplayName, setPayoutDisplayName] = useState("");
  const [etransferEmail, setEtransferEmail] = useState("");

  const previewRows = useMemo(
    () => [
      ["Title", title || "→"],
      ["Venue", venue || "→"],
      ["Skill level", skillLevel || "→"],
      ["Date", date || "→"],
      ["Start time", startTime || "→"],
      ["Duration", durationMinutes ? `${durationMinutes} min` : "→"],
      ["Player cap", playerCap || "→"],
      ["Price", price ? `$${price}` : "→"],
      ["Format", format || "→"],
    ],
    [title, venue, skillLevel, date, startTime, durationMinutes, playerCap, price, format]
  );

  function continueStep() {
    setError(null);
    setStep((curr) => Math.min(curr + 1, FLOW.length - 1));
  }

  function backStep() {
    setError(null);
    setStep((curr) => Math.max(curr - 1, 0));
  }

  function onPublish() {
    setError(null);
    setOkMessage(null);
    if (!signedIn) {
      setError("Sign in first to post your game.");
      return;
    }
    const formData = new FormData();
    formData.set("mode", mode);
    formData.set("title", title);
    formData.set("venue", venue);
    formData.set("skillLevel", skillLevel);
    formData.set("date", date);
    formData.set("startTime", startTime);
    formData.set("durationMinutes", durationMinutes);
    formData.set("playerCap", playerCap);
    formData.set("price", price);
    formData.set("format", format);
    formData.set("payoutDisplayName", payoutDisplayName);
    formData.set("etransferEmail", etransferEmail);
    startTransition(async () => {
      const res = await publishHostedGame(formData);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setOkMessage("Game posted. Redirecting to game detail...");
      router.push(`/app/games/${res.data.id}`);
    });
  }

  return (
    <div className="space-y-6">
      <SixBackSection eyebrow="Host" title="Four host sections" description="1) Three quick steps. 2) Live moments. 3) Publish. 4) Players can sign up instantly.">
        <div className="grid gap-3 md:grid-cols-4">
          {["Post your night", "Post goes live", "You publish", "Players sign up"].map((label, index) => (
            <Card key={label} size="sm" className="py-3">
              <CardHeader className="px-4 pb-1">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Section {index + 1}</p>
                <CardTitle className="text-base">{label}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>
      </SixBackSection>

      <SixBackSection eyebrow="Type" title="Choose what to host">
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { value: "drop-in", label: "Drop-in", enabled: true },
            { value: "league", label: "League", enabled: false },
            { value: "tournament", label: "Tournament", enabled: false },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => item.enabled && setMode(item.value as "drop-in" | "league" | "tournament")}
              className="card p-4 text-left disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!item.enabled}
            >
              <p className="font-semibold uppercase tracking-[0.08em]">{item.label}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {item.enabled ? "Live now" : "Coming soon"}
              </p>
            </button>
          ))}
        </div>
      </SixBackSection>

      <SixBackSection eyebrow="Flow" title={FLOW[step]} description="Type → Details → Payment → Publish">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em]">
          {FLOW.map((flow, idx) => (
            <span
              key={flow}
              className={idx === step ? "rounded-full border-2 border-border bg-accent px-3 py-1" : "rounded-full border-2 border-border bg-card px-3 py-1 text-muted-foreground"}
            >
              {flow}
            </span>
          ))}
        </div>

        {step === 1 ? (
          <div className="grid gap-4 lg:grid-cols-[1.4fr,1fr]">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input placeholder="Title" value={title} onChange={(event) => setTitle(event.target.value)} />
              <Input placeholder="Venue" value={venue} onChange={(event) => setVenue(event.target.value)} />
              <Input placeholder="Skill level" value={skillLevel} onChange={(event) => setSkillLevel(event.target.value)} />
              <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
              <Input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
              <Input type="number" min={60} step={30} placeholder="Duration (min)" value={durationMinutes} onChange={(event) => setDurationMinutes(event.target.value)} />
              <Input type="number" min={2} placeholder="Player cap" value={playerCap} onChange={(event) => setPlayerCap(event.target.value)} />
              <Input type="number" min={0} placeholder="Price" value={price} onChange={(event) => setPrice(event.target.value)} />
              <Input placeholder="Format" value={format} onChange={(event) => setFormat(event.target.value)} className="sm:col-span-2" />
            </div>
            <Card size="sm" className="h-fit py-3">
              <CardHeader className="px-4 pb-1">
                <CardTitle className="text-base">Live preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 px-4 pt-1 text-sm">
                {previewRows.map(([label, value]) => (
                  <p key={label} className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium">{value}</span>
                  </p>
                ))}
              </CardContent>
            </Card>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="grid gap-3 sm:grid-cols-[1fr,auto]">
            <Input placeholder="Name shown to players" value={payoutDisplayName} onChange={(event) => setPayoutDisplayName(event.target.value)} />
            <div />
            <Input
              type="email"
              placeholder="Interac e-transfer email"
              value={etransferEmail}
              onChange={(event) => setEtransferEmail(event.target.value)}
            />
            <ConnectGmailButton variant="outline">Auto Code Matching</ConnectGmailButton>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="card p-4">
            <p className="text-sm text-muted-foreground">Ready to publish this Drop-in game with Gmail-aware payment code matching.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" onClick={onPublish} disabled={pending}>
                {pending ? "Publishing..." : "Post Your Game"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/app">Back to browse</Link>
              </Button>
            </div>
          </div>
        ) : null}

        {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
        {okMessage ? <p className="mt-4 text-sm text-green-700">{okMessage}</p> : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={backStep} disabled={step === 0 || pending}>
            Back
          </Button>
          <Button
            type="button"
            onClick={continueStep}
            disabled={step >= FLOW.length - 1 || pending}
          >
            Continue
          </Button>
        </div>
      </SixBackSection>
    </div>
  );
}
