"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  CircleCheck,
  Clock,
  DollarSign,
  Loader2,
  MapPin,
  Users,
  Zap,
} from "lucide-react";
import { signupForRun, type SignupResult } from "@/server/actions/signup";
import { cancelSignup, type CancelResult } from "@/server/actions/cancel-signup";
import type { Game, Signup } from "@/types/vbnym";
import { Button } from "@/components/ui/button";
import { CopyTextButton } from "@/components/ui/copy-text-button";
import { ShareGameButton } from "@/components/games/share-game-button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  formatGameCourtLine,
  formatGameDateLong,
  formatGameTimeRangeLabel,
  copyableVenueLineForClipboard,
  hasDistinctGameAddress,
  initialsFromName,
  publicRosterName,
  spotsLeft,
  registrationNotYetOpen,
} from "@/lib/game-display";
import {
  getCookieConsent,
  playerEmailStorageKey,
  playerNameStorageKey,
  saveGameId,
} from "@/lib/client/game-cookies";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LiabilityWaiverDialog } from "@/components/games/liability-waiver-dialog";
import { CancellationPolicyDialog } from "@/components/games/cancellation-policy-dialog";
import {
  CANCELLATION_MIN_HOURS_BEFORE_GAME,
  GAME_SCHEDULE_TIMEZONE_LABEL,
  PAYMENT_CODE_EXPIRY_MINUTES,
  WAITLIST_INVITE_MINUTES,
} from "@/lib/registration-policy";
import { cn } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Full-row hit target: text + copy icon share one `CopyTextButton` (inner wrapper is first `span`). */
const paymentCodeCopyRowClass = cn(
  "flex w-full min-w-0 items-center gap-2 rounded-lg border bg-muted/40 px-4 py-3 font-mono text-base font-semibold text-foreground transition-colors hover:bg-muted/55",
  "[&>span:first-child]:min-w-0 [&>span:first-child]:flex-1"
);

const etransferCopyRowClass = cn(
  "flex w-full min-w-0 items-center gap-2 rounded-lg border bg-muted/40 px-4 py-3 font-mono text-base text-foreground transition-colors hover:bg-muted/55",
  "[&>span:first-child]:min-w-0 [&>span:first-child]:flex-1"
);

