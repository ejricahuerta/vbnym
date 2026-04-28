"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { DayStamp, KindBadge, SkillDots } from "@/components/shared/UiPrimitives";
import type { GameRow } from "@/types/domain";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function formatGameRange(iso: string, durationMinutes: number): string {
  const start = new Date(iso);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  const o: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit", hour12: true };
  return `${start.toLocaleTimeString("en-CA", o)} – ${end.toLocaleTimeString("en-CA", o)}`;
}

export function BrowseClient({ games }: { games: GameRow[] }) {
  const [tab, setTab] = useState<"all" | "dropin" | "league" | "tournament">("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [dayFilter, setDayFilter] = useState<string>("any");
  const [areaFilter, setAreaFilter] = useState<string>("all");

  const neighbourhoods = useMemo(() => {
    const set = new Set<string>();
    for (const game of games) {
      const a = game.venue_area?.trim();
      if (a) set.add(a);
    }
    return Array.from(set).sort((x, y) => x.localeCompare(y));
  }, [games]);

  const filtered = useMemo(() => {
    let list = tab === "all" ? games : games.filter((game) => game.kind === tab);

    if (dayFilter !== "any") {
      list = list.filter((game) => WEEKDAY_LABELS[new Date(game.starts_at).getDay()] === dayFilter);
    }

    if (areaFilter !== "all") {
      list = list.filter((game) => (game.venue_area ?? "").trim() === areaFilter);
    }

    return list;
  }, [games, tab, dayFilter, areaFilter]);

  const counts = useMemo(
    () => ({
      all: games.length,
      dropin: games.filter((game) => game.kind === "dropin").length,
      league: games.filter((game) => game.kind === "league").length,
      tournament: games.filter((game) => game.kind === "tournament").length,
    }),
    [games]
  );

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 14, marginBottom: 24 }}>
        <h1 className="display" style={{ fontSize: "clamp(44px, 9vw, 96px)", margin: 0, letterSpacing: "-.04em" }}>
          What&apos;s on
          <br />
          <span className="serif-display" style={{ textTransform: "lowercase" }}>this week.</span>
        </h1>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => setView("grid")} className={`btn sm ${view === "grid" ? "accent" : "ghost"}`}>Grid</button>
          <button onClick={() => setView("list")} className={`btn sm ${view === "list" ? "accent" : "ghost"}`}>List</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {[
          { id: "all", label: "All", n: counts.all },
          { id: "dropin", label: "Drop-ins", n: counts.dropin },
          { id: "league", label: "Leagues", n: counts.league },
          { id: "tournament", label: "Tournaments", n: counts.tournament },
        ].map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setTab(option.id as "all" | "dropin" | "league" | "tournament")}
            className="browse-filter-btn"
            style={{
              background: tab === option.id ? "var(--ink)" : "transparent",
              color: tab === option.id ? "var(--paper)" : "var(--ink)",
              boxShadow: tab === option.id ? "2px 2px 0 var(--accent)" : "2px 2px 0 var(--ink)",
            }}
          >
            {option.label}{" "}
            <span style={{ opacity: 0.6, fontWeight: 500 }}>{option.n}</span>
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 18 }}>
        <select
          className="input sm browse-filter-select"
          aria-label="Filter by day"
          style={{ minWidth: 132 }}
          value={dayFilter}
          onChange={(event) => setDayFilter(event.target.value)}
        >
          <option value="any">Any day</option>
          {WEEKDAY_LABELS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select
          className="input sm browse-filter-select"
          aria-label="Filter by area"
          style={{ minWidth: 170 }}
          value={areaFilter}
          onChange={(event) => setAreaFilter(event.target.value)}
        >
          <option value="all">All neighbourhoods</option>
          {neighbourhoods.map((area) => (
            <option key={area} value={area}>
              {area}
            </option>
          ))}
        </select>
        <span className="mono" style={{ marginLeft: "auto", fontSize: 12, color: "var(--ink-2)" }}>{filtered.length} found</span>
      </div>

      {filtered.length === 0 ? (
        <div
          className="card"
          style={{
            padding: "36px 28px",
            textAlign: "center",
            border: "2px solid var(--ink)",
          }}
        >
          <p className="display" style={{ fontSize: 22, margin: "0 0 12px", letterSpacing: "-.02em" }}>
            {games.length === 0 ? "No games listed right now." : "No games match your filters."}
          </p>
          <p className="mono" style={{ fontSize: 12, color: "var(--ink-2)", margin: 0, lineHeight: 1.6 }}>
            {games.length === 0 ? (
              <>
                Check back soon, or{" "}
                <Link href="/host" style={{ color: "var(--ink)", textDecoration: "underline", textUnderlineOffset: 3 }}>
                  host a game
                </Link>
                .
              </>
            ) : (
              "Try another day or neighbourhood."
            )}
          </p>
        </div>
      ) : view === "grid" ? (
        <div className="browse-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 14 }}>
          {filtered.map((g) => {
            const spots = Math.max(g.capacity - g.signed_count, 0);
            const full = g.signed_count >= g.capacity;
            const almost = !full && spots <= 4 && spots > 0;
            const isLeague = g.kind === "league";
            const isTournament = g.kind === "tournament";
            return (
              <Link key={g.id} href={`/games/${g.id}`} className={isLeague ? "liftable" : "card liftable"} style={{ display: "block", padding: 0, overflow: "hidden" }}>
                {isLeague ? (
                  <div className="card dark" style={{ padding: 0, overflow: "hidden" }}>
                    <div style={{ padding: "10px 14px", borderBottom: "2px solid var(--paper)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <KindBadge kind="league" invert />
                      <span className="chip outline" style={{ color: "var(--paper)", borderColor: "var(--paper)" }}>8 WEEKS</span>
                    </div>
                    <div style={{ padding: 20 }}>
                      <h3 className="display" style={{ fontSize: 24, margin: "0 0 12px", color: "var(--accent)", lineHeight: 0.95, letterSpacing: "-.02em" }}>
                        {g.title}
                      </h3>
                      <div style={{ fontSize: 13, color: "rgba(251,248,241,.7)", marginBottom: 14 }}>
                        {g.venue_name}
                        {g.venue_area ? ` → Starts ${new Date(g.starts_at).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}` : ""}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "rgba(251,248,241,.85)", marginBottom: 18 }}>
                        <SkillDots level={g.skill_level} invert />
                        <span className="mono" style={{ letterSpacing: ".08em", textTransform: "uppercase", fontWeight: 600 }}>{g.skill_level}</span>
                      </div>
                      <div style={{ borderTop: "2px dashed rgba(251,248,241,.3)", paddingTop: 14, display: "flex", justifyContent: "space-between" }}>
                        <div>
                          <div className="mono" style={{ fontSize: 9, color: "rgba(251,248,241,.5)", letterSpacing: ".14em", fontWeight: 700 }}>
                            TEAMS
                          </div>
                          <div className="display" style={{ fontSize: 22, color: "var(--paper)" }}>
                            {g.signed_count}/{g.capacity}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div className="mono" style={{ fontSize: 9, color: "rgba(251,248,241,.5)", letterSpacing: ".14em", fontWeight: 700 }}>
                            PER TEAM
                          </div>
                          <div className="display" style={{ fontSize: 22, color: "var(--accent)" }}>
                            ${(g.price_cents / 100).toFixed(0)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : isTournament ? (
                  <>
                    <div style={{ padding: "10px 14px", borderBottom: "2px solid var(--ink)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg)" }}>
                      <KindBadge kind="tournament" />
                      <span className="chip gold">PRIZE POOL</span>
                    </div>
                    <div style={{ padding: 18 }}>
                      <div style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 14 }}>
                        <div className="display" style={{ fontSize: 64, lineHeight: 0.85 }}>{new Date(g.starts_at).getDate()}</div>
                        <div className="mono" style={{ fontSize: 10, letterSpacing: ".14em" }}>
                          {new Date(g.starts_at).toLocaleDateString("en-CA", { weekday: "short" }).toUpperCase()} · {new Date(g.starts_at).toLocaleDateString("en-CA", { month: "short" }).toUpperCase()}
                        </div>
                      </div>
                      <h3 className="display" style={{ margin: "0 0 8px", fontSize: 30, lineHeight: 0.95 }}>{g.title}</h3>
                      <div style={{ fontSize: 13, color: "var(--ink-2)" }}>{g.venue_name} {g.notes ? ` · ${g.notes}` : ""}</div>
                      <div style={{ borderTop: "2px dashed var(--ink)", marginTop: 12, paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
                        <span className="mono" style={{ fontSize: 11 }}>{g.signed_count}/{g.capacity} TEAMS</span>
                        <span className="display" style={{ fontSize: 22 }}>${(g.price_cents / 100).toFixed(0)}/TEAM</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid var(--ink)", background: "var(--accent)" }}>
                      <KindBadge kind="dropin" />
                      {full ? (
                        <span className="chip">WAIT-LIST</span>
                      ) : almost ? (
                        <span className="chip warn">{spots} LEFT</span>
                      ) : (
                        <span className="mono" style={{ fontSize: 10, letterSpacing: ".12em", fontWeight: 700 }}>
                          OPEN
                        </span>
                      )}
                    </div>
                    <div style={{ padding: 18, display: "flex", gap: 14, alignItems: "flex-start" }}>
                      <DayStamp iso={g.starts_at} size="md" />
                      <div style={{ minWidth: 0, flex: 1 }}>
                      <h3 className="display" style={{ fontSize: 21, margin: "0 0 6px", letterSpacing: "-.02em" }}>{g.title}</h3>
                      <div style={{ fontSize: 12.5, color: "var(--ink-2)", marginBottom: 6, lineHeight: 1.5 }}>
                        <div>{g.venue_name}{g.venue_area ? ` → ${g.venue_area}` : ""}</div>
                        <div className="mono" style={{ marginTop: 4 }}>{formatGameRange(g.starts_at, g.duration_minutes)}</div>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--ink-2)", marginTop: 8, display: "inline-flex", alignItems: "center", gap: 8 }}>
                        <SkillDots level={g.skill_level} />
                        <span className="mono" style={{ letterSpacing: ".08em", fontSize: 11, fontWeight: 600 }}>{g.skill_level.toUpperCase()}</span>
                      </div>
                      </div>
                    </div>
                    <div style={{ borderTop: "2px dashed var(--ink)", background: "var(--bg)", padding: "12px 18px", display: "flex", justifyContent: "space-between" }}>
                      <span className="mono" style={{ fontSize: 11 }}>{g.signed_count}/{g.capacity} SIGNED</span>
                      <span style={{ display: "inline-flex", alignItems: "baseline", gap: 6 }}>
                        <span className="display" style={{ fontSize: 20 }}>${(g.price_cents / 100).toFixed(0)}</span>
                        <span className="mono" style={{ fontSize: 9, letterSpacing: ".14em", color: "var(--ink-3)" }}>INTERAC</span>
                      </span>
                    </div>
                  </>
                )}
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {filtered.map((g, index) => (
            <Link
              key={g.id}
              href={`/games/${g.id}`}
              className="browse-list-row"
              style={{
                display: "grid",
                gridTemplateColumns: "80px 1.6fr 1.2fr 0.8fr 0.6fr 0.6fr",
                gap: 14,
                alignItems: "center",
                padding: "14px 18px",
                borderBottom: index < filtered.length - 1 ? "1px dashed var(--ink-3)" : "none",
              }}
            >
              <DayStamp iso={g.starts_at} size="sm" />
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                  <KindBadge kind={g.kind} />
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>{g.title}</h4>
                </div>
                <div style={{ fontSize: 12.5, color: "var(--ink-2)" }}>
                  {formatGameRange(g.starts_at, g.duration_minutes)}
                </div>
              </div>
              <div style={{ fontSize: 13 }}>
                {g.venue_name}
                <br />
                <span style={{ color: "var(--ink-3)" }}>{g.venue_area ?? "Toronto"}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5 }}>
                <SkillDots level={g.skill_level} />
              </div>
              <div className="mono" style={{ fontSize: 11, letterSpacing: ".08em", fontWeight: 700 }}>
                {g.signed_count}/{g.capacity}
              </div>
              <div className="display" style={{ fontSize: 18 }}>${(g.price_cents / 100).toFixed(0)}</div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
