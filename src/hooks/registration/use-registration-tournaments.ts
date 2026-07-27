import { getCollectionsTournamentsRecords } from "@/hooks/orval/tournaments-collection/tournaments-collection";
import type { TournamentsRecord } from "@/hooks/orval/model/tournamentsRecord";
import { registrationKeys } from "@/hooks/registration/query-keys";
import {
	isRegistrationWindowOpen,
	resolveTournamentDay,
	unwrapOrvalListItems,
} from "@/lib/registration/orval";
import { queryOptions, useQuery } from "@tanstack/react-query";

export type RegistrationTournament = TournamentsRecord & {
	registration_open: boolean;
	tournament_day: string;
};

function toRegistrationTournament(t: TournamentsRecord): RegistrationTournament {
	return {
		...t,
		registration_open: isRegistrationWindowOpen(t),
		tournament_day: resolveTournamentDay(t),
	};
}

/** OpenAPI list of tournaments that can accept public registration. */
export function openRegistrationTournamentsQueryOptions() {
	return queryOptions({
		queryKey: registrationKeys.openTournaments(),
		queryFn: async () => {
			const res = await getCollectionsTournamentsRecords({
				page: 1,
				perPage: 50,
				sort: "-start_at",
				filter: "archived = false && registration_enabled = true",
			});
			return unwrapOrvalListItems<TournamentsRecord>(res)
				.map(toRegistrationTournament)
				.filter((t) => t.registration_open && Boolean(t.id));
		},
	});
}

export function useOpenRegistrationTournaments() {
	return useQuery(openRegistrationTournamentsQueryOptions());
}

export function registrationTournamentQueryOptions(idOrSlug: string) {
	return queryOptions({
		queryKey: registrationKeys.tournament(idOrSlug),
		queryFn: async () => {
			const byId = await getCollectionsTournamentsRecords({
				page: 1,
				perPage: 1,
				filter: `id = "${idOrSlug}" || slug = "${idOrSlug}"`,
			});
			const items = unwrapOrvalListItems<TournamentsRecord>(byId);
			const t = items[0];
			if (!t?.id) throw new Error("Tournament not found");
			return toRegistrationTournament(t);
		},
		enabled: Boolean(idOrSlug),
	});
}

export function useRegistrationTournament(idOrSlug: string | undefined) {
	return useQuery({
		...registrationTournamentQueryOptions(idOrSlug ?? ""),
		enabled: Boolean(idOrSlug),
	});
}
