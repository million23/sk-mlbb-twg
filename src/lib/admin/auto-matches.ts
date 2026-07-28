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

/** Round-1 random pairing. Odd team out is left unpaired. */
export function buildAutoMatchPreview(args: {
  teams: AutoMatchTeam[];
  highestOrder: number;
  defaultBestOf?: number;
  defaultRound?: string;
}): AutoMatchPreview | null {
  if (args.teams.length < 2) return null;

  const shuffledTeams = shuffledCopy(args.teams);
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
