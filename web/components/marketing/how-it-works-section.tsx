import { Banknote, type LucideIcon, PartyPopper, Volleyball } from "lucide-react";
import { FadeUp } from "@/components/shared/FadeUp";

const STEPS: readonly {
  step: number;
  title: string;
  body: string;
  Icon: LucideIcon;
}[] = [
  {
    step: 1,
    title: "Pick a game",
    body: "Browse the schedule, check spots and who's signed up, then enter your name and email to claim a spot.",
    Icon: Volleyball,
  },
  {
    step: 2,
    title: "Pay by e-Transfer",
    body: "Send an Interac e-Transfer with the payment code you receive. Your spot is held for 15 minutes while you pay.",
    Icon: Banknote,
  },
  {
    step: 3,
    title: "Show up and play",
    body: "Payment is verified automatically. You'll get a confirmation email, and you're on the roster. Just show up on time.",
    Icon: PartyPopper,
  },
] as const;

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="relative overflow-hidden bg-card py-20 text-card-foreground sm:py-28"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-primary/[0.12] via-transparent to-primary/[0.08]"
        aria-hidden
      />
      <div className="relative mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8">
        <FadeUp className="mb-12 sm:mb-14">
          <h2 className="mb-3 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            How it works
          </h2>
          <p className="max-w-xl text-base text-muted-foreground">
            No accounts, no card fees. Pick a game, pay by Interac e-Transfer, and your spot is confirmed
            automatically.
          </p>
        </FadeUp>

        <ol className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {STEPS.map((item, index) => {
            const StepIcon = item.Icon;
            return (
              <li key={item.step} className="h-full">
                <FadeUp
                  className="h-full rounded-2xl border border-white/15 bg-white/10 p-6 shadow-sm backdrop-blur-xl sm:p-8"
                  delayMs={index * 100}
                >
                  <div
                    className="mb-4 flex size-10 items-center justify-center rounded-full bg-accent shadow-sm"
                    aria-hidden
                  >
                    <StepIcon className="size-5 text-accent-foreground" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-foreground">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                </FadeUp>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
