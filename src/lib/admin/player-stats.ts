import {
  computeTeamStandings,
  type MatchStandingInput,
  type TeamStandingInput,
} from "@/lib/admin/team-standings";

export const PLAYER_STAT_LANES = [
  "gold",
  "exp",
  "mid",
  "jungle",
  "support",
] as const;

export type PlayerStatLane = (typeof PLAYER_STAT_LANES)[number];

export const PLAYER_STAT_LANE_LABELS: Record<PlayerStatLane, string> = {
  mid: "Mid",
  gold: "Gold",
  exp: "Exp",
  support: "Support",
  jungle: "Jungle",
};

export const BEST_LANER_SCORE_WEIGHTS = {
  performanceRating: 0.4,
  kda: 0.35,
  teamWinRate: 0.15,
  sampleSize: 0.1,
} as const;

export type PlayerStatMatchInput = MatchStandingInput & {
  id?: string;
};

export type PlayerStatResultInput = {
  match?: string;
  player?: string;
  lane?: string;
  kills?: number;
  deaths?: number;
  assists?: number;
  game_performance_rating?: number;
  accumulated_gold?: number;
};

export type PlayerStatParticipantInput = {
  id?: string;
  team?: string;
  name?: string;
  ign?: string;
  gameID?: string;
};

export type PlayerStatRow = {
  playerId: string;
  playerLabel: string;
  teamName: string;
  games: number;
  kills: number;
  deaths: number;
  assists: number;
  avgKda: number;
  avgGold: number;
  avgPerformanceRating: number;
  primaryLane: PlayerStatLane | null;
};

export type LaneLeaderRow = {
  lane: PlayerStatLane;
  laneLabel: string;
  playerId: string;
  playerLabel: string;
  teamName: string;
  teamWins: number;
  teamLosses: number;
  teamWinRate: number;
  playerMatchResults: number;
  avgPerformanceRating: number;
  avgKda: number;
  avgGold: number;
  score: number;
};

export type PlayerStatsComputed = {
  players: PlayerStatRow[];
  laneRankings: LaneLeaderRow[];
  bestByLane: Partial<Record<PlayerStatLane, LaneLeaderRow>>;
};

type LaneAgg = {
  lane: PlayerStatLane;
  playerId: string;
  playerLabel: string;
  teamName: string;
  teamWins: number;
  teamLosses: number;
  teamWinRate: number;
  playerMatchResults: number;
  perfTotal: number;
  perfCount: number;
  kdaTotal: number;
  kdaCount: number;
  goldTotal: number;
  goldCount: number;
};

type PlayerAgg = {
  playerId: string;
  playerLabel: string;
  teamName: string;
  games: number;
  kills: number;
  deaths: number;
  assists: number;
  perfTotal: number;
  perfCount: number;
  kdaTotal: number;
  kdaCount: number;
  goldTotal: number;
  goldCount: number;
  laneCounts: Partial<Record<PlayerStatLane, number>>;
};

function isLane(value: string | undefined): value is PlayerStatLane {
  return (
    value === "gold" ||
    value === "exp" ||
    value === "mid" ||
    value === "jungle" ||
    value === "support"
  );
}

export function formatPlayerStatLabel(
  participant: PlayerStatParticipantInput | undefined,
  fallbackId: string,
): string {
  const ign = participant?.ign?.trim() || participant?.gameID?.trim();
  const name = participant?.name?.trim();
  if (ign && name) return `${ign} - ${name}`;
  return ign || name || fallbackId;
}

function kdaRatio(kills: number, deaths: number, assists: number): number {
  return (kills + assists) / Math.max(1, deaths);
}

function primaryLane(
  counts: Partial<Record<PlayerStatLane, number>>,
): PlayerStatLane | null {
  let best: PlayerStatLane | null = null;
  let bestCount = 0;
  for (const lane of PLAYER_STAT_LANES) {
    const count = counts[lane] ?? 0;
    if (count > bestCount) {
      best = lane;
      bestCount = count;
    }
  }
  return bestCount > 0 ? best : null;
}

