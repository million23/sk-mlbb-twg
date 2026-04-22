import { useQuery } from "@tanstack/react-query";
import { pocketbaseListQueryOptions } from "@/lib/pocketbase-list-query-options";
import { getCollection } from "@/lib/pocketbase";
import { queryKeys } from "@/lib/query-keys";
import { rateLimited } from "@/lib/rate-limited-api";
import type { Collections } from "@/types/pocketbase-types";

export type MatchResultRecord = Collections["match_result"] & {
  expand?: {
    player?: Collections["participants"];
    match?: Collections["matches"];
  };
};

export function useMatchResultsForMatch(
  matchId: string | undefined,
  options?: { enabled?: boolean },
) {
  const eligible = options?.enabled ?? true;
  return useQuery({
    ...pocketbaseListQueryOptions,
    queryKey: [...queryKeys.matchResults, matchId ?? "none"] as const,
    enabled: Boolean(matchId) && eligible,
    queryFn: () =>
      rateLimited(async () => {
        if (!matchId) return [];
        const col = getCollection("match_result");
        const list = await col.getFullList({
          filter: `match = "${matchId}" && archived != true`,
          sort: "-updated,-created",
          expand: "player",
        });
        return list as MatchResultRecord[];
      }),
  });
}

export function useMatchResultsForTournament(
  tournamentId: string | undefined,
  options?: { enabled?: boolean },
) {
  const eligible = options?.enabled ?? true;
  return useQuery({
    ...pocketbaseListQueryOptions,
    queryKey: [...queryKeys.matchResults, "tournament", tournamentId ?? "none"] as const,
    enabled: Boolean(tournamentId) && eligible,
    queryFn: () =>
      rateLimited(async () => {
        if (!tournamentId) return [];
        const col = getCollection("match_result");
        const list = await col.getFullList({
          // Keep filter broad and let the page scope by tournament match IDs.
          // Relation filter syntax can vary across PocketBase versions/schemas.
          filter: "archived != true",
          sort: "-updated,-created",
          expand: "player,match",
        });
        return list as MatchResultRecord[];
      }),
  });
}
