import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useAuditLogInfinite, type AuditLogRow } from "@/hooks/use-audit-log";
import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { ClientResponseError } from "pocketbase";
import { Loader2, ScrollText, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/app/$id/audit-logs")({
  component: AuditLogsPage,
});

function formatAuditDate(value: string | undefined): string {
  if (!value) return "—";
  try {
    return format(new Date(value), "MMM d, yyyy HH:mm:ss");
  } catch {
    return value;
  }
}

/** View may expose key_field as string, number, or JSON — never assume .trim exists. */
function auditKeyFieldLabel(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "string") return value.trim() || "—";
  return String(value);
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

  const [search, setSearch] = useState("");
  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const hay = [
        r.table_name,
        r.record_id,
        r.key_field != null ? String(r.key_field) : "",
        r.id,
        r.created,
        r.updated,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [rows, search]);

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
            Record activity across linked tables (staff and admins can view).
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
              {isLoading
                ? "…"
                : `${totalItems} entr${totalItems === 1 ? "y" : "ies"}`}
              {!isLoading &&
              totalItems > 0 &&
              rows.length < totalItems ? (
                <span className="text-muted-foreground">
                  {" "}
                  · {rows.length} loaded — scroll the table for more
                </span>
              ) : null}
            </CardDescription>
            {!isLoading && totalItems > 0 && (
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Filter loaded rows (table, id, label, dates)…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            )}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
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
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">Table</TableHead>
                        <TableHead className="whitespace-nowrap">Record</TableHead>
                        <TableHead>Summary</TableHead>
                        <TableHead className="whitespace-nowrap">
                          Updated
                        </TableHead>
                        <TableHead className="whitespace-nowrap">
                          Created
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRows.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="h-24 text-center text-muted-foreground"
                          >
                            No rows match your filter.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredRows.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell className="align-top font-mono text-xs">
                              {r.table_name ?? "—"}
                            </TableCell>
                            <TableCell className="align-top font-mono text-xs">
                              {r.record_id ?? "—"}
                            </TableCell>
                            <TableCell className="align-top text-sm max-w-[min(28rem,50vw)] break-words">
                              {auditKeyFieldLabel(r.key_field)}
                            </TableCell>
                            <TableCell className="align-top whitespace-nowrap text-xs text-muted-foreground">
                              {formatAuditDate(r.updated)}
                            </TableCell>
                            <TableCell className="align-top whitespace-nowrap text-xs text-muted-foreground">
                              {formatAuditDate(r.created)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {(hasNextPage || isFetchingNextPage || isError) && (
                  <div className="flex flex-col items-center gap-3 py-6">
                    {isError && data ? (
                      <>
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
                      </>
                    ) : (
                      <>
                        <div
                          ref={loadMoreRef}
                          className="pointer-events-none h-1 w-full shrink-0"
                          aria-hidden
                        />
                        {isFetchingNextPage ? (
                          <Loader2
                            className="size-6 animate-spin text-muted-foreground"
                            aria-label="Loading more"
                          />
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
    </div>
  );
}