function toLaneRow(agg: LaneAgg, maxSamples: number): LaneLeaderRow {
  const avgPerformanceRating =
    agg.perfCount > 0 ? agg.perfTotal / agg.perfCount : 0;
  const avgKda = agg.kdaCount > 0 ? agg.kdaTotal / agg.kdaCount : 0;
  const avgGold = agg.goldCount > 0 ? agg.goldTotal / agg.goldCount : 0;
  const score =
    avgPerformanceRating * BEST_LANER_SCORE_WEIGHTS.performanceRating +
    avgKda * BEST_LANER_SCORE_WEIGHTS.kda +
    (agg.teamWinRate / 100) * BEST_LANER_SCORE_WEIGHTS.teamWinRate +
    (agg.playerMatchResults / maxSamples) * BEST_LANER_SCORE_WEIGHTS.sampleSize;
  return {
    lane: agg.lane,
    laneLabel: PLAYER_STAT_LANE_LABELS[agg.lane],
    playerId: agg.playerId,
    playerLabel: agg.playerLabel,
    teamName: agg.teamName,
    teamWins: agg.teamWins,
    teamLosses: agg.teamLosses,
    teamWinRate: agg.teamWinRate,
    playerMatchResults: agg.playerMatchResults,
    avgPerformanceRating,
    avgKda,
    avgGold,
    score,
  };
}

function compareLaneRows(a: LaneLeaderRow, b: LaneLeaderRow): number {
  if (b.score !== a.score) return b.score - a.score;
  if (b.avgPerformanceRating !== a.avgPerformanceRating) {
    return b.avgPerformanceRating - a.avgPerformanceRating;
  }
  if (b.avgKda !== a.avgKda) return b.avgKda - a.avgKda;
  if (b.teamWinRate !== a.teamWinRate) return b.teamWinRate - a.teamWinRate;
  if (b.teamWins !== a.teamWins) return b.teamWins - a.teamWins;
  if (a.teamLosses !== b.teamLosses) return a.teamLosses - b.teamLosses;
  if (b.playerMatchResults !== a.playerMatchResults) {
    return b.playerMatchResults - a.playerMatchResults;
  }
  return a.playerLabel.localeCompare(b.playerLabel);
}

function comparePlayerRows(a: PlayerStatRow, b: PlayerStatRow): number {
  if (b.avgPerformanceRating !== a.avgPerformanceRating) {
    return b.avgPerformanceRating - a.avgPerformanceRating;
  }
  if (b.avgKda !== a.avgKda) return b.avgKda - a.avgKda;
  if (b.games !== a.games) return b.games - a.games;
  return a.playerLabel.localeCompare(b.playerLabel);
}

function matchTeamA(m: PlayerStatMatchInput): string | undefined {
  return m.teamA ?? m.team_a;
}

function matchTeamB(m: PlayerStatMatchInput): string | undefined {
  return m.teamB ?? m.team_b;
}

