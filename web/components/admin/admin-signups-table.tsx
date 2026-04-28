"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Game, Signup } from "@/types/vbnym";
import { headsForSignup } from "@/types/vbnym";
import { formatGameCourtLine } from "@/lib/game-display";
import { MarkSignupPaidButton } from "@/components/admin/mark-signup-paid-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronRight,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type GameRow = Pick<Game, "id" | "location" | "date" | "court">;

type SortKey = "created_at" | "name" | "email" | "payment_code" | "paid" | "game";
type SortDir = "asc" | "desc";
type GroupBy = "none" | "game" | "paid" | "day";
type PaidFilter = "all" | "paid" | "unpaid";
type ColMode = "essential" | "all";

const PAGE_SIZES = [25, 50, 100] as const;
/** Sentinel for "show all rows on one page" (avoids uncontrolled Select value). */
const PAGE_SIZE_ALL = 1_000_000;

function gameSortLabel(game: GameRow | undefined): string {
  if (!game) return "";
  const court = game.court ? formatGameCourtLine(game.court) : "";
  return `${game.location} ${game.date} ${court}`.trim().toLowerCase();
}

function signupDayKey(s: Signup): string {
  const raw = s.created_at;
  if (!raw) return "unknown";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "unknown";
  return d.toISOString().slice(0, 10);
}

function formatDayHeading(day: string): string {
  if (day === "unknown") return "Unknown date";
  const d = new Date(`${day}T12:00:00`);
  if (Number.isNaN(d.getTime())) return day;
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return "→";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "→";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function compareStr(a: string, b: string): number {
  return a.localeCompare(b, undefined, { sensitivity: "base" });
}

function MobileDetailRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-0.5">
      <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      <div className="min-w-0 text-sm break-words text-foreground">{children}</div>
    </div>
  );
}

type Props = {
  signups: Signup[];
  gameById: Record<string, GameRow>;
};

type SortHeadProps = {
  k: SortKey;
  children: ReactNode;
  className?: string;
  sortKey: SortKey;
  sortDir: SortDir;
  onToggle: (key: SortKey) => void;
};

function SortHead({
  k,
  children,
  className,
  sortKey,
  sortDir,
  onToggle,
}: SortHeadProps) {
  const active = sortKey === k;
  return (
    <TableHead className={cn(className)}>
      <button
        type="button"
        className="inline-flex items-center gap-1 font-medium hover:text-foreground"
        onClick={() => onToggle(k)}
      >
        {children}
        {active ? (
          sortDir === "asc" ? (
            <ArrowUp className="size-3.5 opacity-70" />
          ) : (
            <ArrowDown className="size-3.5 opacity-70" />
          )
        ) : (
          <ChevronsUpDown className="size-3.5 opacity-40" />
        )}
      </button>
    </TableHead>
  );
}

