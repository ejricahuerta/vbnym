import { DEFAULT_ORGANIZATION_NAME } from "@/lib/organization-default";
import type { GameRow } from "@/types/domain";

function firstOrgName(raw: GameRow["organizations"]): string | undefined {
  if (raw == null) return undefined;
  const row = Array.isArray(raw) ? raw[0] : raw;
  return row?.name?.trim();
}

export function gameOrganizationDisplayName(game: Pick<GameRow, "organizations">): string {
  const n = firstOrgName(game.organizations);
  return n && n.length > 0 ? n : DEFAULT_ORGANIZATION_NAME;
}
