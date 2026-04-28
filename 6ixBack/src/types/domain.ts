export type GameKind = "dropin" | "league" | "tournament";

export type GameRow = {
  id: string;
  kind: GameKind;
  title: string;
  venue_name: string;
  venue_area: string | null;
  starts_at: string;
  duration_minutes: number;
  skill_level: string;
  capacity: number;
  signed_count: number;
  waitlist_count: number;
  price_cents: number;
  host_name: string;
  host_email: string;
  owner_email: string;
  notes: string | null;
  status: "draft" | "live" | "cancelled";
  created_at: string;
};

export type SignupPaymentStatus = "paid" | "sent" | "owes";

export type SignupRow = {
  id: string;
  game_id: string;
  player_name: string;
  player_email: string;
  payment_code: string;
  payment_status: SignupPaymentStatus;
  status: "active" | "waitlist" | "cancelled";
  created_at: string;
};
