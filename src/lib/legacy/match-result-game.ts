/** Which map in a Bo1/Bo3/Bo5 series a `match_result` row belongs to. */
export function resultGameNumber(result: {
  game_number?: number | null;
}): number {
  const n = result.game_number;
  if (typeof n !== "number" || !Number.isFinite(n) || n < 1) return 1;
  return Math.trunc(n);
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
