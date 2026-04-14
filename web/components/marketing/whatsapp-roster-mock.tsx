"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, Phone, Video } from "lucide-react";
import { cn } from "@/lib/utils";

const SAMPLE_NAMES = [
  "John",
  "Dominic",
  "Bein",
  "AJ",
  "Edward",
  "Marco",
  "Nina",
  "Leo",
  "Priya",
  "Sam",
  "Chris",
  "Taylor",
  "Riley",
  "Casey",
  "Jamie",
  "Avery",
  "Quinn",
  "Mark",
] as const;

const INFO_LINES = [
  "List is Open",
  "April 12, 2025",
  "Battle Arena / Colosseum",
  "12PM–2PM · $13",
  "Court 2",
  "Please ET before the game",
  "email: roster@example.com",
] as const;

const TICK_MS = 320;
const INTRO_HOLD_TICKS = 28;
const LIST_BUBBLE_TICKS = 7;
const LOOP_PAUSE_TICKS = 52;
const LIST_PHASE_TICKS = SAMPLE_NAMES.length * LIST_BUBBLE_TICKS;
const MAX_TICK = INTRO_HOLD_TICKS + LIST_PHASE_TICKS + LOOP_PAUSE_TICKS;

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

function deriveFromTick(tick: number): { listBubbles: number } {
  let listBubbles = 0;
  if (tick >= INTRO_HOLD_TICKS) {
    listBubbles = Math.min(
      SAMPLE_NAMES.length,
      Math.floor((tick - INTRO_HOLD_TICKS) / LIST_BUBBLE_TICKS) + 1
    );
  }
  if (tick >= INTRO_HOLD_TICKS + LIST_PHASE_TICKS) {
    listBubbles = SAMPLE_NAMES.length;
  }
  return { listBubbles };
}

function listTextThrough(lineCount: number): string {
  return SAMPLE_NAMES.slice(0, lineCount)
    .map((n, i) => `${i + 1}. ${n}`)
    .join("\n");
}

function initialFrom(name: string): string {
  return name.trim().slice(0, 1).toUpperCase();
}

function fakeTimeForBubble(index: number): string {
  const min = 6 + index * 2;
  return `10:${min.toString().padStart(2, "0")} pm`;
}

type ChatBubbleInProps = {
  sender: string;
  initial: string;
  time: string;
  children: ReactNode;
  isNew?: boolean;
  reduced: boolean;
};

function ChatBubbleIn({ sender, initial, time, children, isNew, reduced }: ChatBubbleInProps) {
  return (
    <div
      className={cn(
        "flex max-w-full gap-2",
        !reduced && isNew && "motion-safe:animate-[nymFadeUp_0.32s_ease-out_both]"
      )}
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#dfe5e7] text-[11px] font-bold text-[#54656f]">
        {initial}
      </div>
      <div className="min-w-0 flex-1">
        <p className="mb-0.5 text-[12px] font-semibold text-[#128C7E]">~ {sender}</p>
        <div className="inline-block max-w-full rounded-2xl rounded-tl-md bg-white px-2.5 py-2 text-[13px] leading-snug text-[#111b21] shadow-[0_1px_0.5px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.04]">
          {children}
        </div>
        <p className="mt-0.5 text-[11px] text-[#667781]">{time}</p>
      </div>
    </div>
  );
}

