import type { Game, Signup } from "@/types/vbnym";
import { createClient } from "@/lib/supabase/server";
import { venueImageOrPlaceholder } from "@/lib/venue-placeholder-image";

function isActiveSignup(s: Signup): boolean {
  if (s.paid) return true;
  if (!s.payment_code_expires_at) return true;
  const t = new Date(s.payment_code_expires_at).getTime();
  return !Number.isFinite(t) || t > Date.now();
}

const MOCK_GAMES: Game[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    location: "Sunnyside Beach Courts",
    address: "1675 Lake Shore Blvd W, Toronto",
    lat: 43.637,
    lng: -79.45,
    date: "2026-04-19",
    time: "10:00 AM",
    end_time: "12:00",
    cap: 18,
    price: 15,
    etransfer: "volley@nymvb.ca",
    listed: true,
    registration_opens_at: null,
    entry_instructions: "Beach volleyball courts — south end of the park.",
    court: "2",
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    location: "North York Rec Centre",
    address: "5100 Yonge St, North York",
    lat: null,
    lng: null,
    date: "2026-04-21",
    time: "7:00 PM",
    end_time: "22:00",
    cap: 16,
    price: 15,
    etransfer: "volley@nymvb.ca",
    listed: true,
    registration_opens_at: null,
    entry_instructions: null,
    court: null,
  },
];

const MOCK_SIGNUPS: Signup[] = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    game_id: MOCK_GAMES[0].id,
    name: "Alex Chen",
    email: "alex@example.com",
    paid: true,
    friends: [],
    payment_code: "NYM-AAAA-BBBB",
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    game_id: MOCK_GAMES[0].id,
    name: "Jordan Lee",
    email: "jordan@example.com",
    paid: false,
    friends: ["Sam K.", "Riley P."],
    payment_code: "NYM-CCCC-DDDD",
  },
];

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function normalizeGame(row: Game): Game {
  const dateStr =
    typeof row.date === "string" && row.date.length >= 10
      ? row.date.slice(0, 10)
      : row.date;
  return {
    ...row,
    date: dateStr,
    listed: row.listed !== false,
    price: Number(row.price),
    lat: row.lat != null ? Number(row.lat) : null,
    lng: row.lng != null ? Number(row.lng) : null,
    venue_id: row.venue_id ?? null,
    end_time: row.end_time ?? null,
    court: row.court != null && String(row.court).trim() ? String(row.court).trim() : null,
  };
}

export async function getUpcomingGamesWithSignups(): Promise<{
  games: Game[];
  signupsByGameId: Record<string, Signup[]>;
  usingMock: boolean;
  fetchError: string | null;
}> {
  const hasSupabase =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!hasSupabase) {
    const byGame: Record<string, Signup[]> = {};
    for (const s of MOCK_SIGNUPS) {
      byGame[s.game_id] ??= [];
      byGame[s.game_id].push(s);
    }
    const gamesWithPlaceholders = MOCK_GAMES.map((g) => ({
      ...normalizeGame(g),
      venue_image_url: venueImageOrPlaceholder(null, g.venue_id ?? g.id),
    }));
    return {
      games: gamesWithPlaceholders,
      signupsByGameId: byGame,
      usingMock: true,
      fetchError: null,
    };
  }

  try {
    const supabase = await createClient();
    const today = todayIsoDate();
    const { data: games, error: gamesError } = await supabase
      .from("games")
      .select("*")
      .gte("date", today)
      .order("date", { ascending: true });

    if (gamesError) {
      return {
        games: [],
        signupsByGameId: {},
        usingMock: false,
        fetchError: gamesError.message,
      };
    }

    const list = ((games ?? []) as Game[])
      .map(normalizeGame)
      .filter((g) => g.listed !== false);
    if (list.length === 0) {
      return { games: [], signupsByGameId: {}, usingMock: false, fetchError: null };
    }

    const venueIds = [
      ...new Set(
        list
          .map((g) => g.venue_id)
          .filter((id): id is string => Boolean(id && typeof id === "string"))
      ),
    ];
    const imageByVenueId: Record<string, string | null> = {};
    if (venueIds.length > 0) {
      const { data: venueRows } = await supabase
        .from("venues")
        .select("id, image_url")
        .in("id", venueIds);
      for (const row of venueRows ?? []) {
        const v = row as { id: string; image_url: string | null };
        const u = v.image_url != null && String(v.image_url).trim()
          ? String(v.image_url).trim()
          : null;
        imageByVenueId[v.id] = u;
      }
    }

    const listWithVenueImages = list.map((g) => {
      const fromDb = g.venue_id ? imageByVenueId[g.venue_id] ?? null : null;
      return {
        ...g,
        venue_image_url: venueImageOrPlaceholder(fromDb, g.venue_id ?? g.id),
      };
    });

    const ids = listWithVenueImages.map((g) => g.id);
    const { data: signups, error: signupsError } = await supabase
      .from("signups")
      .select("*")
      .in("game_id", ids);

    if (signupsError) {
      return {
        games: listWithVenueImages,
        signupsByGameId: {},
        usingMock: false,
        fetchError: signupsError.message,
      };
    }

    const byGame: Record<string, Signup[]> = {};
    for (const g of listWithVenueImages) byGame[g.id] = [];
    for (const s of (signups ?? []) as Signup[]) {
      if (!isActiveSignup(s)) continue;
      if (!byGame[s.game_id]) byGame[s.game_id] = [];
      byGame[s.game_id].push(s);
    }

    return {
      games: listWithVenueImages,
      signupsByGameId: byGame,
      usingMock: false,
      fetchError: null,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not load games.";
    return {
      games: [],
      signupsByGameId: {},
      usingMock: false,
      fetchError: msg,
    };
  }
}

export async function getGameWithSignups(
  id: string
): Promise<{ game: Game; signups: Signup[] } | null> {
  const hasSupabase =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!hasSupabase) {
    const game = MOCK_GAMES.find((g) => g.id === id);
    if (!game || game.listed === false) return null;
    const signups = MOCK_SIGNUPS.filter((s) => s.game_id === id);
    return { game, signups };
  }

  try {
    const supabase = await createClient();
    const { data: gameRow, error: gameErr } = await supabase
      .from("games")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (gameErr || !gameRow) return null;
    const game = normalizeGame(gameRow as Game);
    if (game.listed === false) return null;

    const { data: signups } = await supabase
      .from("signups")
      .select("*")
      .eq("game_id", id);

    return {
      game,
      signups: ((signups ?? []) as Signup[]).filter(isActiveSignup),
    };
  } catch {
    return null;
  }
}

/** Load a game by id (includes invite-only / unlisted). For admin edit. */
export async function getGameById(id: string): Promise<Game | null> {
  const hasSupabase =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!hasSupabase) {
    const game = MOCK_GAMES.find((g) => g.id === id);
    return game ? normalizeGame(game) : null;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("games")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;
    return normalizeGame(data as Game);
  } catch {
    return null;
  }
}
