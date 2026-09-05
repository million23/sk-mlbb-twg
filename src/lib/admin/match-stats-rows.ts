export function shouldReplaceMatchStatsRows(input: {
  open: boolean;
  matchId: string | undefined;
  alreadySyncedMatchId: string | null;
  resultsPending: boolean;
}): boolean {
  if (!input.open || !input.matchId) return false;
  if (input.resultsPending) return false;
  return input.alreadySyncedMatchId !== input.matchId;
}
