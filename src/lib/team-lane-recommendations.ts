import { LANE_ROLE_LABELS } from "@/lib/lane-role-icons";
import { PlayerRole } from "@/types/pocketbase-types";
import type { Collections } from "@/types/pocketbase-types";

/** Main roster size: one player per lane (MLBB). */
export const TEAM_MAIN_LANE_SLOTS = 5;

const ALL_LANES_ORDERED: PlayerRole[] = [
  PlayerRole.Mid,
  PlayerRole.Gold,
  PlayerRole.Exp,
  PlayerRole.Support,
  PlayerRole.Jungle,
];

const LANE_SET = new Set<PlayerRole>(ALL_LANES_ORDERED);

type Participant = Collections["participants"] & { id: string };
type Team = Collections["teams"] & { id: string };

export type TeamLaneSuggestion = {
  suggestedTeamId: string;
  suggestedTeamName: string;
  suggestionPriority: string;
  /** Internal ranking; higher is a better fit. */
  sortScore: number;
};

function coerceLane(value: unknown): PlayerRole | null {
  if (typeof value !== "string") return null;
  const k = value.trim().toLowerCase();
  if (LANE_SET.has(k as PlayerRole)) return k as PlayerRole;
  return null;
}

/**
 * Same lane keys the UI uses, but tolerant of PocketBase JSON strings, casing,
 * and occasional non-string array entries.
 */
export function parsePreferredRoles(raw: unknown): PlayerRole[] {
  let items: unknown[] = [];

  if (typeof raw === "string") {
    const t = raw.trim();
    if (!t) return [];
    if (t.startsWith("[") || t.startsWith("{")) {
      try {
        const parsed = JSON.parse(t) as unknown;
        items = Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    } else {
      const one = coerceLane(t);
      return one ? [one] : [];
    }
  } else if (Array.isArray(raw)) {
    items = raw;
  } else {
    return [];
  }

  const out: PlayerRole[] = [];
  for (const r of items) {
    const lane = coerceLane(r);
    if (lane) out.push(lane);
  }
  return out;
}

/**
 * Maximum bipartite matching: each member maps to at most one lane from their
 * preferences, each lane to at most one member.
 * Returns lane → member index in `memberPrefs`.
 */
function computeMaxLaneMatching(
  memberPrefs: PlayerRole[][],
): Map<PlayerRole, number> {
  const n = memberPrefs.length;
  const laneOwner = new Map<PlayerRole, number>();

  function augment(memberIdx: number, seen: Set<PlayerRole>): boolean {
    for (const lane of memberPrefs[memberIdx]) {
      if (!LANE_SET.has(lane)) continue;
      if (seen.has(lane)) continue;
      seen.add(lane);
      const owner = laneOwner.get(lane);
      if (owner === undefined || augment(owner, seen)) {
        laneOwner.set(lane, memberIdx);
        return true;
      }
    }
    return false;
  }

  for (let u = 0; u < n; u++) {
    if (memberPrefs[u].length === 0) continue;
    augment(u, new Set());
  }

  return laneOwner;
}

function maxAssignedLanes(memberPrefs: PlayerRole[][]): Set<PlayerRole> {
  return new Set(computeMaxLaneMatching(memberPrefs).keys());
}

function shuffleInPlace<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = arr[i];
    arr[i] = arr[j]!;
    arr[j] = t!;
  }
}

export type LaneRosterPickCandidate = {
  id: string;
  preferredRoles?: unknown;
};

export type PickUnassignedForFiveLanesOptions = {
  /**
   * Randomize member processing order before matching. When several valid
   * five-player rosters exist, each call can return a different one; if only
   * one maximum matching exists, the result may still repeat.
   */
  shuffleMemberOrder?: boolean;
};

/**
 * Picks up to five unassigned candidates whose preferences allow covering all
 * five MLBB lanes (one distinct player per lane). Returns their ids, or null
 * if no such set exists under maximum bipartite matching.
 */
export function pickUnassignedIdsForFiveLanes(
  candidates: LaneRosterPickCandidate[],
  options?: PickUnassignedForFiveLanesOptions,
): string[] | null {
  const withPrefsBase = candidates
    .map((p) => ({
      id: p.id,
      prefs: parsePreferredRoles(p.preferredRoles),
    }))
    .filter((p) => p.prefs.length > 0);

  if (withPrefsBase.length < TEAM_MAIN_LANE_SLOTS) return null;

  const withPrefs = options?.shuffleMemberOrder
    ? (() => {
        const copy = [...withPrefsBase];
        shuffleInPlace(copy);
        return copy;
      })()
    : withPrefsBase;

  const prefsMatrix = withPrefs.map((p) => p.prefs);
  const laneToMember = computeMaxLaneMatching(prefsMatrix);
  if (laneToMember.size < TEAM_MAIN_LANE_SLOTS) return null;

  const used = new Set<number>();
  for (const idx of laneToMember.values()) {
    used.add(idx);
  }
  if (used.size !== TEAM_MAIN_LANE_SLOTS) return null;

  const ids = [...laneToMember.values()].map((idx) => withPrefs[idx].id);
  return [...new Set(ids)];
}

