export type ApprovedHostRow = {
  email: string;
  created_at: string;
};

export type HostAccessRequestContextGame = {
  id: string;
  title: string;
  starts_at: string;
};

export type HostAccessRequestRow = {
  id: string;
  email: string;
  name: string;
  message: string | null;
  status: string;
  created_at: string;
  organization_id: string;
  organizations: { name: string } | { name: string }[] | null;
  context_game_id: string | null;
  context_game: HostAccessRequestContextGame | null;
};
