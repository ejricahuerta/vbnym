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

/** Decorative-only mock of a WhatsApp roster message (not affiliated with Meta). */
export function WhatsAppRosterMock() {
  return (
    <div
      className="select-none rounded-xl bg-[#0b141a] p-3 text-[13px] leading-snug text-[#e9edef] shadow-inner sm:p-4"
      aria-hidden
    >
      <div className="overflow-hidden rounded-lg bg-[#202c33] shadow-md ring-1 ring-black/25">
        <div className="flex gap-2.5 border-b border-white/10 px-2.5 pb-2 pt-2.5 sm:px-3 sm:pt-3">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#53bdeb] text-base font-semibold text-[#053b4c]"
            aria-hidden
          >
            J
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
              <span className="font-medium text-[#53bdeb]">~ Jordan</span>
              <span className="text-[12px] text-[#e9edef]/90 tabular-nums">
                +1 (555) 201-0142
              </span>
            </p>
          </div>
        </div>

        <div className="space-y-2 px-2.5 py-2.5 sm:px-3 sm:py-3">
          <div className="space-y-0.5 whitespace-pre-line text-[13px] text-[#e9edef]">
            <p>List is Open</p>
            <p>April 12, 2025</p>
            <p>Battle Arena / Colosseum</p>
            <p>12PM–2PM · $13</p>
            <p>Court 2</p>
            <p className="pt-1">Please ET before the game</p>
            <p className="pt-1">
              email:{" "}
              <span className="text-[#39d353] underline decoration-[#39d353]/60 underline-offset-2">
                roster@example.com
              </span>
            </p>
          </div>

          <ol className="list-none space-y-0.5 border-t border-white/10 pt-2 font-mono text-[12px] text-[#e9edef]/95">
            {SAMPLE_NAMES.map((name, i) => (
              <li key={name + i} className="tabular-nums">
                <span className="text-[#8696a0]">{i + 1}.</span> {name}
              </li>
            ))}
          </ol>

          <p className="text-right text-[11px] text-[#8696a0]">10:08 pm</p>
        </div>
      </div>
    </div>
  );
}
