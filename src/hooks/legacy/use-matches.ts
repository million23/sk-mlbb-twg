import { useQuery } from "@tanstack/react-query";
import { pocketbaseListQueryOptions } from "@/lib/legacy/pocketbase-list-query-options";
import { getCollection } from "@/lib/pocketbase";
import { rateLimited } from "@/lib/rate-limited-api";
import { queryKeys } from "@/lib/legacy/query-keys";
import { fromMatchApiRecord } from "@/lib/admin/match-write";
import type { Collections } from "@/types/__pocketbase-types";

/** PocketBase filter: match belongs to tournament and is not soft-deleted. */
export function matchesActiveFilter(tournamentId: string) {
  return `tournament = "${tournamentId}" && archived != true`;
}

export function isPublicMatchRecord(match: { status?: string }): boolean {
  return match.status !== "draft";
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
  options?: { enabled?: boolean; publicOnly?: boolean },
) {
  const eligible = options?.enabled ?? true;
  const publicOnly = options?.publicOnly ?? false;
  return useQuery({
    ...pocketbaseListQueryOptions,
    queryKey: [
      ...queryKeys.matches,
      tournamentId ?? "none",
      publicOnly ? "public" : "admin",
    ] as const,
    enabled: Boolean(tournamentId) && eligible,
    queryFn: () =>
      rateLimited(async () => {
        if (!tournamentId) return [];
        const col = getCollection("matches");
        const list = await col.getFullList({
          filter: matchesActiveFilter(tournamentId),
          sort: "+round,+order",
          expand: "team_a,team_b,winner",
        });
        const rows = (list as MatchRecord[]).map((row) =>
          fromMatchApiRecord(row),
        );
        return publicOnly ? rows.filter(isPublicMatchRecord) : rows;
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
          expand: "team_a,team_b,winner",
        });
        return (list as MatchRecord[]).map((row) => fromMatchApiRecord(row));
      }),
  });
}
