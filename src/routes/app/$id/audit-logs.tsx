import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useInView } from "@/hooks/use-in-view";
import {
  useAuditLogInfinite,
  type AuditLogRow,
} from "@/hooks/use-audit-log";
import { useAdmins } from "@/hooks/use-admins";
import { buildAdminNameByIdMap } from "@/lib/audit-actor-display";
import { canViewAuditLog } from "@/lib/admin-permissions";
import { formatAuditLogSummaryLine } from "@/lib/audit-log-summary";
import { pb } from "@/lib/pocketbase";
import {
  AUDIT_LOG_ACTIONS_CELL_CLASS,
  AUDIT_LOG_ACTIONS_HEAD_CLASS,
  getAuditLogColumns,
} from "@/components/tables/audit-log-columns";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { ClientResponseError } from "pocketbase";
import {
  AuditLogDetailSheet,
} from "@/components/audit-log-detail-sheet";
import { Loader2, ScrollText, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/app/$id/audit-logs")({
  beforeLoad: ({ params }) => {
    if (typeof window === "undefined") return;
    const id = (params as { id?: string }).id;
    if (!id) return;
    if (!canViewAuditLog(pb.authStore.record as { role?: string } | null)) {
      throw redirect({ to: "/app/$id/", params: { id } } as never);
    }
  },
  component: AuditLogsPage,
});

const AUDIT_TABLE = "border-collapse";

const SKELETON_ROW_KEYS = [
  "sk-1",
  "sk-2",
  "sk-3",
  "sk-4",
  "sk-5",
  "sk-6",
  "sk-7",
  "sk-8",
  "sk-9",
  "sk-10",
] as const;

