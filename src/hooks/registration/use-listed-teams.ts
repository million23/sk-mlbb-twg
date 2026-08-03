import { getCollectionsTeamsRecords } from "@/hooks/orval/teams-collection/teams-collection";
import type { TeamsRecord } from "@/hooks/orval/model/teamsRecord";
import { customInstance } from "@/lib/api/mutator/custom-instance";
import { registrationKeys } from "@/hooks/registration/query-keys";
import type { EligiblePhase, ListedTeam } from "@/lib/registration/flow";
import {
	mapTeamRecord,
	unwrapOrvalListItems,
} from "@/lib/registration/orval";
import { queryOptions, useQuery } from "@tanstack/react-query";

type ListedTeamsApiResponse = {
	items?: {
		id?: string;
		name?: string;
	}[];
};

function pocketBaseOrigin() {
	return (
		import.meta.env.VITE_POCKETHOST_URL?.trim() || "https://pb.sk-mlbb-twg.com"
	).replace(/\/$/, "");
}

async function fetchListedTeamsFromCollection(
	tournamentId: string,
): Promise<ListedTeam[]> {
	const res = await getCollectionsTeamsRecords({
		page: 1,
		perPage: 200,
		sort: "name",
		filter: `tournament = "${tournamentId}" && archived = false && status != "inactive"`,
	});
	return unwrapOrvalListItems<TeamsRecord>(res)
		.map(mapTeamRecord)
		.filter((t): t is NonNullable<typeof t> => t != null);
}

/** Public PB hook route — joinable teams only (hides create-team placeholders). */
export async function fetchListedTeams(
	tournamentId: string,
): Promise<ListedTeam[]> {
	const tid = tournamentId.trim();
	if (!tid) return [];

	const url = new URL(`${pocketBaseOrigin()}/sk/registration/listed-teams`);
	url.searchParams.set("tournament", tid);

	try {
		const res = await customInstance<ListedTeamsApiResponse>(url.toString(), {
			method: "GET",
		});
		const items = Array.isArray(res?.items) ? res.items : [];
		return items
			.filter((t): t is { id: string; name: string } =>
				Boolean(t?.id && t?.name),
			)
			.map((t) => ({
				id: t.id,
				name: t.name,
				member_phases: [] as EligiblePhase[],
			}));
	} catch {
		// Route missing until pb_hooks redeploy — fall back to collection list.
		return fetchListedTeamsFromCollection(tid);
	}
}

export function listedTeamsQueryOptions(tournamentId: string) {
	return queryOptions({
		queryKey: registrationKeys.listedTeams(tournamentId),
		queryFn: () => fetchListedTeams(tournamentId),
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
