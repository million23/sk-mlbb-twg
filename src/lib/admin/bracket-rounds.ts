import {
  buildPlayoffPreview,
  shuffledCopy,
  type AutoMatchPreview,
  type AutoMatchTeam,
  type PlayoffAdvancer,
} from "@/lib/admin/auto-matches";

/** Minimal match shape for advance / playoff detection. */
export type BracketMatchInput = {
  bracket?: string;
  round?: string;
  status?: string;
  winner?: string;
  teamA?: string;
  teamB?: string;
  teamAName?: string;
  teamBName?: string;
  winnerName?: string;
  order?: number;
};

const ROUND_PROGRESSION = [
  "Round 1",
  "Round 2",
  "Round 3",
  "Semifinals",
] as const;

function normRound(round: string | undefined): string {
  return (round ?? "").trim();
}

function isPlayoffsRound(round: string): boolean {
  const r = round.toLowerCase();
  return r === "playoffs" || r === "quarterfinals" || r === "grand finals";
}

export function isMatchCompleteForAdvance(m: BracketMatchInput): boolean {
  const status = (m.status ?? "").toLowerCase();
  return (
    (status === "completed" || status === "walkover") &&
    Boolean(m.winner?.trim())
  );
}

export function suggestNextRoundName(sourceRound: string): string {
  const key = normRound(sourceRound).toLowerCase();
  if (key === "round 1" || key === "r1") return "Round 2";
  if (key === "round 2" || key === "r2") return "Semifinals";
  if (key === "round 3" || key === "r3") return "Semifinals";
  if (
    key === "semifinals" ||
    key === "semi-finals" ||
    key === "semi finals" ||
    key === "sf"
  ) {
    return "Playoffs";
  }
  return "Playoffs";
}

function roundRank(round: string): number {
  const exact = ROUND_PROGRESSION.findIndex(
    (r) => r.toLowerCase() === round.toLowerCase(),
  );
  if (exact >= 0) return exact;
  const suggested = suggestNextRoundName(round);
  if (suggested === "Playoffs") return ROUND_PROGRESSION.length;
  return -1;
}

function teamFromWinner(m: BracketMatchInput): AutoMatchTeam | null {
  const id = m.winner?.trim();
  if (!id) return null;
  const name =
    m.winnerName?.trim() ||
    (id === m.teamA ? m.teamAName : undefined)?.trim() ||
    (id === m.teamB ? m.teamBName : undefined)?.trim() ||
    id;
  return { id, name };
}

function matchesInRound(
  matches: BracketMatchInput[],
  round: string,
): BracketMatchInput[] {
  const target = normRound(round).toLowerCase();
  return matches.filter((m) => normRound(m.round).toLowerCase() === target);
}

function eliminationRoundsPresent(matches: BracketMatchInput[]): string[] {
  const seen = new Map<string, string>();
  for (const m of matches) {
    const round = normRound(m.round);
    if (!round || isPlayoffsRound(round)) continue;
    const key = round.toLowerCase();
    if (!seen.has(key)) seen.set(key, round);
  }
  return [...seen.values()].sort((a, b) => {
    const ra = roundRank(a);
    const rb = roundRank(b);
    if (ra !== rb) return ra - rb;
    return a.localeCompare(b);
  });
}

export function findAdvanceSourceRound(
  matches: BracketMatchInput[],
): { ok: true; sourceRound: string } | { ok: false; error: string } {
  const rounds = eliminationRoundsPresent(matches);
  if (rounds.length === 0) {
    return {
      ok: false,
      error: "No elimination matches to advance. Generate Round 1 first.",
    };
  }

  // Walk from earliest: first round whose next step is not already generated.
  for (const sourceRound of rounds) {
    const next = suggestNextRoundName(sourceRound);
    if (next === "Playoffs") {
      const playoffsExist = matches.some((m) =>
        isPlayoffsRound(normRound(m.round)),
      );
      if (playoffsExist) {
        return {
          ok: false,
          error:
            "Elimination is finished and playoff matches already exist.",
        };
      }
      return { ok: true, sourceRound };
    }
    const nextExists = matchesInRound(matches, next).length > 0;
    if (!nextExists) {
      return { ok: true, sourceRound };
    }
  }

  // All mapped next rounds exist — use the latest.
  return { ok: true, sourceRound: rounds[rounds.length - 1]! };
}

function bracketKey(m: BracketMatchInput): string {
  return normRound(m.bracket) || "Bracket";
}

function eliminationMatches(matches: BracketMatchInput[]): BracketMatchInput[] {
  return matches.filter((m) => !isPlayoffsRound(normRound(m.round)));
}

function uniqueBrackets(matches: BracketMatchInput[]): string[] {
  const seen = new Map<string, string>();
  for (const m of matches) {
    const key = bracketKey(m);
    if (!seen.has(key.toLowerCase())) seen.set(key.toLowerCase(), key);
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b));
}

function winnersInRound(roundMatches: BracketMatchInput[]): AutoMatchTeam[] {
  const list: AutoMatchTeam[] = [];
  for (const m of roundMatches) {
    const team = teamFromWinner(m);
    if (!team) continue;
    if (!list.some((t) => t.id === team.id)) list.push(team);
  }
  return list;
}