function AuditLogTableSkeleton() {
  return (
    <div className="overflow-x-auto rounded-md border" aria-busy="true">
      <Table className={AUDIT_TABLE}>
        <TableHeader>
          <TableRow>
            <TableHead className="whitespace-nowrap">Table</TableHead>
            <TableHead className="whitespace-nowrap">Record</TableHead>
            <TableHead>Summary</TableHead>
            <TableHead className="whitespace-nowrap">Updated</TableHead>
            <TableHead className="whitespace-nowrap">Created</TableHead>
            <TableHead className={AUDIT_LOG_ACTIONS_HEAD_CLASS}>
              View
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {SKELETON_ROW_KEYS.map((rowKey) => (
            <TableRow key={rowKey}>
              <TableCell className="align-middle">
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell className="align-middle">
                <Skeleton className="h-4 w-28" />
              </TableCell>
              <TableCell className="align-middle max-w-[min(28rem,50vw)]">
                <Skeleton className="h-4 w-full max-w-64" />
              </TableCell>
              <TableCell className="align-middle">
                <Skeleton className="h-4 w-36" />
              </TableCell>
              <TableCell className="align-middle">
                <Skeleton className="h-4 w-36" />
              </TableCell>
              <TableCell className={AUDIT_LOG_ACTIONS_CELL_CLASS}>
                <Skeleton className="mx-auto h-8 w-full max-w-22 rounded-md" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function AuditLogsPage() {
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    error,
    refetch,
  } = useAuditLogInfinite();

  const { data: admins } = useAdmins();
  const adminNameById = useMemo(
    () => buildAdminNameByIdMap(admins),
    [admins],
  );

  const [search, setSearch] = useState("");
  const [detailRow, setDetailRow] = useState<AuditLogRow | null>(null);

  const columns = useMemo(
    () =>
      getAuditLogColumns({
        adminNameById,
        onOpenDetail: setDetailRow,
      }),
    [adminNameById],
  );

  const rows = useMemo(
    () => data?.pages.flatMap((p) => p.items as AuditLogRow[]) ?? [],
    [data],
  );

  const totalItems = data?.pages[0]?.totalItems ?? 0;

  const { ref: loadMoreRef, inView } = useInView({
    enabled: Boolean(hasNextPage),
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const row = r as AuditLogRow;
      const hay = [
        r.table_name,
        r.record_id,
        r.key_field != null ? String(r.key_field) : "",
        r.id,
        r.created,
        r.updated,
        formatAuditLogSummaryLine(row, adminNameById),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [rows, search, adminNameById]);

  const errMsg =
    error instanceof ClientResponseError
      ? (error.response?.message as string) || error.message
      : error instanceof Error
        ? error.message
        : String(error);

  const collectionMissing =
    isError &&
    (errMsg.toLowerCase().includes("collection") ||
      errMsg.toLowerCase().includes("wasn't found") ||
      (error instanceof ClientResponseError && error.status === 404));

  const initialQueryFailed = isError && !data;
  const loadMoreErrorMessage = errMsg;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">Audit log</h1>
          <p className="text-muted-foreground">
            Each summary line describes who changed what. Open an entry for full
            details and related records.
          </p>
        </div>
      </div>

      {collectionMissing ? (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-base text-destructive">
              Audit log unavailable
            </CardTitle>
            <CardDescription>
              The <code className="text-xs">audit_log</code> view is missing or
              not exposed to your account. See{" "}
              <code className="text-xs">POCKETBASE_TABLES.md</code> for the view
              definition.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Activity</CardTitle>
            <CardDescription>
              {isLoading ? (
                <span className="inline-flex items-center gap-2 text-muted-foreground">
                  <Loader2
                    className="size-4 shrink-0 animate-spin text-primary"
                    aria-hidden
                  />
                  Fetching activity log…
                </span>
              ) : (
                <>
                  {`${totalItems} entr${totalItems === 1 ? "y" : "ies"}`}
                  {totalItems > 0 && rows.length < totalItems ? (
                    <span className="text-muted-foreground">
                      {" "}
                      · {rows.length} loaded — scroll the table for more
                    </span>
                  ) : null}
                </>
              )}
            </CardDescription>
            {isLoading ? (
              <div className="relative mt-2" aria-hidden>
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            ) : totalItems > 0 ? (
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Filter (table, record, summary, who, dates)…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            ) : null}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <AuditLogTableSkeleton />
            ) : initialQueryFailed ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <p className="text-center text-sm text-destructive">{errMsg}</p>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => void refetch()}
                >
                  Retry
                </Button>
              </div>
            ) : totalItems === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
                <ScrollText className="size-10 opacity-50" />
                <p className="text-sm">No audit entries yet.</p>
              </div>
            ) : (
              <>
                <DataTable
                  columns={columns}
                  data={filteredRows}
                  showPagination={false}
                  emptyMessage="No rows match your filter."
                  tableClassName={AUDIT_TABLE}
                  tableRowClassName="group"
                  tableWrapperClassName="overflow-x-auto"
                />

                {(hasNextPage || isFetchingNextPage || isError) && (
                  <div className="flex flex-col gap-0">
                    {isError && data ? (
                      <div className="flex flex-col items-center gap-3 border-t py-6">
                        <p className="text-center text-sm text-destructive">
                          {loadMoreErrorMessage}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          type="button"
                          onClick={() => void refetch()}
                        >
                          Try again
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div
                          ref={loadMoreRef}
                          className="pointer-events-none h-1 w-full shrink-0"
                          aria-hidden
                        />
                        {isFetchingNextPage ? (
                          <p
                            aria-live="polite"
                            className="flex items-center justify-center gap-2.5 border-t bg-muted/30 py-4 text-sm text-muted-foreground"
                          >
                            <Loader2
                              className="size-4 shrink-0 animate-spin text-primary"
                              aria-hidden
                            />
                            <span>Loading more entries…</span>
                          </p>
                        ) : null}
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      <AuditLogDetailSheet
        open={detailRow != null}
        onOpenChange={(next) => {
          if (!next) setDetailRow(null);
        }}
        row={detailRow}
        adminNameById={adminNameById}
      />
    </div>
  );
}
