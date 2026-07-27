export const adminTeamKeys = {
  all: ["admin", "teams"] as const,
  list: (tournamentId: string) =>
    [...adminTeamKeys.all, "list", tournamentId] as const,
  archived: (tournamentId: string) =>
    [...adminTeamKeys.all, "archived", tournamentId] as const,
};
