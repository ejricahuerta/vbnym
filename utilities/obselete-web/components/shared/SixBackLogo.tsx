import { cn } from "@/lib/utils";

export function SixBackLogo({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="inline-flex size-9 items-center justify-center rounded-md border-2 border-[var(--ink)] bg-[var(--accent)] shadow-[2px_2px_0_var(--ink)]">
        <svg viewBox="0 0 120 120" className="size-7" aria-hidden>
          <circle cx="60" cy="60" r="54" fill="var(--accent)" stroke="var(--ink)" strokeWidth="6" />
          <path d="M 12 60 Q 60 30 108 60" fill="none" stroke="var(--ink)" strokeWidth="5" />
          <path d="M 12 60 Q 60 90 108 60" fill="none" stroke="var(--ink)" strokeWidth="5" />
          <path d="M 60 6 Q 30 60 60 114" fill="none" stroke="var(--ink)" strokeWidth="5" />
          <path d="M 60 6 Q 90 60 60 114" fill="none" stroke="var(--ink)" strokeWidth="5" />
          <text
            x="60"
            y="80"
            textAnchor="middle"
            fontFamily="var(--font-display), sans-serif"
            fontWeight="900"
            fontSize="58"
            fill="var(--paper)"
            stroke="var(--ink)"
            strokeWidth="3"
            paintOrder="stroke"
          >
            6
          </text>
        </svg>
      </span>
      {showWordmark ? (
        <span className="min-w-0 leading-none">
          <span className="block truncate font-[var(--font-display)] text-sm tracking-tight sm:text-base">6IX BACK</span>
          <span className="mt-0.5 block truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-2)] sm:text-[11px]">
            Volleyball
          </span>
        </span>
      ) : null}
    </span>
  );
}