/** Decorative-only mock: group chat where each player reposts the growing roster (not affiliated with Meta). */
export function WhatsAppRosterMock() {
  const reduced = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [tick, setTick] = useState(0);

  const advance = useCallback(() => {
    setTick((prev) => (prev >= MAX_TICK ? 0 : prev + 1));
  }, []);

  useEffect(() => {
    if (reduced) {
      setTick(MAX_TICK);
      return;
    }
    const id = window.setInterval(advance, TICK_MS);
    return () => window.clearInterval(id);
  }, [advance, reduced]);

  const { listBubbles } = deriveFromTick(tick);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: reduced ? "auto" : "smooth" });
  }, [listBubbles, reduced]);

  return (
    <figure
      className="mx-auto h-[600px] w-[min(100%,280px)] shrink-0 select-none sm:h-[640px] sm:w-[300px]"
      aria-hidden
    >
      {/* Phone chassis — fixed iPhone-style portrait footprint */}
      <div className="relative flex h-full flex-col rounded-[2.65rem] border border-white/12 bg-gradient-to-b from-[#4a4a4f] via-[#2e2e31] to-[#1a1a1c] p-2.5 shadow-[0_28px_56px_-12px_rgba(0,0,0,0.55)] ring-1 ring-black/60 sm:rounded-[2.85rem] sm:p-3">
        <div
          className="pointer-events-none absolute left-1/2 top-2 z-10 h-1 w-14 -translate-x-1/2 rounded-full bg-black/45 sm:top-2.5 sm:w-16"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-px top-[22%] hidden h-10 w-[3px] rounded-l-sm bg-[#2a2a2c] sm:block"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-px top-[28%] hidden h-14 w-[3px] rounded-r-sm bg-[#2a2a2c] sm:block"
          aria-hidden
        />

        {/* Glass screen — fixed height; app fills below status bar */}
        <div className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.9rem] border border-black/50 bg-black shadow-[inset_0_0_0_1px_rgba(255,255,255,0.07)] sm:mt-3.5 sm:rounded-[2.05rem]">
          {/* System status (iOS-style) */}
          <div className="relative flex h-11 shrink-0 items-end justify-between bg-black px-4 pb-1.5 pt-0.5 text-[12px] font-semibold tabular-nums text-white sm:h-12 sm:px-5">
            <span className="z-[1] pl-0.5">9:41</span>
            <div
              className="absolute left-1/2 top-2 h-[26px] w-[92px] -translate-x-1/2 rounded-full bg-[#0a0a0a] shadow-inner ring-1 ring-white/12 sm:top-2.5 sm:h-[28px] sm:w-[100px]"
              aria-hidden
            />
            <div className="z-[1] flex items-center gap-1 pr-0.5" aria-hidden>
              <span className="text-[10px] font-medium tracking-tight text-white/90">5G</span>
              <span className="inline-block h-2.5 w-6 rounded-sm border border-white/40 bg-white/90" />
            </div>
          </div>

          {/* WhatsApp app */}
          <div className="flex min-h-0 flex-1 flex-col bg-[#f0f2f5]">
            <header className="flex shrink-0 items-center gap-2 border-b border-black/[0.06] bg-white px-2 py-2 sm:gap-2.5 sm:px-2.5 sm:py-2.5">
              <ChevronLeft className="size-5 shrink-0 text-[#007aff]" strokeWidth={2.5} aria-hidden />
              <div className="size-9 shrink-0 rounded-full bg-[#dfe5e7]" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold leading-tight text-black">NYM Drop-in</p>
                <p className="text-[12px] leading-tight text-[#34b759]">Online</p>
              </div>
              <Video className="size-5 shrink-0 text-[#007aff]" strokeWidth={2} aria-hidden />
              <Phone className="size-5 shrink-0 text-[#007aff]" strokeWidth={2} aria-hidden />
            </header>

            <div
              ref={scrollRef}
              className={cn(
                "min-h-0 flex-1 overflow-x-hidden overflow-y-auto scroll-smooth",
                "bg-[#e5ddd5] px-2 py-2.5 sm:px-2.5 sm:py-3"
              )}
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-opacity='0.03'%3E%3Cpath d='M0 30h30v30H0zM30 0h30v30H30z' fill='%23000'/%3E%3C/g%3E%3C/svg%3E\")",
              }}
            >
              <div className="flex flex-col gap-3">
                <ChatBubbleIn sender="Jordan" initial="J" time="10:02 pm" reduced={reduced}>
                  <div className="space-y-1 whitespace-pre-line text-[13px] leading-snug">
                    {INFO_LINES.map((line) => (
                      <p key={line}>
                        {line.includes("roster@") ? (
                          <>
                            email:{" "}
                            <span className="text-[#039855] underline decoration-[#039855]/50 underline-offset-2">
                              roster@example.com
                            </span>
                          </>
                        ) : (
                          line
                        )}
                      </p>
                    ))}
                    <p className="pt-1 text-[12px] leading-snug text-[#667781]">
                      Copy the whole block, paste as a new message, and add your name as the next number so we can
                      track e-transfers.
                    </p>
                  </div>
                </ChatBubbleIn>

                {listBubbles > 0
                  ? Array.from({ length: listBubbles }, (_, i) => {
                      const lineCount = i + 1;
                      const sender = SAMPLE_NAMES[i];
                      const isNew = i === listBubbles - 1;
                      return (
                        <ChatBubbleIn
                          key={`${sender}-${lineCount}`}
                          sender={sender}
                          initial={initialFrom(sender)}
                          time={fakeTimeForBubble(i)}
                          reduced={reduced}
                          isNew={isNew}
                        >
                          <pre className="mb-0 max-w-[min(100%,220px)] whitespace-pre-wrap font-mono text-[12px] leading-relaxed text-[#111b21] sm:max-w-[260px]">
                            {listTextThrough(lineCount)}
                          </pre>
                        </ChatBubbleIn>
                      );
                    })
                  : null}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 border-t border-black/[0.06] bg-[#f0f2f5] px-2 py-1.5 sm:px-2.5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full text-[#54656f]">
                <span className="text-lg leading-none">+</span>
              </div>
              <div className="h-9 flex-1 rounded-full bg-white ring-1 ring-black/[0.08]" />
            </div>
          </div>
        </div>
      </div>
    </figure>
  );
}
