export type ApprovedHostRow = {
  email: string;
  created_at: string;
};

export type HostAccessRequestRow = {
  id: string;
  email: string;
  name: string;
  message: string | null;
  status: string;
  created_at: string;
};