export type AdvanceRoundResult =
  | {
      ok: true;
      kind: "next_round";
      nextRound: string;
      preview: AutoMatchPreview;
    }
  | {
      ok: true;
      kind: "playoffs_ready";
      advancers: PlayoffAdvancer[];
      preview: AutoMatchPreview;
    }
  | { ok: false; error: string };

export function buildAdvanceRoundPreview(args: {
  matches: BracketMatchInput[];
  /** Ignored for selection. Each bracket uses its own unfinished elimination round. */
  sourceRound?: string;
  highestOrder: number;
  defaultBestOf?: number;
  nextRound?: string;
}): AdvanceRoundResult {
  const elimination = eliminationMatches(args.matches);
  const brackets = uniqueBrackets(elimination);
  if (brackets.length === 0) {
    return {
      ok: false,
      error: "No elimination matches to advance. Generate Round 1 first.",
    };
  }

  const bestOf = Math.max(1, args.defaultBestOf ?? 3);
  const rows: AutoMatchPreview["rows"] = [];
  const leftOut: AutoMatchTeam[] = [];
  const playoffAdvancers: PlayoffAdvancer[] = [];
  const waiting: string[] = [];
  const blocked: string[] = [];
  let order = args.highestOrder + 1;

  for (const bracket of brackets) {
    const bm = elimination.filter((m) => bracketKey(m) === bracket);
    const source = findAdvanceSourceRound(bm);
    if (!source.ok) {
      blocked.push(`${bracket}: ${source.error}`);
      continue;
    }

    const sourceRound = source.sourceRound;
    const roundMatches = matchesInRound(bm, sourceRound);
    const incomplete = roundMatches.filter((m) => !isMatchCompleteForAdvance(m));
    if (incomplete.length > 0) {
      waiting.push(
        `${bracket}: ${incomplete.length} match${incomplete.length === 1 ? "" : "es"} in ${sourceRound} still need a winner.`,
      );
      continue;
    }

    const winners = winnersInRound(roundMatches);
    if (winners.length < 1) {
      waiting.push(`${bracket}: No winners found in ${sourceRound}.`);
      continue;
    }

    const suggestedNext =
      normRound(args.nextRound) || suggestNextRoundName(sourceRound);

    if (winners.length <= 2 || suggestedNext === "Playoffs") {
      if (winners.length > 2) {
        blocked.push(
          `${bracket}: ${sourceRound} still has more than 2 winners — keep advancing inside elimination first.`,
        );
        continue;
      }
      for (const team of winners) {
        playoffAdvancers.push({ team, bracket });
      }
      continue;
    }

    const existingNext = matchesInRound(bm, suggestedNext);
    if (existingNext.length > 0) {
      continue;
    }

    const shuffled = shuffledCopy(winners);
    const pairCount = Math.floor(shuffled.length / 2);
    for (let i = 0; i < pairCount; i += 1) {
      const teamA = shuffled[i * 2]!;
      const teamB = shuffled[i * 2 + 1]!;
      rows.push({
        teamA,
        teamB,
        round: suggestedNext,
        order,
        bestOf,
        bracket,
      });
      order += 1;
    }
    if (shuffled.length % 2 === 1) {
      leftOut.push(shuffled[shuffled.length - 1]!);
    }
  }

  if (rows.length > 0) {
    const rounds = [...new Set(rows.map((r) => r.round))];
    return {
      ok: true,
      kind: "next_round",
      nextRound: rounds.join(" / "),
      preview: { rows, leftOut },
    };
  }

  if (waiting.length === 0 && playoffAdvancers.length >= 2) {
    const existingPlayoffs = args.matches.filter((m) =>
      isPlayoffsRound(normRound(m.round)),
    );
    if (existingPlayoffs.length > 0) {
      return {
        ok: false,
        error:
          "Playoff matches already exist. Archive them before regenerating.",
      };
    }

    const playoff = buildPlayoffPreview({
      advancers: playoffAdvancers,
      highestOrder: args.highestOrder,
      defaultBestOf: args.defaultBestOf,
      defaultRound: "Quarterfinals",
    });
    if (!playoff.ok) return playoff;

    return {
      ok: true,
      kind: "playoffs_ready",
      advancers: playoffAdvancers,
      preview: playoff.preview,
    };
  }

  if (waiting.length > 0) {
    return { ok: false, error: waiting.join(" ") };
  }
  if (blocked.length > 0) {
    return { ok: false, error: blocked.join(" ") };
  }
  if (playoffAdvancers.length > 0) {
    return {
      ok: false,
      error: "Need at least 2 playoff advancers across finished brackets.",
    };
  }

  return {
    ok: false,
    error: "Not enough winners to create the next round.",
  };
}

/** Map admin MatchRecord-like rows into bracket advance inputs. */
export function toBracketMatchInput(m: {
  bracket?: string;
  round?: string;
  status?: string;
  winner?: string;
  teamA?: string;
  teamB?: string;
  order?: number;
  expand?: {
    teamA?: { name?: string };
    teamB?: { name?: string };
    winner?: { name?: string };
  };
}): BracketMatchInput {
  return {
    bracket: m.bracket,
    round: m.round,
    status: m.status,
    winner: m.winner,
    teamA: m.teamA,
    teamB: m.teamB,
    order: m.order,
    teamAName: m.expand?.teamA?.name,
    teamBName: m.expand?.teamB?.name,
    winnerName: m.expand?.winner?.name,
  };
}
