import { useQuery } from "@tanstack/react-query";
import { pocketbaseListQueryOptions } from "@/lib/legacy/pocketbase-list-query-options";
import { queryKeys } from "@/lib/legacy/query-keys";
import { supabase } from "@/lib/supabase/client";
import { throwIfError } from "@/lib/supabase/errors";
import {
  MATCH_RESULT_EMBED,
  MATCH_RESULT_PLAYER_EMBED,
  mapMatchResultRow,
} from "@/lib/supabase/map-records";
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
    queryFn: async () => {
      if (!matchId) return [];
      const data = throwIfError(
        await supabase
          .from("match_result")
          .select(MATCH_RESULT_PLAYER_EMBED)
          .eq("match", matchId)
          .eq("archived", false)
          .order("updated", { ascending: false })
          .order("created", { ascending: false }),
      );
      return (data ?? []).map((row) =>
        mapMatchResultRow(row as Record<string, unknown>),
      );
    },
  });
}

const MATCH_ID_FILTER_BATCH = 25;

export async function fetchMatchResultsForMatchIds(
  matchIds: string[],
): Promise<MatchResultRecord[]> {
  const ids = [...new Set(matchIds.filter(Boolean))];
  if (ids.length === 0) return [];
  const batches: MatchResultRecord[] = [];
  for (let i = 0; i < ids.length; i += MATCH_ID_FILTER_BATCH) {
    const chunk = ids.slice(i, i + MATCH_ID_FILTER_BATCH);
    const data = throwIfError(
      await supabase
        .from("match_result")
        .select("*")
        .in("match", chunk)
        .eq("archived", false)
        .order("updated", { ascending: false })
        .order("created", { ascending: false }),
    );
    batches.push(
      ...(data ?? []).map((row) =>
        mapMatchResultRow(row as Record<string, unknown>),
      ),
    );
  }
  return batches;
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
    queryFn: async () => {
      if (!tournamentId) return [];
      const data = throwIfError(
        await supabase
          .from("match_result")
          .select(MATCH_RESULT_EMBED)
          .eq("archived", false)
          .order("updated", { ascending: false })
          .order("created", { ascending: false }),
      );
      return (data ?? []).map((row) =>
        mapMatchResultRow(row as Record<string, unknown>),
      );
    },
  });
}