function missingLaneSet(covered: Set<PlayerRole>): Set<PlayerRole> {
  const missing = new Set<PlayerRole>();
  for (const l of ALL_LANES_ORDERED) {
    if (!covered.has(l)) missing.add(l);
  }
  return missing;
}

function firstPreferredGap(
  prefs: PlayerRole[],
  missing: Set<PlayerRole>,
): { lane: PlayerRole; prefIndex: number } | null {
  for (let i = 0; i < prefs.length; i++) {
    const lane = prefs[i];
    if (missing.has(lane)) return { lane, prefIndex: i };
  }
  return null;
}

function teamDisplayName(team: Team): string {
  const n = (team.name ?? "").trim();
  return n || "Unnamed team";
}

/**
 * For each participant without a team, suggests teams that still need at least
 * one of the five lanes and where the participant's preferred lanes include a
 * currently unfilled lane (under an optimal lane assignment for current members).
 */
export function buildTeamLaneSuggestionsByParticipant(
  participants: Participant[],
  teams: Team[] | undefined,
): Map<string, TeamLaneSuggestion[]> {
  const result = new Map<string, TeamLaneSuggestion[]>();
  if (!teams?.length) return result;

  const membersByTeam = new Map<string, Participant[]>();
  for (const t of teams) {
    membersByTeam.set(t.id, []);
  }
  for (const p of participants) {
    const tid = p.team;
    if (typeof tid === "string" && tid) {
      const list = membersByTeam.get(tid);
      if (list) list.push(p);
    }
  }

  const unassigned = participants.filter((p) => !p.team || p.team === "");

  for (const p of unassigned) {
    const prefs = parsePreferredRoles(p.preferredRoles);
    if (prefs.length === 0) continue;

    const suggestions: TeamLaneSuggestion[] = [];

    for (const team of teams) {
      if (team.archived === true) continue;
      if (team.status === "inactive") continue;

      const members = membersByTeam.get(team.id) ?? [];
      if (members.length >= TEAM_MAIN_LANE_SLOTS) continue;

      const memberPrefs = members.map((m) =>
        parsePreferredRoles(m.preferredRoles),
      );
      const coveredNow = maxAssignedLanes(memberPrefs);
      const missing = missingLaneSet(coveredNow);

      const gap = firstPreferredGap(prefs, missing);
      if (gap) {
        const coveredAfter = maxAssignedLanes([...memberPrefs, prefs]);

        const label = LANE_ROLE_LABELS[gap.lane];
        const suggestionPriority =
          gap.prefIndex === 0
            ? `Fills ${label} (top pick)`
            : gap.prefIndex === 1
              ? `Fills ${label} (2nd pick)`
              : gap.prefIndex === 2
                ? `Fills ${label} (3rd pick)`
                : `Fills ${label}`;

        const prefWeight = (3 - Math.min(gap.prefIndex, 2)) * 120;
        const completionBonus = coveredAfter.size * 35;
        const rosterUrgency = (TEAM_MAIN_LANE_SLOTS - members.length) * 15;
        const sortScore = prefWeight + completionBonus + rosterUrgency;

        suggestions.push({
          suggestedTeamId: team.id,
          suggestedTeamName: teamDisplayName(team),
          suggestionPriority,
          sortScore,
        });
      }
    }

    if (suggestions.length === 0) {
      for (const team of teams) {
        if (team.archived === true) continue;
        if (team.status === "inactive") continue;

        const members = membersByTeam.get(team.id) ?? [];
        if (members.length >= TEAM_MAIN_LANE_SLOTS) continue;
        const slotsOpen = TEAM_MAIN_LANE_SLOTS - members.length;
        suggestions.push({
          suggestedTeamId: team.id,
          suggestedTeamName: teamDisplayName(team),
          suggestionPriority:
            slotsOpen > 1
              ? `Open roster (${slotsOpen} slots) — lanes overlap or flex`
              : `Open roster (1 slot) — lanes overlap or flex`,
          sortScore: 70 + slotsOpen * 12,
        });
      }
    }

    suggestions.sort((a, b) => b.sortScore - a.sortScore);
    const capped = suggestions.slice(0, 12);
    if (capped.length > 0) result.set(p.id, capped);
  }

  return result;
}
