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
  /** Elimination bracket label, or "Playoffs". */
  bracket?: string;
};

export type AutoMatchPreview = {
  rows: AutoMatchPreviewRow[];
  /** Teams with no opponent this round (odd count inside a bracket). */
  leftOut: AutoMatchTeam[];
};

export type AutoMatchCreateRow = {
  teamA: string;
  teamB: string;
  round: string;
  order: number;
  bestOf: number;
  status: "scheduled";
  matchLabel: string;
  bracket?: string;
};

export type BracketAssignment = {
  label: string;
  teams: AutoMatchTeam[];
};

export type PlayoffAdvancer = {
  team: AutoMatchTeam;
  bracket: string;
};

/** SK elimination default: four brackets of up to 16. */
export const SK_BRACKET_COUNT = 4;
export const SK_TEAMS_PER_BRACKET = 16;

const BRACKET_LABELS = ["Bracket A", "Bracket B", "Bracket C", "Bracket D"];

export function bracketLabelAt(index: number): string {
  return BRACKET_LABELS[index] ?? `Bracket ${index + 1}`;
}

export function shuffledCopy<T>(list: T[]): T[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function assignTeamsToBrackets(
  teams: AutoMatchTeam[],
  bracketCount: number,
):
  | { ok: true; brackets: BracketAssignment[] }
  | { ok: false; error: string } {
  const count = Math.max(1, Math.floor(bracketCount));
  if (teams.length < count) {
    return {
      ok: false,
      error: `Need at least ${count} teams for ${count} brackets (got ${teams.length}).`,
    };
  }
  if (teams.length % count !== 0) {
    return {
      ok: false,
      error: `Need a multiple of ${count} teams to fill ${count} equal brackets (got ${teams.length}).`,
    };
  }

  const shuffled = shuffledCopy(teams);
  const perBracket = shuffled.length / count;
  const brackets: BracketAssignment[] = [];
  for (let i = 0; i < count; i += 1) {
    brackets.push({
      label: bracketLabelAt(i),
      teams: shuffled.slice(i * perBracket, (i + 1) * perBracket),
    });
  }
  return { ok: true, brackets };
}

function pairBracketTeams(
  bracketTeams: AutoMatchTeam[],
  bracket: string,
  round: string,
  bestOf: number,
  startOrder: number,
): { rows: AutoMatchPreviewRow[]; leftOut: AutoMatchTeam | null; nextOrder: number } {
  const shuffled = shuffledCopy(bracketTeams);
  const pairCount = Math.floor(shuffled.length / 2);
  const rows: AutoMatchPreviewRow[] = [];
  for (let i = 0; i < pairCount; i += 1) {
    rows.push({
      teamA: shuffled[i * 2]!,
      teamB: shuffled[i * 2 + 1]!,
      round,
      order: startOrder + i,
      bestOf,
      bracket,
    });
  }
  return {
    rows,
    leftOut:
      shuffled.length % 2 === 1 ? (shuffled[shuffled.length - 1] ?? null) : null,
    nextOrder: startOrder + pairCount,
  };
}

/** Flat Round-1 pairing (single bracket / legacy). Odd team left unpaired. */
export function buildAutoMatchPreview(args: {
  teams: AutoMatchTeam[];
  highestOrder: number;
  defaultBestOf?: number;
  defaultRound?: string;
}): AutoMatchPreview | null {
  if (args.teams.length < 2) return null;

  const bestOf = Math.max(1, args.defaultBestOf ?? 3);
  const round = args.defaultRound?.trim() || "Round 1";
  const { rows, leftOut } = pairBracketTeams(
    args.teams,
    "",
    round,
    bestOf,
    args.highestOrder + 1,
  );
  if (rows.length < 1) return null;

  return {
    rows: rows.map(({ bracket: _b, ...row }) => row),
    leftOut: leftOut ? [leftOut] : [],
  };
}

export function buildBracketAutoMatchPreview(args: {
  teams: AutoMatchTeam[];
  bracketCount?: number;
  highestOrder: number;
  defaultBestOf?: number;
  defaultRound?: string;
}):
  | { ok: true; preview: AutoMatchPreview }
  | { ok: false; error: string } {
  const bracketCount = args.bracketCount ?? SK_BRACKET_COUNT;
  const assigned = assignTeamsToBrackets(args.teams, bracketCount);
  if (!assigned.ok) return assigned;

  const bestOf = Math.max(1, args.defaultBestOf ?? 3);
  const round = args.defaultRound?.trim() || "Round 1";
  const rows: AutoMatchPreviewRow[] = [];
  const leftOut: AutoMatchTeam[] = [];
  let order = args.highestOrder + 1;

  for (const bracket of assigned.brackets) {
    const paired = pairBracketTeams(
      bracket.teams,
      bracket.label,
      round,
      bestOf,
      order,
    );
    rows.push(...paired.rows);
    if (paired.leftOut) leftOut.push(paired.leftOut);
    order = paired.nextOrder;
  }

  if (rows.length < 1) {
    return {
      ok: false,
      error: "Need at least 2 teams in a bracket to generate matches.",
    };
  }

  return { ok: true, preview: { rows, leftOut } };
}

/**
 * Quarterfinal pairing for elimination advancers.
 * Shuffles, then repairs so no match pits two teams from the same bracket.
 */
export function buildPlayoffPreview(args: {
  advancers: PlayoffAdvancer[];
  highestOrder: number;
  defaultBestOf?: number;
  defaultRound?: string;
}):
  | { ok: true; preview: AutoMatchPreview }
  | { ok: false; error: string } {
  if (args.advancers.length < 2) {
    return { ok: false, error: "Need at least 2 playoff advancers." };
  }
  if (args.advancers.length % 2 !== 0) {
    return {
      ok: false,
      error: `Need an even number of playoff advancers (got ${args.advancers.length}).`,
    };
  }

  const bestOf = Math.max(1, args.defaultBestOf ?? 3);
  const round = args.defaultRound?.trim() || "Quarterfinals";
  const paired = pairAvoidingSameBracket(args.advancers);
  if (!paired) {
    return {
      ok: false,
      error:
        "Could not pair playoffs without same-bracket rematches. Check advancer brackets.",
    };
  }

  const rows: AutoMatchPreviewRow[] = paired.map(([a, b], index) => ({
    teamA: a.team,
    teamB: b.team,
    round,
    order: args.highestOrder + index + 1,
    bestOf,
    bracket: "Playoffs",
  }));

  return { ok: true, preview: { rows, leftOut: [] } };
}

function sameBracket(a: PlayoffAdvancer, b: PlayoffAdvancer): boolean {
  return a.bracket.trim() !== "" && a.bracket === b.bracket;
}

/** Try shuffled pairings, then a deterministic cross-bracket fallback. */
function pairAvoidingSameBracket(
  advancers: PlayoffAdvancer[],
): [PlayoffAdvancer, PlayoffAdvancer][] | null {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const shuffled = shuffledCopy(advancers);
    const pairs: [PlayoffAdvancer, PlayoffAdvancer][] = [];
    let ok = true;
    for (let i = 0; i < shuffled.length; i += 2) {
      const a = shuffled[i]!;
      const b = shuffled[i + 1]!;
      if (sameBracket(a, b)) {
        ok = false;
        break;
      }
      pairs.push([a, b]);
    }
    if (ok) return pairs;
  }
  return deterministicCrossBracketPairs(advancers);
}

