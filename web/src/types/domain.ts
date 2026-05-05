export type GameKind = "dropin" | "league" | "tournament";

export type OrganizationRow = {
  id: string;
  name: string;
  created_at: string;
};

/** Nested shape from Supabase when selecting `organizations ( name )` on games/signups. */
export type OrganizationNameRef = {
  name: string;
};

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
  /** E.164 digits only (no +), for wa.me; null if unset. */
  host_whatsapp_e164: string | null;
  owner_email: string;
  organization_id: string;
  /** Supabase FK embed is usually an object; some clients surface a one-element array. */
  organizations: OrganizationNameRef | OrganizationNameRef[] | null;
  notes: string | null;
  status: "draft" | "live" | "cancelled";
  created_at: string;
};

export type SignupPaymentStatus = "paid" | "pending" | "refund" | "canceled";

export type SignupRow = {
  id: string;
  game_id: string;
  signup_group_id: string;
  player_name: string;
  player_email: string;
  added_by_name: string;
  added_by_email: string;
  refund_owner_name: string;
  refund_owner_email: string;
  is_primary_signup: boolean;
  payment_code: string;
  payment_status: SignupPaymentStatus;
  organization_id: string;
  organizations: OrganizationNameRef | OrganizationNameRef[] | null;
  status: "active" | "waitlist" | "removed" | "deleted";
  created_at: string;
};
