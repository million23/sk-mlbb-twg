import { useQuery } from "@tanstack/react-query";
import { pocketbaseListQueryOptions } from "@/lib/pocketbase-list-query-options";
import { getCollection } from "@/lib/pocketbase";
import { rateLimited } from "@/lib/rate-limited-api";
import { queryKeys } from "@/lib/query-keys";
import type { Collections } from "@/types/pocketbase-types";

/** PocketBase filter: match belongs to tournament and is not soft-deleted. */
export function matchesActiveFilter(tournamentId: string) {
  return `tournament = "${tournamentId}" && archived != true`;
}

/** PocketBase filter: archived matches for a tournament. */
export function matchesArchivedFilter(tournamentId: string) {
  return `tournament = "${tournamentId}" && archived = true`;
}

export type MatchRecord = Collections["matches"] & {
  expand?: {
    teamA?: Collections["teams"];
    teamB?: Collections["teams"];
    winner?: Collections["teams"];
  };
};

export function useMatchesForTournament(
  tournamentId: string | undefined,
  options?: { enabled?: boolean },
) {
  const eligible = options?.enabled ?? true;
  return useQuery({
    ...pocketbaseListQueryOptions,
    queryKey: [...queryKeys.matches, tournamentId ?? "none"] as const,
    enabled: Boolean(tournamentId) && eligible,
    queryFn: () =>
      rateLimited(async () => {
        if (!tournamentId) return [];
        const col = getCollection("matches");
        const list = await col.getFullList({
          filter: matchesActiveFilter(tournamentId),
          sort: "+round,+order",
          expand: "teamA,teamB,winner",
        });
        return list as MatchRecord[];
      }),
  });
}

export function useArchivedMatchesForTournament(
  tournamentId: string | undefined,
  options?: { enabled?: boolean },
) {
  const eligible = options?.enabled ?? true;
  return useQuery({
    ...pocketbaseListQueryOptions,
    queryKey: [...queryKeys.matches, tournamentId ?? "none", "archived"] as const,
    enabled: Boolean(tournamentId) && eligible,
    queryFn: () =>
      rateLimited(async () => {
        if (!tournamentId) return [];
        const col = getCollection("matches");
        const list = await col.getFullList({
          filter: matchesArchivedFilter(tournamentId),
          sort: "+round,+order",
          expand: "teamA,teamB,winner",
        });
        return list as MatchRecord[];
      }),
  });
}
