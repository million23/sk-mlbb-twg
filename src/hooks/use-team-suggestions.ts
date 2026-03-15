import { useQuery } from "@tanstack/react-query";
import { getCollection } from "@/lib/pocketbase";
import { rateLimited } from "@/lib/rate-limited-api";
import { queryKeys } from "@/lib/query-keys";

export function useTeamSuggestions() {
  return useQuery({
    queryKey: queryKeys.teamSuggestions,
    queryFn: () =>
      rateLimited(async () => {
        const col = getCollection("team_suggestions");
        return col.getFullList({ sort: "-sortScore" });
      }),
  });
}

export function useTeamSuggestionsByParticipant(participantId: string | null) {
  return useQuery({
    queryKey: [...queryKeys.teamSuggestions, participantId],
    queryFn: () =>
      rateLimited(async () => {
        if (!participantId) return [];
        const col = getCollection("team_suggestions");
        return col.getFullList({
          filter: `participantId = "${participantId}"`,
          sort: "-sortScore",
        });
      }),
    enabled: Boolean(participantId),
  });
}
