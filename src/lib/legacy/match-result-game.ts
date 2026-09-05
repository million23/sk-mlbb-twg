type GameNumberFields = {
  game_number?: number | string | null;
  gameNumber?: number | string | null;
};

function rawStoredGameNumber(
  result: GameNumberFields,
): number | string | null | undefined {
  return result.game_number ?? result.gameNumber;
}

/** Explicit map index, or null when the field is missing / junk. */
export function storedGameNumber(result: GameNumberFields): number | null {
  const raw = rawStoredGameNumber(result);
  const n = typeof raw === "string" ? Number.parseFloat(raw) : raw;
  if (typeof n !== "number" || !Number.isFinite(n) || n < 1) return null;
  return Math.trunc(n);
}

/** Which map in a Bo1/Bo3/Bo5 series a `match_result` row belongs to. */
export function resultGameNumber(result: GameNumberFields): number {
  return storedGameNumber(result) ?? 1;
}

/** PATCH this id for player+map. Ignores rows with no stored `game_number`. */
export function findMatchResultIdForGame(
  results: Array<
    GameNumberFields & {
      id?: string;
      created?: string;
      player?: unknown;
      expand?: { player?: { id?: string } };
    }
  >,
  playerId: string,
  gameNumber: number,
): string | undefined {
  const matches = results.filter((result) => {
    if (!result.id) return false;
    if (resultPlayerId(result) !== playerId) return false;
    return storedGameNumber(result) === gameNumber;
  });
  if (matches.length === 0) return undefined;
  matches.sort((a, b) => (a.created ?? "").localeCompare(b.created ?? ""));
  return matches[matches.length - 1]?.id;
}

export function resultPlayerId(result: {
  player?: unknown;
  expand?: { player?: { id?: string } };
}): string | undefined {
  const p = result.player;
  if (typeof p === "string" && p.trim()) return p.trim();
  if (p && typeof p === "object" && "id" in p) {
    const id = (p as { id?: unknown }).id;
    if (typeof id === "string" && id.trim()) return id.trim();
  }
  const expanded = result.expand?.player?.id?.trim();
  return expanded || undefined;
}

export function matchSeriesGameCount(
  bestOf: number | undefined | null,
): number {
  if (typeof bestOf !== "number" || !Number.isFinite(bestOf) || bestOf < 1) {
    return 1;
  }
  return Math.trunc(bestOf);
}

export function seriesGameNumbers(bestOf: number | undefined | null): number[] {
  const count = matchSeriesGameCount(bestOf);
  return Array.from({ length: count }, (_, i) => i + 1);
}

export type MatchResultGameRow = {
  id?: string;
  player?: string;
  lane?: string;
  kills?: number;
  deaths?: number;
  assists?: number;
  game_performance_rating?: number;
  accumulated_gold?: number;
  game_number?: number | string | null;
  gameNumber?: number | string | null;
  created?: string;
  updated?: string;
};

function rowTime(row: MatchResultGameRow): number {
  const raw = row.updated || row.created;
  if (!raw) return 0;
  const t = Date.parse(raw);
  return Number.isFinite(t) ? t : 0;
}

function isCollapsedUnnumberedDump(
  results: MatchResultGameRow[],
  maxGame: number,
): boolean {
  const inSeries = results.filter((row) => {
    const game = storedGameNumber(row);
    return game != null && game <= maxGame;
  });
  if (inSeries.length === 0) return results.length > 0;
  const games = new Set(inSeries.map((row) => storedGameNumber(row)));
  if (games.size > 1) return false;
  const unique = new Set(
    inSeries.map((row) => `${row.player ?? ""}:${row.lane ?? ""}`),
  );
  return inSeries.length > unique.size;
}

/**
 * Public view: drop unnumbered rows, games past best-of, and
 * "everything saved as game 1" dumps. Duplicate player+game+lane keeps newest.
 */
export function visibleMatchResultRows<T extends MatchResultGameRow>(
  results: T[],
  bestOf?: number | null,
): T[] {
  const maxGame = matchSeriesGameCount(bestOf);
  if (isCollapsedUnnumberedDump(results, maxGame)) return [];
  const kept = new Map<string, T>();
  for (const row of results) {
    const game = storedGameNumber(row);
    if (game == null || game > maxGame) continue;
    const key = `${row.player ?? ""}:${game}:${row.lane ?? ""}`;
    const prev = kept.get(key);
    if (!prev || rowTime(row) >= rowTime(prev)) kept.set(key, row);
  }
  return [...kept.values()];
}

export function displayGameByResultId(
  results: MatchResultGameRow[],
  bestOf?: number | null,
): Map<string, number> {
  const map = new Map<string, number>();
  const maxGame = matchSeriesGameCount(bestOf);
  for (const row of visibleMatchResultRows(results, bestOf)) {
    const game = storedGameNumber(row);
    if (row.id && game != null && game <= maxGame) map.set(row.id, game);
  }
  return map;
}

export function matchResultTabNumbers(
  _results: MatchResultGameRow[],
  bestOf?: number | null,
): number[] {
  return seriesGameNumbers(bestOf);
}

export function kdaRatio(row: MatchResultGameRow): number {
  if (row.kills == null && row.deaths == null && row.assists == null) return 0;
  const kills = row.kills ?? 0;
  const deaths = Math.max(1, row.deaths ?? 0);
  const assists = row.assists ?? 0;
  return (kills + assists) / deaths;
}

export function bestResultIdByLane(
  rows: MatchResultGameRow[],
): Map<string, string> {
  const best = new Map<
    string,
    { id: string; perf: number; kda: number; gold: number }
  >();
  for (const row of rows) {
    const lane = row.lane?.trim();
    const id = row.id;
    if (!lane || !id) continue;
    const candidate = {
      id,
      perf: row.game_performance_rating ?? 0,
      kda: kdaRatio(row),
      gold: row.accumulated_gold ?? 0,
    };
    const current = best.get(lane);
    if (!current) {
      best.set(lane, candidate);
      continue;
    }
    if (candidate.perf !== current.perf) {
      if (candidate.perf > current.perf) best.set(lane, candidate);
      continue;
    }
    if (candidate.kda !== current.kda) {
      if (candidate.kda > current.kda) best.set(lane, candidate);
      continue;
    }
    if (candidate.gold > current.gold) best.set(lane, candidate);
  }
  return new Map([...best.entries()].map(([lane, row]) => [lane, row.id]));
}
