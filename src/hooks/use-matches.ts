import { useQuery } from "@tanstack/react-query";
import { getCollection } from "@/lib/pocketbase";
import { rateLimited } from "@/lib/rate-limited-api";
import { queryKeys } from "@/lib/query-keys";
import type { Collections } from "@/types/pocketbase-types";

export type MatchRecord = Collections["matches"] & {
  expand?: {
    teamA?: Collections["teams"];
    teamB?: Collections["teams"];
    winner?: Collections["teams"];
  };
};

export function useMatchesForTournament(tournamentId: string | undefined) {
  return useQuery({
    queryKey: [...queryKeys.matches, tournamentId ?? "none"] as const,
    enabled: Boolean(tournamentId),
    queryFn: () =>
      rateLimited(async () => {
        if (!tournamentId) return [];
        const col = getCollection("matches");
        const list = await col.getFullList({
          filter: `tournament = "${tournamentId}"`,
          sort: "+round,+order",
          expand: "teamA,teamB,winner",
        });
        return list as MatchRecord[];
      }),
  });
}
