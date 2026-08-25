export const adminParticipantKeys = {
  all: ["admin", "participants"] as const,
  list: (tournamentId: string) =>
    [...adminParticipantKeys.all, "list", tournamentId] as const,
  infinite: (
    tournamentId: string,
    tab: string,
    search: string,
  ) =>
    [...adminParticipantKeys.list(tournamentId), "infinite", tab, search] as const,
  counts: (tournamentId: string) =>
    [...adminParticipantKeys.list(tournamentId), "counts"] as const,
};