/**
 * Group by bracket, then zip groups so neighbors are from different brackets.
 * Works for the SK shape (2 advancers × 4 brackets).
 */
function deterministicCrossBracketPairs(
  advancers: PlayoffAdvancer[],
): [PlayoffAdvancer, PlayoffAdvancer][] | null {
  const byBracket = new Map<string, PlayoffAdvancer[]>();
  for (const a of advancers) {
    const key = a.bracket.trim() || "Unknown";
    const list = byBracket.get(key) ?? [];
    list.push(a);
    byBracket.set(key, list);
  }
  const groups = [...byBracket.values()].map((g) => shuffledCopy(g));
  if (groups.length < 2) return null;

  // Flatten in round-robin across groups: g0[0], g1[0], g2[0], … then g0[1]…
  const maxLen = Math.max(...groups.map((g) => g.length));
  const ordered: PlayoffAdvancer[] = [];
  for (let slot = 0; slot < maxLen; slot += 1) {
    for (const group of groups) {
      const item = group[slot];
      if (item) ordered.push(item);
    }
  }

  if (ordered.length !== advancers.length || ordered.length % 2 !== 0) {
    return null;
  }

  const pairs: [PlayoffAdvancer, PlayoffAdvancer][] = [];
  for (let i = 0; i < ordered.length; i += 2) {
    const a = ordered[i]!;
    const b = ordered[i + 1]!;
    if (sameBracket(a, b)) return null;
    pairs.push([a, b]);
  }
  return pairs;
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
    ...(row.bracket?.trim() ? { bracket: row.bracket.trim() } : {}),
  }));
}
