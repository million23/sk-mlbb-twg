import { useQuery } from "@tanstack/react-query";
import { getCollection } from "@/lib/pocketbase";
import { rateLimited } from "@/lib/rate-limited-api";
import { queryKeys } from "@/lib/query-keys";

export function useDraftSuggestions() {
  return useQuery({
    queryKey: queryKeys.draftSuggestions,
    queryFn: () =>
      rateLimited(async () => {
        const col = getCollection("draft_suggestions");
        return col.getFullList({ sort: "-created" });
      }),
  });
}
