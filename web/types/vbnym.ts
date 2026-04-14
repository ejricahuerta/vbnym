export type Venue = {
  id: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  /** Optional photo URL (e.g. from Google Places); used on the public home page. */
  image_url?: string | null;
  /** When true, shown as the hero venue on the home page (at most one). */
  is_featured?: boolean | null;
  created_at?: string;
};

export type Game = {
  id: string;
  /** Optional saved venue used when creating the run; location fields are still stored on the game. */
  venue_id?: string | null;
  location: string;
  /** Optional court number or letter (e.g. 3, A). */
  court?: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  date: string;
  /** Start time (HH:mm from admin, or legacy display string). */
  time: string;
  /** End time for the run window; optional for older rows. */
  end_time?: string | null;
  cap: number;
  price: number;
  etransfer: string;
  created_at?: string;
  /** When false, hide from public list (invite-only). */
  listed?: boolean | null;
  /** When set and in the future, join is disabled until this instant. */
  registration_opens_at?: string | null;
  /** Optional: door, gate, court, parking — shown on the public run page. */
  entry_instructions?: string | null;
  /** Hydrated from linked venue for public listings (not stored on games row). */
  venue_image_url?: string | null;
};

export type Signup = {
  id: string;
  game_id: string;
  name: string;
  email: string;
  paid: boolean;
  friends: string[] | null;
  payment_code: string | null;
  payment_code_expires_at?: string | null;
  payment_verified_at?: string | null;
  payment_email_id?: string | null;
  created_at?: string;
  phone?: string | null;
  waiver_accepted?: boolean | null;
};

export function headsForSignup(s: Pick<Signup, "friends">): number {
  const f = s.friends?.length ?? 0;
  return 1 + f;
}

export function bookedHeadsForGame(signups: Signup[]): number {
  return signups.reduce((sum, s) => sum + headsForSignup(s), 0);
}

export function isGameListed(game: Pick<Game, "listed">): boolean {
  return game.listed !== false;
}
