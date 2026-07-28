export type StandingRow = {
  teamId: string;
  teamName: string;
  played: number;
  matchWins: number;
  matchLosses: number;
  gameWins: number;
  gameLosses: number;
  gameDiff: number;
  winRate: number;
};

export type TeamStandingInput = {
  id?: string;
  name?: string;
};

export type MatchStandingInput = {
  teamA?: string;
  teamB?: string;
  team_a?: string;
  team_b?: string;
  winner?: string;
  scoreA?: number;
  scoreB?: number;
  score_a?: number;
  score_b?: number;
  status?: string;
  expand?: {
    teamA?: { name?: string };
    teamB?: { name?: string };
    team_a?: { name?: string };
    team_b?: { name?: string };
  };
};

function matchTeamA(m: MatchStandingInput): string | undefined {
  return m.teamA ?? m.team_a;
}

function matchTeamB(m: MatchStandingInput): string | undefined {
  return m.teamB ?? m.team_b;
}

function matchScoreA(m: MatchStandingInput): number {
  return Math.max(0, m.scoreA ?? m.score_a ?? 0);
}

function matchScoreB(m: MatchStandingInput): number {
  return Math.max(0, m.scoreB ?? m.score_b ?? 0);
}

function teamNameFromExpand(
  m: MatchStandingInput,
  side: "A" | "B",
): string | undefined {
  const expand = m.expand;
  if (!expand) return undefined;
  if (side === "A") return expand.teamA?.name ?? expand.team_a?.name;
  return expand.teamB?.name ?? expand.team_b?.name;
}

export function computeTeamStandings(input: {
  teams: TeamStandingInput[];
  matches: MatchStandingInput[];
}): StandingRow[] {
  const map = new Map<string, StandingRow>();

  for (const t of input.teams) {
    const teamId = t.id?.trim();
    if (!teamId) continue;
    map.set(teamId, {
      teamId,
      teamName: t.name?.trim() || teamId,
      played: 0,
      matchWins: 0,
      matchLosses: 0,
      gameWins: 0,
      gameLosses: 0,
      gameDiff: 0,
      winRate: 0,
    });
  }

  const ensureTeam = (teamId: string, fallback?: string) => {
    const existing = map.get(teamId);
    if (existing) return existing;
    const created: StandingRow = {
      teamId,
      teamName: fallback?.trim() || teamId,
      played: 0,
      matchWins: 0,
      matchLosses: 0,
      gameWins: 0,
      gameLosses: 0,
      gameDiff: 0,
      winRate: 0,
    };
    map.set(teamId, created);
    return created;
  };

  for (const m of input.matches) {
    const teamA = matchTeamA(m)?.trim();
    const teamB = matchTeamB(m)?.trim();
    if (!teamA || !teamB) continue;

    const hasResultData =
      m.status === "completed" ||
      m.status === "walkover" ||
      Boolean(m.winner);
    if (!hasResultData) continue;

    const a = ensureTeam(teamA, teamNameFromExpand(m, "A"));
    const b = ensureTeam(teamB, teamNameFromExpand(m, "B"));
    const scoreA = matchScoreA(m);
    const scoreB = matchScoreB(m);

    a.played += 1;
    b.played += 1;
    a.gameWins += scoreA;
    a.gameLosses += scoreB;
    b.gameWins += scoreB;
    b.gameLosses += scoreA;

    if (m.winner === teamA) {
      a.matchWins += 1;
      b.matchLosses += 1;
    } else if (m.winner === teamB) {
      b.matchWins += 1;
      a.matchLosses += 1;
    }
  }

  const rows = [...map.values()].map((row) => {
    const gameDiff = row.gameWins - row.gameLosses;
    const winRate = row.played > 0 ? (row.matchWins / row.played) * 100 : 0;
    return { ...row, gameDiff, winRate };
  });

  rows.sort((a, b) => {
    if (b.matchWins !== a.matchWins) return b.matchWins - a.matchWins;
    if (b.gameDiff !== a.gameDiff) return b.gameDiff - a.gameDiff;
    if (b.gameWins !== a.gameWins) return b.gameWins - a.gameWins;
    return a.teamName.localeCompare(b.teamName);
  });

  return rows;
}

export function hasRankedStandings(rows: StandingRow[]): boolean {
  return rows.some((row) => row.played > 0);
}
