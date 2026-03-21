import { useInfiniteQuery } from "@tanstack/react-query";
import { getCollection } from "@/lib/pocketbase";
import { queryKeys } from "@/lib/query-keys";
import { rateLimited } from "@/lib/rate-limited-api";
import type { Collections } from "@/types/pocketbase-types";

export type AuditLogRow = Collections["audit_log"];

export const AUDIT_LOG_PAGE_SIZE = 40;

export function useAuditLogInfinite(pageSize = AUDIT_LOG_PAGE_SIZE) {
  return useInfiniteQuery({
    queryKey: [...queryKeys.auditLog, "infinite", pageSize] as const,
    queryFn: ({ pageParam }) =>
      rateLimited(async () => {
        const col = getCollection("audit_log");
        return col.getList(pageParam, pageSize, { sort: "-updated" });
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
  });
}
