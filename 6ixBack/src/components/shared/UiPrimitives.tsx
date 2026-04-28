type GameKind = "dropin" | "league" | "tournament";

const SKILL_DOTS: Record<string, number> = {
  Beginner: 1,
  Intermediate: 2,
  Advanced: 3,
  Competitive: 4,
};

export function KindBadge({ kind, invert = false }: { kind: GameKind; invert?: boolean }) {
  if (kind === "dropin") return <span className="chip gold">DROP-IN</span>;
  if (kind === "league") return <span className="chip outline" style={invert ? { color: "var(--paper)", borderColor: "var(--paper)" } : undefined}>LEAGUE</span>;
  return <span className="chip outline" style={invert ? { color: "var(--paper)", borderColor: "var(--paper)" } : undefined}>TOURNAMENT</span>;
}

export function DayStamp({ iso, size = "md", invert = false }: { iso: string; size?: "sm" | "md" | "lg"; invert?: boolean }) {
  const value = new Date(iso);
  const dow = value.toLocaleDateString("en-CA", { weekday: "short" }).toUpperCase();
  const mon = value.toLocaleDateString("en-CA", { month: "short" }).toUpperCase();
  const num = value.getDate();

  const map = {
    sm: { w: 60, p: "8px", n: 24, m: 9 },
    md: { w: 72, p: "10px", n: 36, m: 10 },
    lg: { w: 96, p: "14px", n: 54, m: 11 },
  } as const;
  const token = map[size];

  return (
    <div
      style={{
        textAlign: "center",
        minWidth: token.w,
        padding: token.p,
        border: `2px solid ${invert ? "var(--paper)" : "var(--ink)"}`,
        borderRadius: 6,
        background: invert ? "transparent" : "var(--paper)",
        color: invert ? "var(--paper)" : "var(--ink)",
        flexShrink: 0,
      }}
    >
      <div className="mono" style={{ fontSize: token.m, letterSpacing: ".12em", fontWeight: 700 }}>{dow}</div>
      <div className="display" style={{ fontSize: token.n, lineHeight: 0.85, margin: "2px 0" }}>{num}</div>
      <div className="mono" style={{ fontSize: token.m, letterSpacing: ".12em", fontWeight: 700 }}>{mon}</div>
    </div>
  );
}

export function SkillDots({ level, invert = false }: { level: string; invert?: boolean }) {
  const active = SKILL_DOTS[level] ?? 1;
  const stroke = invert ? "var(--paper)" : "var(--ink)";
  const fill = invert ? "var(--paper)" : "var(--ink)";
  return (
    <span style={{ display: "inline-flex", gap: 4 }}>
      {[1, 2, 3, 4].map((value) => (
        <i
          key={value}
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            display: "inline-block",
            background: value <= active ? fill : "transparent",
            border: `1.5px solid ${stroke}`,
          }}
        />
      ))}
    </span>
  );
}
