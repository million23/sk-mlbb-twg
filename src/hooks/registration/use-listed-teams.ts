import { registrationKeys } from "@/hooks/registration/query-keys";
import type { EligiblePhase, ListedTeam } from "@/lib/registration/flow";
import { supabase } from "@/lib/supabase/client";
import { throwIfError } from "@/lib/supabase/errors";
import { queryOptions, useQuery } from "@tanstack/react-query";

export async function fetchListedTeams(
  tournamentId: string,
): Promise<ListedTeam[]> {
  const tid = tournamentId.trim();
  if (!tid) return [];

  const items = throwIfError(
    await supabase.rpc("registration_listed_teams", {
      p_tournament: tid,
    }),
  );

  return (items ?? [])
    .filter((t): t is { id: string; name: string } =>
      Boolean(t?.id && t?.name),
    )
    .map((t) => ({
      id: t.id,
      name: t.name,
      member_phases: [] as EligiblePhase[],
    }));
}

export function listedTeamsQueryOptions(tournamentId: string) {
  return queryOptions({
    queryKey: registrationKeys.listedTeams(tournamentId),
    queryFn: () => fetchListedTeams(tournamentId),
    enabled: Boolean(tournamentId),
  });
}

export function useListedTeams(tournamentId: string | undefined) {
  return useQuery({
    ...listedTeamsQueryOptions(tournamentId ?? ""),
  });
}
