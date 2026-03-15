import { useQuery } from "@tanstack/react-query";
import { getCollection } from "@/lib/pocketbase";
import { rateLimited } from "@/lib/rate-limited-api";
import { queryKeys } from "@/lib/query-keys";

export function useTournamentDrafts() {
  return useQuery({
    queryKey: queryKeys.tournamentDrafts,
    queryFn: () =>
      rateLimited(async () => {
        const col = getCollection("tournament_drafts");
        return col.getFullList({ sort: "-created" });
      }),
  });
}
