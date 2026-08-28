import { useQuery } from "@tanstack/react-query";
import { pocketbaseListQueryOptions } from "@/lib/legacy/pocketbase-list-query-options";
import { getCollection } from "@/lib/pocketbase";
import { queryKeys } from "@/lib/legacy/query-keys";
import { rateLimited } from "@/lib/rate-limited-api";
import type { Collections } from "@/types/__pocketbase-types";

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

const MATCH_ID_FILTER_BATCH = 25;

/** Active match_result rows for the given match ids (batched PocketBase filters). */
export async function fetchMatchResultsForMatchIds(
  matchIds: string[],
): Promise<MatchResultRecord[]> {
  const ids = [...new Set(matchIds.filter(Boolean))];
  if (ids.length === 0) return [];
  return rateLimited(async () => {
    const col = getCollection("match_result");
    const batches: MatchResultRecord[] = [];
    for (let i = 0; i < ids.length; i += MATCH_ID_FILTER_BATCH) {
      const chunk = ids.slice(i, i + MATCH_ID_FILTER_BATCH);
      const matchClause = chunk.map((id) => `match = "${id}"`).join(" || ");
      const list = await col.getFullList({
        filter: `(${matchClause}) && archived != true`,
        sort: "-updated,-created",
      });
      batches.push(...(list as MatchResultRecord[]));
    }
    return batches;
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