export function AdminSignupsTable({ signups, gameById }: Props) {
  const [search, setSearch] = useState("");
  const [paidFilter, setPaidFilter] = useState<PaidFilter>("all");
  const [gameFilter, setGameFilter] = useState<string>("all");
  const [groupBy, setGroupBy] = useState<GroupBy>("none");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [colMode, setColMode] = useState<ColMode>("essential");
  /** Signup ids with expanded detail on small screens. */
  const [mobileExpanded, setMobileExpanded] = useState<Set<string>>(() => new Set());

  const gameOptions = useMemo(() => {
    const rows = Object.values(gameById);
    rows.sort((a, b) => compareStr(a.date, b.date) || compareStr(a.location, b.location));
    return rows;
  }, [gameById]);

  const toggleSort = useCallback((key: SortKey) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir(key === "created_at" || key === "paid" ? "desc" : "asc");
    } else {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    }
  }, [sortKey]);

  useEffect(() => {
    // Reset pagination when filtering/sorting options change.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [search, paidFilter, gameFilter, groupBy, sortKey, sortDir, pageSize, colMode]);

  const toggleMobileDetail = useCallback((id: string) => {
    setMobileExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return signups.filter((s) => {
      if (paidFilter === "paid" && !s.paid) return false;
      if (paidFilter === "unpaid" && s.paid) return false;
      if (gameFilter !== "all" && s.game_id !== gameFilter) return false;
      if (!q) return true;
      const code = (s.payment_code ?? "").toLowerCase();
      const friends = (s.friends ?? []).join(" ").toLowerCase();
      const blob = [
        s.name,
        s.email,
        code,
        friends,
        s.phone ?? "",
        gameById[s.game_id]?.location ?? "",
        gameById[s.game_id]?.date ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
  }, [signups, search, paidFilter, gameFilter, gameById]);

  const groupKeyFn = useCallback(
    (s: Signup): string => {
      switch (groupBy) {
        case "game":
          return s.game_id;
        case "paid":
          return s.paid ? "paid" : "unpaid";
        case "day":
          return signupDayKey(s);
        default:
          return "";
      }
    },
    [groupBy]
  );

  const groupLabel = useCallback(
    (key: string): string => {
      if (groupBy === "none") return "";
      if (groupBy === "paid") return key === "paid" ? "Paid" : "Unpaid";
      if (groupBy === "day") return formatDayHeading(key);
      const g = gameById[key];
      if (!g) return "Unknown game";
      const court = g.court ? formatGameCourtLine(g.court) : null;
      return `${g.location} · ${g.date}${court ? ` · ${court}` : ""}`;
    },
    [groupBy, gameById]
  );

  const sorted = useMemo(() => {
    const list = [...filtered];
    const dirMul = sortDir === "asc" ? 1 : -1;

    const cmp = (a: Signup, b: Signup): number => {
      if (groupBy !== "none") {
        const ga = groupKeyFn(a);
        const gb = groupKeyFn(b);
        let gOrder = 0;
        if (groupBy === "paid") {
          if (a.paid !== b.paid) gOrder = a.paid ? 1 : -1;
        } else if (groupBy === "day") {
          const ua = ga === "unknown";
          const ub = gb === "unknown";
          if (ua !== ub) gOrder = ua ? 1 : -1;
          else gOrder = compareStr(ga, gb);
        } else if (groupBy === "game") {
          gOrder = compareStr(groupLabel(ga), groupLabel(gb));
        }
        if (gOrder !== 0) return gOrder;
      }

      switch (sortKey) {
        case "name":
          return dirMul * compareStr(a.name, b.name);
        case "email":
          return dirMul * compareStr(a.email, b.email);
        case "payment_code":
          return (
            dirMul *
            compareStr(a.payment_code ?? "", b.payment_code ?? "")
          );
        case "paid":
          if (a.paid === b.paid) return 0;
          return dirMul * (a.paid ? 1 : -1);
        case "game": {
          const la = gameSortLabel(gameById[a.game_id]);
          const lb = gameSortLabel(gameById[b.game_id]);
          const g = compareStr(la, lb);
          if (g !== 0) return dirMul * g;
          return dirMul * compareStr(a.name, b.name);
        }
        case "created_at":
        default: {
          const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
          const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
          if (ta !== tb) return dirMul * (ta < tb ? -1 : 1);
          return compareStr(a.name, b.name);
        }
      }
    };

    list.sort(cmp);
    return list;
  }, [filtered, sortKey, sortDir, groupBy, groupKeyFn, groupLabel, gameById]);

  const totalRows = sorted.length;
  const effectivePageSize =
    pageSize >= PAGE_SIZE_ALL ? Math.max(totalRows, 1) : pageSize;
  const pageCount = Math.max(1, Math.ceil(totalRows / effectivePageSize) || 1);
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * effectivePageSize;
  const pageRows = useMemo(
    () => sorted.slice(start, start + effectivePageSize),
    [sorted, start, effectivePageSize]
  );

  const visibleMobileExpanded = useMemo(() => {
    const allowed = new Set(pageRows.map((s) => s.id));
    return new Set([...mobileExpanded].filter((id) => allowed.has(id)));
  }, [mobileExpanded, pageRows]);

  const colCount =
    colMode === "essential" ? 6 : 11;

  const tableBodyRows = useMemo(() => {
    if (pageRows.length === 0) return null;
    let prevGroup = "__init__";
    const out: ReactNode[] = [];
    for (const s of pageRows) {
      const gk = groupKeyFn(s);
      const showHeader = groupBy !== "none" && gk !== prevGroup;
      if (groupBy !== "none") prevGroup = gk;
      const game = gameById[s.game_id];
      const court = game ? formatGameCourtLine(game.court) : null;
      if (showHeader) {
        out.push(
          <TableRow
            key={`h-${gk}-${safePage}-${s.id}`}
            className="bg-muted/40 hover:bg-muted/40"
          >
            <TableCell
              colSpan={colCount}
              className="py-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase"
            >
              {groupLabel(gk)}
            </TableCell>
          </TableRow>
        );
      }
      out.push(
        <TableRow key={s.id}>
          <TableCell className="max-w-[180px]">
            {game ? (
              <>
                <span className="font-medium">{game.location}</span>
                <span className="block text-xs text-muted-foreground">
                  {game.date}
                  {court ? <> · {court}</> : null}
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">→</span>
            )}
          </TableCell>
          <TableCell>{s.name}</TableCell>
          <TableCell className="max-w-[200px] truncate">{s.email}</TableCell>
          {colMode === "all" ? (
            <>
              <TableCell className="max-w-[120px] truncate text-sm">
                {s.phone ?? "→"}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {headsForSignup(s)}
              </TableCell>
              <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                {formatShortDate(s.created_at)}
              </TableCell>
              <TableCell>
                {s.waiver_accepted ? (
                  <Badge variant="outline" className="font-normal">
                    Yes
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="font-normal">
                    →
                  </Badge>
                )}
              </TableCell>
            </>
          ) : null}
          <TableCell className="font-mono text-xs">
            {s.payment_code ?? "→"}
          </TableCell>
          {colMode === "all" ? (
            <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
              {formatShortDate(s.payment_code_expires_at)}
            </TableCell>
          ) : null}
          <TableCell>
            {s.paid ? (
              <Badge variant="default">Paid</Badge>
            ) : (
              <Badge variant="secondary">Unpaid</Badge>
            )}
          </TableCell>
          <TableCell>
            <MarkSignupPaidButton
              signupId={s.id}
              paid={s.paid}
              label={s.paid ? "Unmark" : "Mark paid"}
            />
          </TableCell>
        </TableRow>
      );
    }
    return out;
  }, [
    pageRows,
    groupBy,
    groupKeyFn,
    groupLabel,
    gameById,
    colMode,
    colCount,
    safePage,
  ]);

  const mobileCards = useMemo(() => {
    if (pageRows.length === 0) return null;
    let prevGroup = "__init__";
    const out: ReactNode[] = [];
    for (const s of pageRows) {
      const gk = groupKeyFn(s);
      const showHeader = groupBy !== "none" && gk !== prevGroup;
      if (groupBy !== "none") prevGroup = gk;
      const game = gameById[s.game_id];
      const court = game ? formatGameCourtLine(game.court) : null;
      const gameSummary = game
        ? `${game.location} · ${game.date}${court ? ` · ${court}` : ""}`
        : "Unknown game";
      const open = visibleMobileExpanded.has(s.id);

      if (showHeader) {
        out.push(
          <div
            key={`mh-${gk}-${safePage}-${s.id}`}
            className="border-b border-transparent px-1 pt-3 pb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase first:pt-0"
          >
            {groupLabel(gk)}
          </div>
        );
      }

      out.push(
        <Card
          key={s.id}
          size="sm"
          className="gap-0 rounded-2xl py-0 shadow-none ring-1 ring-foreground/10"
        >
          <CardContent className="space-y-3 px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 flex-1 text-base font-semibold leading-snug">
                {s.name}
              </p>
              <div className="shrink-0 pt-0.5">
                {s.paid ? (
                  <Badge variant="default">Paid</Badge>
                ) : (
                  <Badge variant="secondary">Unpaid</Badge>
                )}
              </div>
            </div>

            <div className="min-w-0 space-y-1 text-sm text-muted-foreground">
              <p className="truncate">{s.email}</p>
              {s.phone ? <p className="truncate">{s.phone}</p> : null}
              <p className="text-xs">{formatShortDate(s.created_at)}</p>
              <p className="line-clamp-2 text-xs">{gameSummary}</p>
              <p className="font-mono text-xs">
                Code: {s.payment_code ?? "→"}
              </p>
            </div>

            <MarkSignupPaidButton
              signupId={s.id}
              paid={s.paid}
              label={s.paid ? "Unmark paid" : "Mark paid"}
            />

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 w-full justify-between gap-2 rounded-2xl px-3"
              aria-expanded={open}
              onClick={() => toggleMobileDetail(s.id)}
            >
              <span>{open ? "Hide details" : "View player details"}</span>
              {open ? (
                <ChevronDown className="size-4 shrink-0 rotate-180 text-muted-foreground transition-transform duration-200" />
              ) : (
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              )}
            </Button>

            {open ? (
              <div className="space-y-3 border-t border-border pt-3">
                <MobileDetailRow label="Email">
                  <a href={`mailto:${encodeURIComponent(s.email)}`} className="text-primary underline-offset-4 hover:underline">
                    {s.email}
                  </a>
                </MobileDetailRow>
                <MobileDetailRow label="Game">{gameSummary}</MobileDetailRow>
                <MobileDetailRow label="Payment code">
                  <span className="font-mono">{s.payment_code ?? "→"}</span>
                </MobileDetailRow>
                {colMode === "all" ? (
                  <>
                    <MobileDetailRow label="Phone">{s.phone ?? "→"}</MobileDetailRow>
                    <MobileDetailRow label="Heads (incl. player)">
                      {headsForSignup(s)}
                    </MobileDetailRow>
                    <MobileDetailRow label="Signed up">
                      {formatShortDate(s.created_at)}
                    </MobileDetailRow>
                    <MobileDetailRow label="Code expires">
                      {formatShortDate(s.payment_code_expires_at)}
                    </MobileDetailRow>
                    <MobileDetailRow label="Waiver">
                      {s.waiver_accepted ? "Accepted" : "→"}
                    </MobileDetailRow>
                  </>
                ) : null}
                {s.friends && s.friends.length > 0 ? (
                  <MobileDetailRow label="Friends">{s.friends.join(", ")}</MobileDetailRow>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>
      );
    }
    return out;
  }, [
    pageRows,
    groupBy,
    groupKeyFn,
    groupLabel,
    gameById,
    colMode,
    safePage,
    visibleMobileExpanded,
    toggleMobileDetail,
  ]);

  const setSortKeyMobile = useCallback((key: SortKey) => {
    setSortKey(key);
    setSortDir(key === "created_at" || key === "paid" ? "desc" : "asc");
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-end lg:gap-4">
        <div className="min-w-0 w-full flex-1 space-y-2 md:min-w-[min(100%,16rem)]">
          <Label htmlFor="signup-search" className="max-md:sr-only">
            Search
          </Label>
          <Input
            id="signup-search"
            placeholder="Search by name, email, phone number…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="hidden flex-wrap gap-4 md:flex">
          <div className="space-y-2">
            <Label>Paid</Label>
            <Select
              value={paidFilter}
              onValueChange={(v) => setPaidFilter(v as PaidFilter)}
            >
              <SelectTrigger size="sm" className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Game</Label>
            <Select value={gameFilter} onValueChange={setGameFilter}>
              <SelectTrigger size="sm" className="w-[min(100vw-2rem,220px)]">
                <SelectValue placeholder="All games" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All games</SelectItem>
                {gameOptions.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.location} · {g.date}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Group by</Label>
            <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
              <SelectTrigger size="sm" className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="game">Game</SelectItem>
                <SelectItem value="paid">Paid status</SelectItem>
                <SelectItem value="day">Signup day</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Columns</Label>
            <Select value={colMode} onValueChange={(v) => setColMode(v as ColMode)}>
              <SelectTrigger size="sm" className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="essential">Essential</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Rows per page</Label>
            <Select
              value={pageSize >= PAGE_SIZE_ALL ? "all" : String(pageSize)}
              onValueChange={(v) =>
                setPageSize(v === "all" ? PAGE_SIZE_ALL : Number(v))
              }
            >
              <SelectTrigger size="sm" className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 w-full justify-center gap-2 rounded-2xl"
              >
                <SlidersHorizontal className="size-4 shrink-0 opacity-70" />
                Filter and sort
              </Button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              showCloseButton={false}
              className={cn(
                "flex h-[min(88dvh,640px)] max-h-[min(88dvh,640px)] flex-col gap-0 overflow-hidden rounded-t-3xl border-x border-t border-border bg-popover p-0 shadow-xl sm:rounded-3xl",
                "bottom-0 left-1/2 w-[min(100%-1.25rem,28rem)] max-w-lg -translate-x-1/2"
              )}
            >
              <div className="mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col">
                <SheetHeader className="sticky top-0 z-20 shrink-0 border-b border-border bg-popover px-6 pt-4 pb-4 text-center relative">
                  <SheetClose asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="absolute top-3 right-3 rounded-full bg-secondary"
                      aria-label="Close"
                    >
                      <X className="size-4" />
                    </Button>
                  </SheetClose>
                  <SheetTitle className="pr-10 text-balance">Options</SheetTitle>
                  <SheetDescription className="text-balance">
                    Choose what and how many rows to load.
                  </SheetDescription>
                </SheetHeader>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-6 py-4">
                  <div className="mx-auto flex w-full max-w-sm flex-col gap-4">
                <div className="space-y-2">
                  <Label htmlFor="m-paid" className="block text-center">
                    Payment
                  </Label>
                  <Select
                    value={paidFilter}
                    onValueChange={(v) => setPaidFilter(v as PaidFilter)}
                  >
                    <SelectTrigger id="m-paid" size="sm" className="w-full min-w-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="m-game" className="block text-center">
                    Run / game
                  </Label>
                  <Select value={gameFilter} onValueChange={setGameFilter}>
                    <SelectTrigger id="m-game" size="sm" className="w-full min-w-0">
                      <SelectValue placeholder="All games" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All games</SelectItem>
                      {gameOptions.map((g) => (
                        <SelectItem key={g.id} value={g.id}>
                          {g.location} · {g.date}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="m-group" className="block text-center">
                    Group by
                  </Label>
                  <Select
                    value={groupBy}
                    onValueChange={(v) => setGroupBy(v as GroupBy)}
                  >
                    <SelectTrigger id="m-group" size="sm" className="w-full min-w-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="game">Game</SelectItem>
                      <SelectItem value="paid">Paid status</SelectItem>
                      <SelectItem value="day">Signup day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="m-sort" className="block text-center">
                    Sort by
                  </Label>
                  <Select value={sortKey} onValueChange={(v) => setSortKeyMobile(v as SortKey)}>
                    <SelectTrigger id="m-sort" size="sm" className="w-full min-w-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created_at">Signed up</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="payment_code">Payment code</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="game">Game</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="m-order" className="block text-center">
                    Order
                  </Label>
                  <Select
                    value={sortDir}
                    onValueChange={(v) => setSortDir(v as SortDir)}
                  >
                    <SelectTrigger id="m-order" size="sm" className="w-full min-w-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Descending</SelectItem>
                      <SelectItem value="asc">Ascending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="m-cols" className="block text-center">
                    Columns (desktop)
                  </Label>
                  <Select value={colMode} onValueChange={(v) => setColMode(v as ColMode)}>
                    <SelectTrigger id="m-cols" size="sm" className="w-full min-w-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="essential">Essential</SelectItem>
                      <SelectItem value="all">All columns</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="m-rows" className="block text-center">
                    Rows per page
                  </Label>
                  <Select
                    value={pageSize >= PAGE_SIZE_ALL ? "all" : String(pageSize)}
                    onValueChange={(v) =>
                      setPageSize(v === "all" ? PAGE_SIZE_ALL : Number(v))
                    }
                  >
                    <SelectTrigger id="m-rows" size="sm" className="w-full min-w-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZES.map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n}
                        </SelectItem>
                      ))}
                      <SelectItem value="all">All (no paging)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                  </div>
                </div>
                <SheetFooter className="sticky bottom-0 z-20 mt-0 flex shrink-0 flex-col items-center gap-2 border-t border-border bg-popover/95 px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm supports-backdrop-filter:bg-popover/90">
                  <SheetClose asChild>
                    <Button
                      type="button"
                      className="mx-auto w-full max-w-xs rounded-2xl"
                    >
                      Done
                    </Button>
                  </SheetClose>
                </SheetFooter>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <Card size="sm" className="border-dashed py-3 shadow-none">
        <CardContent className="flex flex-col gap-1 px-3 py-0 text-xs text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-1 sm:text-sm">
          <span>
            Showing{" "}
            <span className="font-medium text-foreground">
              {totalRows === 0 ? 0 : start + 1}–{Math.min(start + pageRows.length, totalRows)}
            </span>{" "}
            of <span className="font-medium text-foreground">{totalRows}</span>
          </span>
          <span>
            Page{" "}
            <span className="font-medium text-foreground">{safePage}</span> /{" "}
            <span className="font-medium text-foreground">{pageCount}</span>
          </span>
        </CardContent>
      </Card>

      {pageRows.length === 0 ? (
        <Card className="rounded-2xl border-dashed py-8 shadow-none">
          <CardContent className="px-4 py-0 text-center text-sm text-muted-foreground">
            No signups match the current filters.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="hidden gap-0 overflow-hidden rounded-2xl p-0 md:block">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortHead k="game" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort}>Game</SortHead>
                    <SortHead k="name" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort}>Name</SortHead>
                    <SortHead k="email" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort}>Email</SortHead>
                    {colMode === "all" ? (
                      <>
                        <TableHead>Phone</TableHead>
                        <TableHead className="text-right">Heads</TableHead>
                        <SortHead k="created_at" className="whitespace-nowrap" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort}>
                          Signed up
                        </SortHead>
                        <TableHead>Waiver</TableHead>
                      </>
                    ) : null}
                    <SortHead k="payment_code" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort}>Code</SortHead>
                    {colMode === "all" ? (
                      <TableHead className="whitespace-nowrap">Code expires</TableHead>
                    ) : null}
                    <SortHead k="paid" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort}>Paid</SortHead>
                    <TableHead className="w-[120px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>{tableBodyRows}</TableBody>
              </Table>
            </div>
          </Card>

          <div className="flex flex-col gap-3 md:hidden">{mobileCards}</div>
        </>
      )}

      {totalRows > 0 && pageSize < PAGE_SIZE_ALL ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={safePage >= pageCount}
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}
