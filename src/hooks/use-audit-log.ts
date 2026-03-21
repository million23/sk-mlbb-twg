import { useInfiniteQuery } from "@tanstack/react-query";
import { ClientResponseError } from "pocketbase";
import { getCollection } from "@/lib/pocketbase";
import { queryKeys } from "@/lib/query-keys";
import { rateLimited } from "@/lib/rate-limited-api";
import type { Collections } from "@/types/pocketbase-types";

type AuditUserExpand = {
  id?: string;
  name?: string;
  email?: string;
  username?: string;
};

/** PocketBase list rows may include expanded relations when `expand` is requested. */
export type AuditLogRow = Collections["audit_log"] & {
  expand?: {
    created_by?: AuditUserExpand;
    updated_by?: AuditUserExpand;
  };
};

export const AUDIT_LOG_PAGE_SIZE = 40;

export function useAuditLogInfinite(pageSize = AUDIT_LOG_PAGE_SIZE) {
  return useInfiniteQuery({
    queryKey: [...queryKeys.auditLog, "infinite", pageSize] as const,
    queryFn: ({ pageParam }) =>
      rateLimited(async () => {
        const col = getCollection("audit_log");
        const base = { sort: "-updated" as const };
        try {
          return await col.getList(pageParam, pageSize, {
            ...base,
            expand: "created_by,updated_by",
          });
        } catch (e) {
          if (
            e instanceof ClientResponseError &&
            e.status === 400 &&
            typeof e.message === "string" &&
            (e.message.toLowerCase().includes("expand") ||
              e.message.toLowerCase().includes("unknown"))
          ) {
            return col.getList(pageParam, pageSize, base);
          }
          throw e;
        }
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
  });
}
