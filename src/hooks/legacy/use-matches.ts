import { useQuery } from "@tanstack/react-query";
import { fromMatchApiRecord } from "@/lib/admin/match-write";
import { pocketbaseListQueryOptions } from "@/lib/legacy/pocketbase-list-query-options";
import { queryKeys } from "@/lib/legacy/query-keys";
import { supabase } from "@/lib/supabase/client";
import { throwIfError } from "@/lib/supabase/errors";
import { MATCH_EMBED, mapMatchRow } from "@/lib/supabase/map-records";
import type { Collections } from "@/types/__pocketbase-types";

export function isPublicMatchRecord(match: { status?: string }): boolean {
  return match.status !== "draft";
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
    queryFn: async () => {
      if (!tournamentId) return [];
      const data = throwIfError(
        await supabase
          .from("matches")
          .select(MATCH_EMBED)
          .eq("tournament", tournamentId)
          .eq("archived", false)
          .order("round", { ascending: true })
          .order("order", { ascending: true }),
      );
      const rows = (data ?? []).map((row) =>
        mapMatchRow(row as Record<string, unknown>),
      );
      return publicOnly ? rows.filter(isPublicMatchRecord) : rows;
    },
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
    queryFn: async () => {
      if (!tournamentId) return [];
      const data = throwIfError(
        await supabase
          .from("matches")
          .select(MATCH_EMBED)
          .eq("tournament", tournamentId)
          .eq("archived", true)
          .order("round", { ascending: true })
          .order("order", { ascending: true }),
      );
      return (data ?? []).map((row) =>
        mapMatchRow(row as Record<string, unknown>),
      );
    },
  });
}

export { fromMatchApiRecord };
