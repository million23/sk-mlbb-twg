export const registrationKeys = {
	all: ["registration"] as const,
	tournaments: () => [...registrationKeys.all, "tournaments"] as const,
	tournament: (idOrSlug: string) =>
		[...registrationKeys.tournaments(), idOrSlug] as const,
	openTournaments: () =>
		[...registrationKeys.tournaments(), "open"] as const,
	listedTeams: (tournamentId: string) =>
		[...registrationKeys.all, "listed-teams", tournamentId] as const,
	emailAvailable: (tournamentId: string, email: string) =>
		[
			...registrationKeys.all,
			"email-available",
			tournamentId,
			email,
		] as const,
};
