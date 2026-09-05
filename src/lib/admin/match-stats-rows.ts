export function shouldReplaceMatchStatsRows(input: {
  open: boolean;
  matchId: string | undefined;
  resultsPending: boolean;
  isFetching: boolean;
  isSaving: boolean;
  hasDirtyRows: boolean;
  hasLocalRows: boolean;
}): boolean {
  if (!input.open || !input.matchId) return false;
  if (input.isSaving || input.hasDirtyRows) return false;
  if (input.resultsPending) return false;
  if (input.isFetching && input.hasLocalRows) return false;
  return true;
}
