import { getCollectionsTeamsRecords } from "@/hooks/orval/teams-collection/teams-collection";
import type { TeamsRecord } from "@/hooks/orval/model/teamsRecord";
import { registrationKeys } from "@/hooks/registration/query-keys";
import {
	mapTeamRecord,
	unwrapOrvalListItems,
} from "@/lib/registration/orval";
import { queryOptions, useQuery } from "@tanstack/react-query";

export function listedTeamsQueryOptions(tournamentId: string) {
	return queryOptions({
		queryKey: registrationKeys.listedTeams(tournamentId),
		queryFn: async () => {
			const res = await getCollectionsTeamsRecords({
				page: 1,
				perPage: 200,
				sort: "name",
				filter: `tournament = "${tournamentId}" && archived = false && status != "inactive"`,
			});
			return unwrapOrvalListItems<TeamsRecord>(res)
				.map(mapTeamRecord)
				.filter((t): t is NonNullable<typeof t> => t != null);
		},
		enabled: Boolean(tournamentId),
	});
}

/** Teams available for the join-team step. */
export function useListedTeams(tournamentId: string | undefined) {
	return useQuery({
		...listedTeamsQueryOptions(tournamentId ?? ""),
		enabled: Boolean(tournamentId),
	});
}