export function computePlayerStats(input: {
  teams: TeamStandingInput[];
  matches: PlayerStatMatchInput[];
  matchResults: PlayerStatResultInput[];
  participants: PlayerStatParticipantInput[];
}): PlayerStatsComputed {
  const standings = computeTeamStandings({
    teams: input.teams,
    matches: input.matches,
  });
  const standingsByTeamId = new Map(standings.map((row) => [row.teamId, row]));
  const eligibleMatchIds = new Set(
    input.matches
      .filter((m) => Boolean(matchTeamA(m)?.trim()) && Boolean(matchTeamB(m)?.trim()))
      .map((m) => m.id)
      .filter((id): id is string => Boolean(id)),
  );
  const participantsById = new Map(
    input.participants
      .filter((p) => Boolean(p.id))
      .map((p) => [p.id as string, p]),
  );

  const grouped = new Map<PlayerStatLane, Map<string, LaneAgg>>();
  const players = new Map<string, PlayerAgg>();

  for (const result of input.matchResults) {
    const lane = result.lane;
    if (!isLane(lane) || !result.player || !result.match) continue;
    if (!eligibleMatchIds.has(result.match)) continue;

    const participant = participantsById.get(result.player);
    const teamId = participant?.team?.trim();
    if (!teamId) continue;
    const teamStats = standingsByTeamId.get(teamId);
    if (!teamStats) continue;

    const playerLabel = formatPlayerStatLabel(participant, result.player);
    const kills = result.kills ?? 0;
    const deaths = result.deaths ?? 0;
    const assists = result.assists ?? 0;
    const hasKda =
      result.kills != null || result.assists != null || result.deaths != null;

    let laneMap = grouped.get(lane);
    if (!laneMap) {
      laneMap = new Map();
      grouped.set(lane, laneMap);
    }
    const laneAgg = laneMap.get(result.player) ?? {
      lane,
      playerId: result.player,
      playerLabel,
      teamName: teamStats.teamName,
      teamWins: teamStats.matchWins,
      teamLosses: teamStats.matchLosses,
      teamWinRate: teamStats.winRate,
      playerMatchResults: 0,
      perfTotal: 0,
      perfCount: 0,
      kdaTotal: 0,
      kdaCount: 0,
      goldTotal: 0,
      goldCount: 0,
    };
    laneAgg.playerMatchResults += 1;
    if (result.game_performance_rating != null) {
      laneAgg.perfTotal += result.game_performance_rating;
      laneAgg.perfCount += 1;
    }
    if (hasKda) {
      laneAgg.kdaTotal += kdaRatio(kills, deaths, assists);
      laneAgg.kdaCount += 1;
    }
    if (result.accumulated_gold != null) {
      laneAgg.goldTotal += result.accumulated_gold;
      laneAgg.goldCount += 1;
    }
    laneMap.set(result.player, laneAgg);

    const playerAgg = players.get(result.player) ?? {
      playerId: result.player,
      playerLabel,
      teamName: teamStats.teamName,
      games: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
      perfTotal: 0,
      perfCount: 0,
      kdaTotal: 0,
      kdaCount: 0,
      goldTotal: 0,
      goldCount: 0,
      laneCounts: {},
    };
    playerAgg.games += 1;
    playerAgg.kills += kills;
    playerAgg.deaths += deaths;
    playerAgg.assists += assists;
    playerAgg.laneCounts[lane] = (playerAgg.laneCounts[lane] ?? 0) + 1;
    if (result.game_performance_rating != null) {
      playerAgg.perfTotal += result.game_performance_rating;
      playerAgg.perfCount += 1;
    }
    if (hasKda) {
      playerAgg.kdaTotal += kdaRatio(kills, deaths, assists);
      playerAgg.kdaCount += 1;
    }
    if (result.accumulated_gold != null) {
      playerAgg.goldTotal += result.accumulated_gold;
      playerAgg.goldCount += 1;
    }
    players.set(result.player, playerAgg);
  }

  const laneRankings: LaneLeaderRow[] = [];
  const bestByLane: Partial<Record<PlayerStatLane, LaneLeaderRow>> = {};
  for (const lane of PLAYER_STAT_LANES) {
    const candidates = [...(grouped.get(lane)?.values() ?? [])];
    if (candidates.length < 1) continue;
    const maxSamples = candidates.reduce(
      (max, current) => Math.max(max, current.playerMatchResults),
      1,
    );
    const rows = candidates
      .map((candidate) => toLaneRow(candidate, maxSamples))
      .sort(compareLaneRows);
    const leader = rows[0];
    if (leader) bestByLane[lane] = leader;
    laneRankings.push(...rows);
  }

  const playerRows: PlayerStatRow[] = [...players.values()]
    .map((agg) => ({
      playerId: agg.playerId,
      playerLabel: agg.playerLabel,
      teamName: agg.teamName,
      games: agg.games,
      kills: agg.kills,
      deaths: agg.deaths,
      assists: agg.assists,
      avgKda: agg.kdaCount > 0 ? agg.kdaTotal / agg.kdaCount : 0,
      avgGold: agg.goldCount > 0 ? agg.goldTotal / agg.goldCount : 0,
      avgPerformanceRating:
        agg.perfCount > 0 ? agg.perfTotal / agg.perfCount : 0,
      primaryLane: primaryLane(agg.laneCounts),
    }))
    .sort(comparePlayerRows);

  return { players: playerRows, laneRankings, bestByLane };
}
