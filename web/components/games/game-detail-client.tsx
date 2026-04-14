"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, CircleCheck, Clock, Loader2, MapPin, Zap, ChevronDown, ChevronUp } from "lucide-react";
import { signupForRun, type SignupResult } from "@/actions/signup";
import { cancelSignup, type CancelResult } from "@/actions/cancel-signup";
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
import { getCookieConsent, saveGameId } from "@/lib/client/game-cookies";
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

const LS_NAME = "nym_last_player_name";
const LS_EMAIL = "nym_last_player_email";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function GameDetailClient({ game, signups }: { game: Game; signups: Signup[] }) {
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
  const [paidDialogOpen, setPaidDialogOpen] = useState(true);

  useEffect(() => {
    try {
      const n = localStorage.getItem(LS_NAME);
      const e = localStorage.getItem(LS_EMAIL);
      if (n) setPlayerName(n);
      if (e) setPlayerEmail(e);
    } catch {
      /* ignore */
    }
  }, []);

  const emailTouched = playerEmail.length > 0;
  const emailValid = EMAIL_RE.test(playerEmail.trim());

  const existingSignup = playerEmail && !onBehalf
    ? signups.find((s) => s.email.toLowerCase() === playerEmail.trim().toLowerCase())
    : null;

  const left = spotsLeft(game, signups);
  const notOpenYet = registrationNotYetOpen(game);
  const isFull = left <= 0;
  const locked = notOpenYet;
  const showAvatars = signups.slice(0, 6);
  const extra = Math.max(0, signups.length - showAvatars.length);
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
          localStorage.setItem(LS_NAME, playerName.trim());
          localStorage.setItem(LS_EMAIL, playerEmail.trim().toLowerCase());
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
    fd.set("email", playerEmail.trim().toLowerCase());
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
    <div className="flex min-h-0 flex-1 flex-col pb-24 md:pb-0 lg:grid lg:min-h-0 lg:grid-cols-[minmax(0,26rem)_1fr] lg:grid-rows-1 lg:items-start lg:gap-x-0 xl:grid-cols-[minmax(0,28rem)_1fr]">
      <section className="bg-primary px-4 pb-8 pt-3 text-primary-foreground sm:px-6 sm:pb-10 lg:sticky lg:top-6 lg:m-6 lg:mr-0 lg:flex lg:min-h-0 lg:max-h-[calc(100dvh-3rem)] lg:flex-col lg:rounded-2xl lg:px-8 lg:pb-10 lg:pt-8 lg:shadow-xl">
        <div className="mx-auto max-w-lg lg:mx-0 lg:flex lg:max-w-none lg:flex-1 lg:flex-col">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="mb-4 h-auto gap-1 px-0 text-sm font-medium text-primary-foreground/85 shadow-none hover:bg-transparent hover:text-primary-foreground"
          >
            <Link href="/">
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
          <h1 className="font-heading text-3xl font-bold italic tracking-tight sm:text-4xl">
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
          <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-primary-foreground/60">
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
                  <div className="flex size-10 items-center justify-center rounded-full border-2 border-primary bg-primary-foreground/15 text-xs font-semibold text-primary-foreground">
                    +{extra}
                  </div>
                ) : null}
              </div>
              <div className="flex min-h-0 flex-1 flex-col gap-1.5">
                <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-primary-foreground/60">
                  Players ({signups.length})
                </p>
                <ul className="max-h-[min(50vh,28rem)] min-h-0 space-y-0 overflow-y-auto overscroll-contain rounded-xl border border-primary-foreground/15 bg-primary-foreground/[0.07] px-3 py-2 text-sm text-primary-foreground/95">
                  {signups.map((s) => {
                    const fc = s.friends?.length ?? 0;
                    return (
                      <li
                        key={s.id}
                        className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 border-b border-primary-foreground/10 py-2 last:border-b-0 last:pb-0"
                      >
                        <span className="font-medium">{publicRosterName(s.name)}</span>
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
              {existingSignup.paid ? (
                <>
                  <button
                    type="button"
                    onClick={() => setPaidDialogOpen(true)}
                    className="flex w-full items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-left transition-colors hover:bg-emerald-100/70 dark:border-emerald-800/50 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50"
                  >
                    <CircleCheck className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                        You&apos;re all set
                      </p>
                      <p className="text-xs text-emerald-700 dark:text-emerald-300">
                        <span className="font-medium">{existingSignup.name}</span>
                        {(existingSignup.friends?.length ?? 0) > 0 ? (
                          <span> +{existingSignup.friends!.length} friend{existingSignup.friends!.length === 1 ? "" : "s"}</span>
                        ) : null}
                        {" — Tap for details"}
                      </p>
                    </div>
                  </button>

                  <Dialog open={paidDialogOpen} onOpenChange={setPaidDialogOpen}>
                    <DialogContent className="sm:max-w-sm" showCloseButton>
                      <div className="flex flex-col items-center text-center">
                        <div className="flex size-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                          <CircleCheck className="size-8 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <DialogTitle className="mt-4 text-center text-xl font-bold">
                          You&apos;re all set!
                        </DialogTitle>
                        <DialogDescription className="mt-1 text-center">
                          Payment received — just show up and play.
                        </DialogDescription>
                        <div className="mt-4 w-full rounded-xl border bg-muted/40 px-4 py-3 text-sm">
                          <span className="font-medium">{existingSignup.name}</span>
                          {(existingSignup.friends?.length ?? 0) > 0 ? (
                            <span className="text-muted-foreground">
                              {" "}+{existingSignup.friends!.length} friend{existingSignup.friends!.length === 1 ? "" : "s"}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <DialogFooter className="sm:justify-center">
                        <Button className="w-full rounded-xl" onClick={() => setPaidDialogOpen(false)}>
                          Got it
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
              ) : (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-800/50 dark:bg-amber-950/30">
                  <div className="mb-1 flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-amber-500 text-white">
                      <Clock className="size-5" aria-hidden />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-amber-900 dark:text-amber-100">Waiting for payment</h2>
                      <p className="text-sm text-amber-700 dark:text-amber-300">Send your e-transfer to lock in your spot.</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-amber-800 dark:text-amber-200">
                    <span className="font-medium">{existingSignup.name}</span>
                    {(existingSignup.friends?.length ?? 0) > 0 ? (
                      <span> +{existingSignup.friends!.length} friend{existingSignup.friends!.length === 1 ? "" : "s"}</span>
                    ) : null}
                  </p>
                </div>
              )}
              {!existingSignup.paid && existingSignup.payment_code ? (
                <div className="space-y-4">
                  <div className="rounded-xl border bg-card p-4 shadow-sm">
                    <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Step 1 — Copy your payment code</p>
                    <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-4 py-3 font-mono text-base font-semibold">
                      <span className="min-w-0 flex-1 truncate">{existingSignup.payment_code}</span>
                      <CopyTextButton text={existingSignup.payment_code} label="Copy code" />
                    </div>
                  </div>
                  <div className="rounded-xl border bg-card p-4 shadow-sm">
                    <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Step 2 — Send e-transfer to</p>
                    <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-4 py-3 font-mono text-base">
                      <span className="min-w-0 flex-1 truncate">{game.etransfer}</span>
                      <CopyTextButton text={game.etransfer} label="Copy email" />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">Paste the payment code as the e-transfer message.</p>
                  </div>
                </div>
              ) : null}
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button className="rounded-xl" asChild>
                  <Link href="/">Back to games</Link>
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
            <>
              <h2 className="text-2xl font-bold tracking-tight text-primary">
                {isFull ? "Join waitlist" : "Claim your spot"}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {isFull
                  ? "This game is currently full. Enter your details and we will notify you when a spot opens."
                  : "Enter your full name and email. You will see payment steps next and receive the same details by email."}
              </p>
              <form className="mt-8 flex flex-col gap-5" onSubmit={onSubmit}>
                <input type="hidden" name="game_id" value={game.id} />
                <div className="space-y-2">
                  <Label htmlFor="name">{onBehalf ? "Player full name" : "Your full name"}</Label>
                  <Input
                    id="name"
                    name="name"
                    required
                    autoComplete="name"
                    placeholder={onBehalf ? "Player name" : "Alex Rivera"}
                    className="rounded-xl bg-muted/50"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="alex@example.com"
                    className="rounded-xl bg-muted/50"
                    value={playerEmail}
                    onChange={(e) => setPlayerEmail(e.target.value)}
                  />
                  {emailTouched && !emailValid ? (
                    <p className="text-xs text-destructive">Please enter a valid email address.</p>
                  ) : null}
                </div>
                <div className="rounded-xl border bg-muted/10">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-2 px-3 py-3 text-left text-sm font-medium text-foreground"
                    onClick={() => setOptionalOpen((o) => !o)}
                  >
                    Optional details (friends, phone)
                    {optionalOpen ? <ChevronUp className="size-4 shrink-0" /> : <ChevronDown className="size-4 shrink-0" />}
                  </button>
                  {optionalOpen ? (
                    <div className="space-y-4 border-t px-3 pb-4 pt-3">
                      <div className="flex items-start gap-3 rounded-xl border bg-muted/20 p-3">
                        <Checkbox
                          id="on_behalf"
                          checked={onBehalf}
                          onCheckedChange={(c) => setOnBehalf(c === true)}
                          className="mt-0.5"
                        />
                        <Label htmlFor="on_behalf" className="text-sm font-normal leading-snug">
                          Sign up on behalf of another player.
                        </Label>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone (optional)</Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          autoComplete="tel"
                          placeholder="+1 (555) 000-0000"
                          className="rounded-xl bg-muted/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <Label>Friends (optional)</Label>
                          <Button type="button" variant="outline" size="sm" onClick={addFriendField}>
                            Add friend
                          </Button>
                        </div>
                        {friends.length > 0 ? (
                          <div className="space-y-2">
                            {friends.map((friend, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <Input
                                  name="friends[]"
                                  value={friend}
                                  onChange={(e) => updateFriend(index, e.target.value)}
                                  placeholder={`Friend ${index + 1} name`}
                                  className="rounded-xl bg-muted/50"
                                />
                                <Button type="button" variant="ghost" size="sm" onClick={() => removeFriendField(index)}>
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

                <div className="flex items-start gap-3 rounded-xl border bg-muted/20 p-3">
                  <Checkbox id="waiver" checked={waiver} onCheckedChange={(c) => setWaiver(c === true)} className="mt-0.5" />
                  <p className="text-sm font-normal leading-snug text-foreground">
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
                      cancellation & refund policy
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
                    className={`text-sm ${
                      result.waitlisted ? "text-emerald-700" : "text-destructive"
                    }`}
                  >
                    {result.error}
                  </p>
                ) : null}
                <Button type="submit" size="lg" className="w-full gap-2 rounded-xl text-base" disabled={pending || !waiver || !emailValid}>
                  {pending ? (
                    <>
                      <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                      Saving…
                    </>
                  ) : (
                    <>
                      {isFull ? "Join waitlist" : "Join game"}
                      <Zap className="size-4" aria-hidden />
                    </>
                  )}
                </Button>
              </form>
              <p className="mt-8 text-center text-xs text-muted-foreground">Secure registration · NYM Volleyball</p>
            </>
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
                  <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Step 1 — Copy your payment code</p>
                  <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-4 py-3 font-mono text-base font-semibold">
                    <span className="min-w-0 flex-1 truncate">{result?.paymentCode}</span>
                    <CopyTextButton text={result?.paymentCode ?? ""} label="Copy code" />
                  </div>
                </div>
                <div className="rounded-xl border bg-card p-4 shadow-sm">
                  <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Step 2 — Send e-transfer to</p>
                  <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-4 py-3 font-mono text-base">
                    <span className="min-w-0 flex-1 truncate">{result?.etransfer}</span>
                    <CopyTextButton text={result?.etransfer ?? ""} label="Copy email" />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">Paste the payment code as the e-transfer message.</p>
                </div>
                <div className="rounded-xl border bg-card p-4 shadow-sm">
                  <p className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Step 3 — Done</p>
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
                    Full cancellation & refund details
                  </button>
                </div>
              </details>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button className="rounded-xl" asChild>
                  <Link href="/">Back to games</Link>
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
