import { tournamentAgeGroupFromBirthdate } from "@/lib/legacy/age";

export type AutoMatchBracket = "under18" | "18+";

export type AutoMatchTeam = {
  id: string;
  name: string;
};

export type AutoMatchPreviewRow = {
  teamA: AutoMatchTeam;
  teamB: AutoMatchTeam;
  round: string;
  order: number;
  bestOf: number;
};

export type AutoMatchPreview = {
  rows: AutoMatchPreviewRow[];
  leftOut: AutoMatchTeam | null;
};

export type AutoMatchCreateRow = {
  teamA: string;
  teamB: string;
  round: string;
  order: number;
  bestOf: number;
  status: "scheduled";
  matchLabel: string;
};

export function shuffledCopy<T>(list: T[]): T[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Team age bracket by strict majority of total members (unknown birthdates count
 * toward total, so ties / mixed / unknown-heavy teams map to null).
 */
export function buildTeamMajorityBracketMap(
  teams: AutoMatchTeam[],
  participants: { team?: string; birthdate?: string }[],
): Map<string, AutoMatchBracket | null> {
  const membersByTeam = new Map<
    string,
    { under18: number; adults: number; total: number }
  >();

  for (const p of participants) {
    const teamId = p.team?.trim();
    if (!teamId) continue;
    const current = membersByTeam.get(teamId) ?? {
      under18: 0,
      adults: 0,
      total: 0,
    };
    current.total += 1;
    const ageGroup = tournamentAgeGroupFromBirthdate(p.birthdate);
    if (ageGroup === "under18") current.under18 += 1;
    else if (ageGroup === "18+") current.adults += 1;
    membersByTeam.set(teamId, current);
  }

  const map = new Map<string, AutoMatchBracket | null>();
  for (const team of teams) {
    const counts = membersByTeam.get(team.id);
    if (!counts || counts.total < 1) {
      map.set(team.id, null);
      continue;
    }
    if (counts.under18 > counts.total / 2) {
      map.set(team.id, "under18");
      continue;
    }
    if (counts.adults > counts.total / 2) {
      map.set(team.id, "18+");
      continue;
    }
    map.set(team.id, null);
  }
  return map;
}

export function filterTeamsByAgeBracket(
  teams: AutoMatchTeam[],
  majorityByTeam: Map<string, AutoMatchBracket | null>,
  bracket: AutoMatchBracket,
): AutoMatchTeam[] {
  return teams.filter((team) => majorityByTeam.get(team.id) === bracket);
}

/** Round-1 random pairing within an age bracket. Odd team out is left unpaired. */
export function buildAutoMatchPreview(args: {
  teams: AutoMatchTeam[];
  majorityByTeam: Map<string, AutoMatchBracket | null>;
  bracket: AutoMatchBracket;
  highestOrder: number;
  defaultBestOf?: number;
  defaultRound?: string;
}): AutoMatchPreview | null {
  const bracketTeams = filterTeamsByAgeBracket(
    args.teams,
    args.majorityByTeam,
    args.bracket,
  );
  if (bracketTeams.length < 2) return null;

  const shuffledTeams = shuffledCopy(bracketTeams);
  const pairCount = Math.floor(shuffledTeams.length / 2);
  if (pairCount < 1) return null;

  const bestOf = Math.max(1, args.defaultBestOf ?? 3);
  const round = args.defaultRound?.trim() || "Round 1";
  const rows = Array.from({ length: pairCount }, (_, index) => ({
    teamA: shuffledTeams[index * 2],
    teamB: shuffledTeams[index * 2 + 1],
    round,
    order: args.highestOrder + index + 1,
    bestOf,
  }));

  return {
    rows,
    leftOut:
      shuffledTeams.length % 2 === 1
        ? shuffledTeams[shuffledTeams.length - 1]
        : null,
  };
}

export function autoMatchCreatePayload(
  preview: AutoMatchPreview,
): AutoMatchCreateRow[] {
  return preview.rows.map((row, index) => ({
    teamA: row.teamA.id,
    teamB: row.teamB.id,
    round: row.round.trim() || "Round 1",
    order: Number.isFinite(row.order) ? row.order : index + 1,
    bestOf: Math.max(1, Number.isFinite(row.bestOf) ? row.bestOf : 3),
    status: "scheduled" as const,
    matchLabel: `${row.teamA.name || row.teamA.id} vs ${row.teamB.name || row.teamB.id}`,
  }));
}
