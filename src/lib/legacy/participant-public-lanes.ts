import { parsePreferredRoles } from "@/lib/legacy/team-lane-recommendations";
import type { PlayerRole } from "@/types/__pocketbase-types";

/** Lanes for public roster UI. PocketBase uses snake_case; older UI used camelCase. */
export function participantPublicLanes(p: {
  preferred_roles?: unknown;
  preferred_lane?: unknown;
  preferredRoles?: unknown;
}): PlayerRole[] {
  const fromRoles = parsePreferredRoles(p.preferred_roles ?? p.preferredRoles);
  if (fromRoles.length) return fromRoles;
  return parsePreferredRoles(p.preferred_lane);
}
