import { pickUnassignedIdsForFiveLanes } from "@/lib/legacy/team-lane-recommendations";

export type OpenMatchingCandidate = {
  id?: string;
  team_intent?: string | null;
  registration_status?: string | null;
  team?: string | null;
  status?: string | null;
  preferred_roles?: unknown;
  preferred_lane?: unknown;
};

export type PlannedOpenTeam = {
  name: string;
  memberIds: string[];
  captainId: string;
};

export type AutoOpenTeamsPlan = {
  teams: PlannedOpenTeam[];
  leftoverIds: string[];
};

function preferredRolesForPick(p: OpenMatchingCandidate): unknown {
  if (Array.isArray(p.preferred_roles) && p.preferred_roles.length > 0) {
    return p.preferred_roles;
  }
  if (Array.isArray(p.preferred_lane) && p.preferred_lane.length > 0) {
    return p.preferred_lane;
  }
  if (p.preferred_lane && typeof p.preferred_lane === "string") return [p.preferred_lane];
  return p.preferred_roles;
}

/** Approved open-matching players with no team assignment. */
export function openMatchingPool<T extends OpenMatchingCandidate>(
  participants: T[],
): Array<T & { id: string }> {
  return participants.filter(
    (p): p is T & { id: string } =>
      Boolean(p.id) &&
      p.team_intent === "open_matching" &&
      p.registration_status === "approved" &&
      (!p.team || p.team === "") &&
      p.status !== "inactive",
  );
}

function nameKey(raw: string): string {
  return raw.trim().toLowerCase();
}

/** Next unused "Open Match N" label. */
export function nextOpenMatchName(
  used: Set<string>,
  startAt = 1,
): { name: string; nextIndex: number } {
  let n = startAt;
  while (used.has(nameKey(`Open Match ${n}`))) n += 1;
  const name = `Open Match ${n}`;
  used.add(nameKey(name));
  return { name, nextIndex: n + 1 };
}

export type PlanAutoOpenTeamsOptions = {
  existingTeamNames?: string[];
  /** When true (default), reshuffle candidates each pack pass. */
  shuffle?: boolean;
};

/**
 * Pack open-matching pool into lane-balanced squads of 5.
 * Leftovers (too few or no full lane cover) stay for manual Quick team.
 */
export function planAutoOpenTeams(
  pool: OpenMatchingCandidate[],
  options?: PlanAutoOpenTeamsOptions,
): AutoOpenTeamsPlan {
  const shuffle = options?.shuffle !== false;
  const usedNames = new Set(
    (options?.existingTeamNames ?? []).map((n) => nameKey(n)),
  );
  let nameIndex = 1;

  const remaining = new Map<string, OpenMatchingCandidate>();
  for (const p of pool) {
    const id = p.id?.trim();
    if (!id) continue;
    remaining.set(id, p);
  }

  const teams: PlannedOpenTeam[] = [];

  while (remaining.size >= 5) {
    const candidates = [...remaining.entries()].map(([id, p]) => ({
      id,
      preferredRoles: preferredRolesForPick(p),
    }));
    const ids = pickUnassignedIdsForFiveLanes(candidates, {
      shuffleMemberOrder: shuffle,
    });
    if (!ids?.length) break;

    for (const id of ids) remaining.delete(id);

    const captainId = ids[0];
    if (!captainId) break;

    const { name, nextIndex } = nextOpenMatchName(usedNames, nameIndex);
    nameIndex = nextIndex;
    teams.push({
      name,
      memberIds: ids,
      captainId,
    });
  }

  return {
    teams,
    leftoverIds: [...remaining.keys()],
  };
}
