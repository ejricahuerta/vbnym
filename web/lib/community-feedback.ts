/** Shared with client UI and server action — do not put `"use server"` in this file. */

export const COMMUNITY_CATEGORIES = [
  { value: "bug", label: "Report a bug" },
  { value: "feature", label: "Feature request" },
  { value: "sponsor", label: "Sponsor the community" },
  { value: "host_game", label: "Host a game" },
  { value: "ads", label: "Advertising & partnerships" },
] as const;

export type CommunityCategory = (typeof COMMUNITY_CATEGORIES)[number]["value"];

export type CommunityFeedbackResult = {
  ok: boolean;
  error?: string;
};

export const COMMUNITY_CATEGORY_VALUES = new Set<string>(
  COMMUNITY_CATEGORIES.map((c) => c.value)
);
