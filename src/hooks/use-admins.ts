import { useQuery } from "@tanstack/react-query";
import { getCollection } from "@/lib/pocketbase";
import { rateLimited } from "@/lib/rate-limited-api";
import { queryKeys } from "@/lib/query-keys";

export function useAdmins() {
  return useQuery({
    queryKey: queryKeys.admins,
    queryFn: () =>
      rateLimited(async () => {
        const col = getCollection("admins");
        return col.getFullList({ sort: "-created" });
      }),
  });
}
