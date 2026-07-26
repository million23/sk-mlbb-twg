export const adminParticipantKeys = {
  all: ["admin", "participants"] as const,
  list: (tournamentId: string) =>
    [...adminParticipantKeys.all, "list", tournamentId] as const,
};
