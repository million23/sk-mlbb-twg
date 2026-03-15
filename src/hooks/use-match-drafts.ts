import { useQuery } from "@tanstack/react-query";
import { getCollection } from "@/lib/pocketbase";
import { rateLimited } from "@/lib/rate-limited-api";
import { queryKeys } from "@/lib/query-keys";

export function useMatchDrafts() {
  return useQuery({
    queryKey: queryKeys.matchDrafts,
    queryFn: () =>
      rateLimited(async () => {
        const col = getCollection("match_drafts");
        return col.getFullList({ sort: "-created" });
      }),
  });
}