export function GameDetailClient({
  game,
  signups,
  authenticatedEmail,
}: {
  game: Game;
  signups: Signup[];
  authenticatedEmail?: string | null;
}) {
  const [step, setStep] = useState<"form" | "success">("form");
  const [result, setResult] = useState<SignupResult | null>(null);
  const [waiver, setWaiver] = useState(false);
  const [waiverDialogOpen, setWaiverDialogOpen] = useState(false);
  const [cancellationPolicyOpen, setCancellationPolicyOpen] = useState(false);
  const [onBehalf, setOnBehalf] = useState(false);
  const [friends, setFriends] = useState<string[]>([]);
  const [optionalOpen, setOptionalOpen] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [playerEmail, setPlayerEmail] = useState("");
  const [pending, startTransition] = useTransition();
  const [cancelPending, startCancelTransition] = useTransition();
  const [cancelResult, setCancelResult] = useState<CancelResult | null>(null);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

  useEffect(() => {
    if (authenticatedEmail) return;
    try {
      const n = localStorage.getItem(playerNameStorageKey(game.id));
      const e = localStorage.getItem(playerEmailStorageKey(game.id));
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate persisted per-game hints on mount
      if (n) setPlayerName(n);
      if (e) setPlayerEmail(e);
    } catch {
      /* ignore */
    }
  }, [authenticatedEmail, game.id]);

  const displayedEmail = authenticatedEmail ?? playerEmail;
  const emailTouched = displayedEmail.length > 0;
  const emailValid = EMAIL_RE.test(displayedEmail.trim());
  const identityEmail = (authenticatedEmail ?? playerEmail).trim().toLowerCase();

  const existingSignup = identityEmail && !onBehalf
    ? signups.find((s) => s.email.toLowerCase() === identityEmail)
    : null;
  const existingHeadCount = existingSignup
    ? 1 + (existingSignup.friends?.length ?? 0)
    : 0;
  const existingTotalDue = existingHeadCount * Number(game.price);
  const existingAttendees = existingSignup
    ? [existingSignup.name, ...(existingSignup.friends ?? [])]
    : [];

  const left = spotsLeft(game, signups);
  const notOpenYet = registrationNotYetOpen(game);
  const isFull = left <= 0;
  const locked = notOpenYet;
  const rosterHeadcount = signups.reduce(
    (n, s) => n + 1 + (s.friends?.length ?? 0),
    0
  );
  const showAvatars = signups.slice(0, 6);
  /** Each avatar is the signup’s primary player; friends count toward overflow. */
  const extra = Math.max(0, rosterHeadcount - showAvatars.length);
  const courtLine = formatGameCourtLine(game.court);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!waiver) {
      setResult({ ok: false, error: "Accept the liability waiver to continue." });
      return;
    }
    const fd = new FormData(e.currentTarget);
    fd.set("waiver_accepted", waiver ? "on" : "");
    fd.set("on_behalf", onBehalf ? "on" : "");
    startTransition(async () => {
      const res = await signupForRun(fd);
      setResult(res);
      if (res.ok) {
        try {
          localStorage.setItem(playerNameStorageKey(game.id), playerName.trim());
          localStorage.setItem(
            playerEmailStorageKey(game.id),
            playerEmail.trim().toLowerCase()
          );
        } catch {
          /* ignore */
        }
        if (getCookieConsent() === "granted") {
          saveGameId(game.id);
        }
        setStep("success");
      }
    });
  }

  function onCancel() {
    const fd = new FormData();
    fd.set("game_id", game.id);
    fd.set("email", identityEmail);
    startCancelTransition(async () => {
      const res = await cancelSignup(fd);
      setCancelResult(res);
      if (res.ok) {
        setCancelConfirmOpen(false);
      }
    });
  }

  function updateFriend(index: number, value: string) {
    setFriends((prev) => prev.map((f, i) => (i === index ? value : f)));
  }

  function addFriendField() {
    setFriends((prev) => (prev.length >= 6 ? prev : [...prev, ""]));
  }

  function removeFriendField(index: number) {
    setFriends((prev) => {
      if (prev.length <= 1) return [];
      return prev.filter((_, i) => i !== index);
    });
  }

  return (
    <div
      className={cn(
        "mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col self-center pb-24 md:pb-0",
        "lg:grid lg:min-h-0 lg:grid-cols-[minmax(0,26rem)_1fr] lg:grid-rows-1 lg:items-start lg:gap-x-0",
        "xl:grid-cols-[minmax(0,28rem)_1fr]"
      )}
    >
      <section className="bg-primary px-4 pb-8 pt-3 text-primary-foreground sm:px-6 sm:pb-10 lg:sticky lg:top-6 lg:m-6 lg:mr-0 lg:flex lg:min-h-0 lg:max-h-[calc(100dvh-3rem)] lg:flex-col lg:rounded-2xl lg:px-8 lg:pb-10 lg:pt-8 lg:shadow-xl">
        <div className="mx-auto max-w-lg lg:mx-0 lg:flex lg:max-w-none lg:flex-1 lg:flex-col">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="mb-4 h-auto gap-1 px-0 text-sm font-medium text-primary-foreground/85 shadow-none hover:bg-transparent hover:text-primary-foreground"
          >
            <Link href="/app">
              <ArrowLeft className="size-4" aria-hidden />
              Back to list
            </Link>
          </Button>
          <div className="mb-3 flex items-center gap-2">
            <Badge className="border-0 bg-accent/90 font-semibold uppercase tracking-wide text-accent-foreground hover:bg-accent">
              Drop-in
            </Badge>
            <ShareGameButton
              gameId={game.id}
              gameTitle={game.location}
              variant="ghost"
              size="icon-sm"
              className="border border-primary-foreground/25 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground"
            />
          </div>
          <h1 className="display text-4xl tracking-tight sm:text-5xl">
            {game.location}
          </h1>
          {courtLine ? <p className="mt-2 text-base font-semibold text-accent">{courtLine}</p> : null}
          <div className="mt-4 flex flex-col gap-2 text-sm">
            {hasDistinctGameAddress(game.location, game.address) ? (
              <span className="inline-flex items-start gap-2 text-primary-foreground/90">
                <MapPin className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                <span className="min-w-0 text-primary-foreground/90">
                  <span className="block font-medium text-primary-foreground">{game.location}</span>
                  <CopyTextButton
                    text={copyableVenueLineForClipboard(game.location, game.address)}
                    label="Copy address"
                    variant="ghost"
                    className="mt-1 max-w-full text-primary-foreground/75 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                  >
                    <span className="min-w-0 break-words">{game.address}</span>
                  </CopyTextButton>
                </span>
              </span>
            ) : null}
            <span className="inline-flex items-center gap-2 text-primary-foreground/90">
              <Clock className="size-4 shrink-0 text-accent" aria-hidden />
              <span>
                <span className="font-medium">{formatGameTimeRangeLabel(game)}</span>
                <span className="block text-primary-foreground/75">
                  {formatGameDateLong(game.date)}
                </span>
              </span>
            </span>
            {game.entry_instructions ? (
              <div className="mt-2 rounded-xl border border-accent/35 bg-accent/10 px-3 py-3 text-sm text-primary-foreground/95">
                <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-accent">
                  How to enter
                </p>
                <p className="mt-1 whitespace-pre-wrap text-primary-foreground/90">
                  {game.entry_instructions}
                </p>
              </div>
            ) : null}
          </div>
          <p className="eyebrow mt-6 text-primary-foreground/60">
            Availability
          </p>
          <p className="text-2xl font-bold tracking-tight text-accent">
            {locked
              ? "Opens later"
              : isFull
                ? "Full"
                : `${left} slot${left === 1 ? "" : "s"} left`}
          </p>
          {signups.length > 0 ? (
            <div className="mt-4 flex min-h-0 flex-1 flex-col gap-3 lg:min-h-0">
              <div className="flex -space-x-2">
                {showAvatars.map((s) => (
                  <Avatar key={s.id} className="size-10 border-2 border-primary ring-2 ring-primary">
                    <AvatarFallback className="text-xs">{initialsFromName(s.name)}</AvatarFallback>
                  </Avatar>
                ))}
                {extra > 0 ? (
                  <Avatar className="z-[1] size-10 border-2 border-primary ring-2 ring-primary">
                    <AvatarFallback className="bg-primary-foreground/15 text-xs font-semibold text-primary-foreground">
                      +{extra}
                    </AvatarFallback>
                  </Avatar>
                ) : null}
              </div>
              <div className="flex min-h-0 flex-1 flex-col gap-1.5">
                <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-primary-foreground/60">
                  Players ({signups.length})
                </p>
                <ul className="max-h-[min(50vh,28rem)] min-h-0 space-y-0 overflow-y-auto overscroll-contain rounded-xl border border-primary-foreground/15 bg-primary-foreground/[0.07] px-3 py-2 text-sm text-primary-foreground/95">
                  {signups.map((s) => {
                    const fc = s.friends?.length ?? 0;
                    const isMe = identityEmail && s.email.toLowerCase() === identityEmail;
                    return (
                      <li
                        key={s.id}
                        className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 border-b border-primary-foreground/10 py-2 last:border-b-0 last:pb-0"
                      >
                        <span className="flex min-w-0 items-baseline gap-2">
                          <span className="font-medium">{publicRosterName(s.name)}</span>
                          {isMe ? (
                            <span className="shrink-0 rounded-full bg-accent/80 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-accent-foreground">
                              you
                            </span>
                          ) : null}
                        </span>
                        {fc > 0 ? (
                          <span className="text-xs text-primary-foreground/70">
                            +{fc} friend{fc === 1 ? "" : "s"}
                          </span>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="relative z-10 -mt-6 rounded-t-3xl border border-b-0 bg-card px-4 pb-10 pt-6 shadow-sm sm:px-6 sm:pt-8 lg:z-auto lg:mt-0 lg:self-start lg:rounded-none lg:border-0 lg:shadow-none lg:px-8 lg:pt-10 xl:px-10">
        <div className="mx-auto max-w-lg lg:mx-0 lg:max-w-2xl xl:max-w-3xl">
          {locked ? (
            <p className="text-center text-muted-foreground">
              {notOpenYet
                ? "Registration for this game is not open yet."
                : "This game is full."}
            </p>
          ) : step === "form" && existingSignup ? (
            <div className="flex flex-col gap-5">
              {/* ── Status banner ── */}
              {existingSignup.paid ? (
                <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800/50 dark:bg-emerald-950/30">
                  <CircleCheck className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <div className="min-w-0">
                    <p className="font-semibold text-emerald-900 dark:text-emerald-100">
                      You&apos;re all set → payment confirmed
                    </p>
                    <p className="mt-0.5 text-sm text-emerald-700 dark:text-emerald-300">
                      Just show up and play!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/50 dark:bg-amber-950/30">
                  <Clock className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
                  <div className="min-w-0">
                    <p className="font-semibold text-amber-900 dark:text-amber-100">
                      Waiting for payment
                    </p>
                    <p className="mt-0.5 text-sm text-amber-700 dark:text-amber-300">
                      Send your e-transfer to lock in your spot.
                    </p>
                  </div>
                </div>
              )}

              {/* ── Registration summary ── */}
              <div className="rounded-2xl border border-border/80 bg-card shadow-sm">
                <div className="border-b border-border/60 px-5 py-4">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                    Your registration
                  </p>
                  <div className="mt-2 flex items-baseline justify-between gap-2">
                    <p className="text-xl font-bold tracking-tight text-foreground">
                      ${existingTotalDue.toFixed(2)}
                    </p>
                    <p className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      existingSignup.paid
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                    )}>
                      {existingSignup.paid ? "Paid" : "Pending payment"}
                    </p>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {existingHeadCount} {existingHeadCount === 1 ? "person" : "people"} · ${Number(game.price).toFixed(0)} each
                  </p>
                </div>
                <ul className="divide-y divide-border/50 px-5">
                  {existingAttendees.map((person, idx) => (
                    <li key={`${person}-${idx}`} className="flex items-center gap-2.5 py-3 text-sm">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[0.6rem] font-bold uppercase text-primary">
                        {person.trim().charAt(0)}
                      </div>
                      <span className="min-w-0 truncate font-medium text-foreground">{person}</span>
                      {idx === 0 && (
                        <span className="ml-auto shrink-0 text-xs text-muted-foreground">you</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {/* ── Payment steps (unpaid only) ── */}
              {!existingSignup.paid && existingSignup.payment_code ? (
                <div className="space-y-3">
                  <div className="rounded-xl border bg-card p-4 shadow-sm">
                    <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Step 1 → Copy your payment code</p>
                    <CopyTextButton
                      text={existingSignup.payment_code}
                      label="Copy payment code"
                      className={paymentCodeCopyRowClass}
                    >
                      <span className="block truncate text-left">{existingSignup.payment_code}</span>
                    </CopyTextButton>
                  </div>
                  <div className="rounded-xl border bg-card p-4 shadow-sm">
                    <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Step 2 → Send e-transfer to</p>
                    <CopyTextButton text={game.etransfer} label="Copy e-transfer email" className={etransferCopyRowClass}>
                      <span className="block truncate text-left">{game.etransfer}</span>
                    </CopyTextButton>
                    <p className="mt-2 text-xs text-muted-foreground">Paste the payment code as the e-transfer message.</p>
                  </div>
                </div>
              ) : null}

              {/* ── Actions ── */}
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button className="rounded-xl" asChild>
                  <Link href="/app">Back to games</Link>
                </Button>
                {!cancelResult?.ok ? (
                  <Button
                    variant="outline"
                    className="rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setCancelConfirmOpen(true)}
                  >
                    Cancel registration
                  </Button>
                ) : null}
              </div>
              {cancelResult?.ok ? (
                <p className="text-sm text-emerald-700">
                  Your registration has been cancelled. Check your email for confirmation.
                </p>
              ) : null}
              {cancelResult && !cancelResult.ok && cancelResult.error ? (
                <p className="text-sm text-destructive">{cancelResult.error}</p>
              ) : null}
              <Dialog open={cancelConfirmOpen} onOpenChange={setCancelConfirmOpen}>
                <DialogContent className="sm:max-w-md" showCloseButton>
                  <DialogHeader>
                    <DialogTitle>Cancel registration?</DialogTitle>
                    <DialogDescription>
                      This will remove you (and any friends in your group) from the roster. Refund
                      eligibility depends on timing and payment status.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => setCancelConfirmOpen(false)}
                    >
                      Keep registration
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      className="gap-2 rounded-xl"
                      disabled={cancelPending}
                      onClick={onCancel}
                    >
                      {cancelPending ? (
                        <>
                          <Loader2 className="size-4 animate-spin" aria-hidden />
                          Cancelling…
                        </>
                      ) : (
                        "Yes, cancel"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          ) : step === "form" ? (
            <div className="flex flex-col gap-6">
              <header className="space-y-3">
                <h2 className="font-heading text-2xl font-bold tracking-tight text-primary sm:text-3xl">
                  {isFull ? "Join the waitlist" : "Claim your spot"}
                </h2>
                <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {isFull
                    ? "This run is full right now. Add your name and email and we will email you if a spot opens."
                    : "Add your contact info below. On the next screen you will get a payment code and e-transfer instructions, and we will email you the same details."}
                </p>
                <div className="flex flex-wrap gap-2 pt-0.5">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
                      isFull
                        ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800/40 dark:bg-amber-950/35 dark:text-amber-100"
                        : "border-border/80 bg-muted/40 text-muted-foreground"
                    )}
                  >
                    <Users className="size-3.5 shrink-0 opacity-80" aria-hidden />
                    {isFull ? "Waitlist only" : `${left} spot${left === 1 ? "" : "s"} left`}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
                    <DollarSign className="size-3.5 shrink-0 opacity-80" aria-hidden />
                    ${Number(game.price).toFixed(0)} per person
                  </span>
                </div>
              </header>

              <div
                className={cn(
                  "rounded-2xl border border-border/80 bg-card p-5 shadow-sm sm:p-8",
                  "ring-1 ring-border/40"
                )}
              >
                <form className="flex flex-col gap-6" onSubmit={onSubmit}>
                  <input type="hidden" name="game_id" value={game.id} />

                  <div className="space-y-4">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                      Your details
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium">
                        {onBehalf ? "Player full name" : "Full name"}
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        required
                        autoComplete="name"
                        placeholder={onBehalf ? "Player name" : "Alex Rivera"}
                        className="h-11 rounded-xl border-border/80 bg-background shadow-sm"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">
                        Email
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        placeholder="alex@example.com"
                        aria-invalid={emailTouched && !emailValid}
                        aria-describedby={emailTouched && !emailValid ? "email-error" : undefined}
                        className="h-11 rounded-xl border-border/80 bg-background shadow-sm"
                        value={displayedEmail}
                        onChange={(e) => setPlayerEmail(e.target.value)}
                        readOnly={Boolean(authenticatedEmail)}
                      />
                      {emailTouched && !emailValid ? (
                        <p id="email-error" className="text-xs text-destructive" role="alert">
                          Please enter a valid email address.
                        </p>
                      ) : authenticatedEmail ? (
                        <p className="text-xs text-muted-foreground">
                          Signed in as {authenticatedEmail}. This game page is linked to your account.
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">We use this to confirm your spot and payment.</p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-muted/20">
                    <button
                      type="button"
                      aria-expanded={optionalOpen}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3.5 text-left transition-colors",
                        "hover:bg-muted/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                        optionalOpen && "rounded-b-none border-b border-border/60 bg-muted/30"
                      )}
                      onClick={() => setOptionalOpen((o) => !o)}
                    >
                      <span className="min-w-0 space-y-0.5">
                        <span className="block text-sm font-semibold text-foreground">More options</span>
                        <span className="block text-xs font-normal text-muted-foreground">
                          Phone, +1s, signing up for someone else
                        </span>
                      </span>
                      <ChevronDown
                        className={cn(
                          "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                          optionalOpen && "rotate-180"
                        )}
                        aria-hidden
                      />
                    </button>
                    {optionalOpen ? (
                      <div className="space-y-4 border-t border-border/60 px-4 pb-4 pt-4">
                        <div className="flex items-start gap-3 rounded-xl border border-border/50 bg-background/80 p-3.5 shadow-sm">
                          <Checkbox
                            id="on_behalf"
                            checked={onBehalf}
                            onCheckedChange={(c) => setOnBehalf(c === true)}
                            className="mt-0.5"
                          />
                          <Label htmlFor="on_behalf" className="text-sm font-normal leading-snug">
                            I am registering another player (I will pay for their group).
                          </Label>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-sm font-medium">
                            Phone <span className="font-normal text-muted-foreground">(optional)</span>
                          </Label>
                          <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            autoComplete="tel"
                            placeholder="+1 (555) 000-0000"
                            className="h-11 rounded-xl border-border/80 bg-background shadow-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <Label className="text-sm font-medium">
                              Friends <span className="font-normal text-muted-foreground">(optional)</span>
                            </Label>
                            <Button type="button" variant="outline" size="sm" className="w-full shrink-0 sm:w-auto" onClick={addFriendField}>
                              Add friend
                            </Button>
                          </div>
                          {friends.length > 0 ? (
                            <div className="space-y-2">
                              {friends.map((friend, index) => (
                                <div key={index} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                  <Input
                                    name="friends[]"
                                    value={friend}
                                    onChange={(e) => updateFriend(index, e.target.value)}
                                    placeholder={`Friend ${index + 1} full name`}
                                    className="h-11 min-w-0 flex-1 rounded-xl border-border/80 bg-background shadow-sm"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="shrink-0 text-muted-foreground hover:text-destructive"
                                    onClick={() => removeFriendField(index)}
                                  >
                                    Remove
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-start gap-3 rounded-xl border border-primary/15 bg-primary/5 p-4 dark:bg-primary/10">
                    <Checkbox id="waiver" checked={waiver} onCheckedChange={(c) => setWaiver(c === true)} className="mt-0.5" />
                    <p className="text-sm font-normal leading-relaxed text-foreground">
                      <label htmlFor="waiver" className="cursor-pointer">
                        I agree to the{" "}
                      </label>
                      <button
                        type="button"
                        className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
                        onClick={(e) => {
                          e.preventDefault();
                          setWaiverDialogOpen(true);
                        }}
                      >
                        liability waiver
                      </button>
                      <label htmlFor="waiver" className="cursor-pointer">
                        {" "}
                        and confirm I am in good health to play. I acknowledge the{" "}
                      </label>
                      <button
                        type="button"
                        className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
                        onClick={(e) => {
                          e.preventDefault();
                          setCancellationPolicyOpen(true);
                        }}
                      >
                        cancellation and refund policy
                      </button>
                      <label htmlFor="waiver" className="cursor-pointer">
                        .
                      </label>
                    </p>
                  </div>
                  <LiabilityWaiverDialog
                    open={waiverDialogOpen}
                    onOpenChange={setWaiverDialogOpen}
                    onAccept={() => {
                      setWaiver(true);
                      setWaiverDialogOpen(false);
                    }}
                  />

                  {result?.error ? (
                    <p
                      className={cn(
                        "rounded-xl border px-3 py-2.5 text-sm leading-snug",
                        result.waitlisted
                          ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800/40 dark:bg-emerald-950/35 dark:text-emerald-100"
                          : "border-destructive/30 bg-destructive/5 text-destructive"
                      )}
                      role="alert"
                    >
                      {result.error}
                    </p>
                  ) : null}

                  <div className="space-y-3 border-t border-border/60 pt-6">
                    <Button
                      type="submit"
                      size="lg"
                      className="h-12 w-full gap-2 rounded-xl text-base font-semibold shadow-md"
                      disabled={pending || !waiver || !emailValid}
                    >
                      {pending ? (
                        <>
                          <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                          Saving…
                        </>
                      ) : (
                        <>
                          {isFull ? "Join waitlist" : "Continue to payment steps"}
                          <Zap className="size-4" aria-hidden />
                        </>
                      )}
                    </Button>
                    {!pending && (!waiver || (!emailValid && !emailTouched)) ? (
                      <p className="text-center text-xs text-muted-foreground">
                        {!waiver
                          ? "Check the box above to confirm the waiver and policies."
                          : "Add your email address to continue."}
                      </p>
                    ) : null}
                    <p className="text-center text-xs text-muted-foreground">Secure registration · 6IX BACK Volleyball</p>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center dark:border-emerald-800/50 dark:bg-emerald-950/30">
                <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <Zap className="size-6" aria-hidden />
                </div>
                <h2 className="text-xl font-bold text-emerald-900 dark:text-emerald-100">You&apos;re in!</h2>
                <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">
                  Now send your e-transfer to confirm your spot.
                </p>
                {(result?.headCount ?? 1) > 1 ? (
                  <p className="mt-2 text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                    Total: ${(result?.totalDue ?? Number(game.price)).toFixed(2)} for {result?.headCount} {result?.headCount === 1 ? "person" : "people"}
                  </p>
                ) : null}
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border bg-card p-4 shadow-sm">
                  <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Step 1 → Copy your payment code</p>
                  <CopyTextButton
                    text={result?.paymentCode ?? ""}
                    label="Copy payment code"
                    className={paymentCodeCopyRowClass}
                  >
                    <span className="block truncate text-left">{result?.paymentCode}</span>
                  </CopyTextButton>
                </div>
                <div className="rounded-xl border bg-card p-4 shadow-sm">
                  <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Step 2 → Send e-transfer to</p>
                  <CopyTextButton text={result?.etransfer ?? ""} label="Copy e-transfer email" className={etransferCopyRowClass}>
                    <span className="block truncate text-left">{result?.etransfer}</span>
                  </CopyTextButton>
                  <p className="mt-2 text-xs text-muted-foreground">Paste the payment code as the e-transfer message.</p>
                </div>
                <div className="rounded-xl border bg-card p-4 shadow-sm">
                  <p className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Step 3 → Done</p>
                  <p className="text-sm text-foreground">
                    Payment is verified automatically. You&apos;ll get a confirmation email once matched.
                  </p>
                </div>
              </div>

              <details className="group rounded-xl border bg-muted/20 text-sm">
                <summary className="cursor-pointer px-4 py-3 font-medium text-muted-foreground hover:text-foreground">
                  Policy details
                </summary>
                <div className="space-y-2 border-t px-4 pb-4 pt-3 text-xs text-muted-foreground">
                  <p>Code expires in {PAYMENT_CODE_EXPIRY_MINUTES} minutes. Unpaid signups are auto-cancelled.</p>
                  <p>Cancel at least {CANCELLATION_MIN_HOURS_BEFORE_GAME}h before game time ({GAME_SCHEDULE_TIMEZONE_LABEL}).</p>
                  <p>Waitlist invites last {WAITLIST_INVITE_MINUTES} minutes. Refunds sent after games settle.</p>
                  <button
                    type="button"
                    className="mt-1 font-medium text-foreground underline underline-offset-2 hover:text-primary"
                    onClick={() => setCancellationPolicyOpen(true)}
                  >
                    Full cancellation and refund details
                  </button>
                </div>
              </details>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button className="rounded-xl" asChild>
                  <Link href="/app">Back to games</Link>
                </Button>
                {!cancelResult?.ok ? (
                  <Button
                    variant="outline"
                    className="rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setCancelConfirmOpen(true)}
                  >
                    Cancel registration
                  </Button>
                ) : null}
              </div>

              {cancelResult?.ok ? (
                <p className="text-sm text-emerald-700">
                  Your registration has been cancelled. Check your email for confirmation.
                </p>
              ) : null}
              {cancelResult && !cancelResult.ok && cancelResult.error ? (
                <p className="text-sm text-destructive">{cancelResult.error}</p>
              ) : null}

              <Dialog open={cancelConfirmOpen} onOpenChange={setCancelConfirmOpen}>
                <DialogContent className="sm:max-w-md" showCloseButton>
                  <DialogHeader>
                    <DialogTitle>Cancel registration?</DialogTitle>
                    <DialogDescription>
                      This will remove you (and any friends in your group) from the roster. Refund
                      eligibility depends on timing and payment status.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => setCancelConfirmOpen(false)}
                    >
                      Keep registration
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      className="gap-2 rounded-xl"
                      disabled={cancelPending}
                      onClick={onCancel}
                    >
                      {cancelPending ? (
                        <>
                          <Loader2 className="size-4 animate-spin" aria-hidden />
                          Cancelling…
                        </>
                      ) : (
                        "Yes, cancel"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
          {!locked ? (
            <CancellationPolicyDialog
              open={cancellationPolicyOpen}
              onOpenChange={setCancellationPolicyOpen}
            />
          ) : null}
        </div>
      </section>
    </div>
  );
}
