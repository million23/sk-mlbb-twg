import { AuditLogSummaryLine } from "@/components/audit-log-summary-line";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { FxAuditDetailRelated } from "@/lib/loading-placeholders";
import type { AuditLogRow } from "@/hooks/use-audit-log";
import { queryKeys } from "@/lib/query-keys";
import { pb } from "@/lib/pocketbase";
import { rateLimited } from "@/lib/rate-limited-api";
import { cn } from "@/lib/utils";
import { formatAuditActor } from "@/lib/audit-actor-display";
import { formatAuditDate } from "@/lib/audit-log-display";
import { useQuery } from "@tanstack/react-query";
import { ClientResponseError } from "pocketbase";
import { PanelRight } from "lucide-react";
import { useMemo, type ReactNode } from "react";

/**
 * Audit detail UI: use one `AuditLogDetailSheet` per route (controlled by `open` + `row`).
 * Avoid embedding additional `Sheet`/`Dialog` instances inside table rows.
 */

/** Base collections that can be loaded by id from the audit log row. */
const FETCHABLE_BY_TABLE = new Set([
  "participants",
  "teams",
  "tournaments",
  "matches",
  "match_drafts",
  "tournament_drafts",
  "admins",
]);

function asNonEmptyString(value: unknown): string | null {
  if (value == null) return null;
  const s = typeof value === "string" ? value : String(value);
  const t = s.trim();
  return t.length ? t : null;
}

export function resolveFetchableAuditCollection(
  tableName: unknown,
): string | null {
  const s = asNonEmptyString(tableName);
  if (!s) return null;
  const key = s.toLowerCase();
  return FETCHABLE_BY_TABLE.has(key) ? key : null;
}

export function resolveAuditRecordId(recordId: unknown): string | null {
  return asNonEmptyString(recordId);
}

function AuditDetailField({
  label,
  children,
  mono,
  className,
}: {
  label: string;
  children: ReactNode;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "text-sm wrap-break-word",
          mono && "font-mono text-xs",
        )}
      >
        {children}
      </dd>
    </div>
  );
}

function RelatedRecordBlock(props: {
  collection: string | null;
  recordId: string | null;
  /** When false, skip network fetch (e.g. sheet closed — singleton sheet stays mounted). */
  fetchEnabled: boolean;
}) {
  const { collection, recordId, fetchEnabled } = props;
  const canFetch = Boolean(collection && recordId);
  const enabled = fetchEnabled && canFetch;

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey:
      collection && recordId
        ? queryKeys.auditRelatedRecord(collection, recordId)
        : (["audit_related_record", "idle"] as const),
    queryFn: () =>
      rateLimited(() =>
        pb.collection(collection as string).getOne(recordId as string),
      ),
    enabled,
  });

  const json = useMemo(() => {
    if (!data) return "";
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  }, [data]);

  const errMsg =
    error instanceof ClientResponseError
      ? (error.response?.message as string) || error.message
      : error instanceof Error
        ? error.message
        : String(error);

  if (!fetchEnabled) {
    return null;
  }

  if (!canFetch) {
    return (
      <p className="text-sm text-muted-foreground">
        This table isn&apos;t available for a live record preview. Use the
        table and record id above in PocketBase if needed.
      </p>
    );
  }

  if (isLoading || isFetching) {
    return (
      <Skeleton
        role="status"
        className="block bg-transparent p-0 shadow-none ring-0"
      >
        <FxAuditDetailRelated />
        <span className="sr-only">Loading related record</span>
      </Skeleton>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-destructive">{errMsg}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() => void refetch()}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-0 max-h-[min(50vh,28rem)] overflow-auto rounded-md border border-border bg-muted/30">
      <pre className="block p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap wrap-anywhere">
        {json}
      </pre>
    </div>
  );
}

export function AuditLogDetailOpenButton(props: {
  row: AuditLogRow;
  onOpen: (row: AuditLogRow) => void;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        "size-8 shrink-0 font-normal",
        "text-muted-foreground hover:bg-muted hover:text-foreground",
        props.className,
      )}
      title="View details"
      aria-label="View audit entry details"
      onClick={() => props.onOpen(props.row)}
    >
      <PanelRight className="size-4 opacity-90" />
    </Button>
  );
}

export function AuditLogDetailSheet(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: AuditLogRow | null;
  adminNameById: ReadonlyMap<string, string>;
}) {
  const { open, onOpenChange, row, adminNameById } = props;

  const r = row as AuditLogRow | undefined;
  const collection = r
    ? resolveFetchableAuditCollection(r.table_name)
    : null;
  const recordId = r ? resolveAuditRecordId(r.record_id) : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton
        className="flex w-full max-w-none flex-col gap-0 border-l p-0 sm:max-w-xl! md:max-w-2xl!"
      >
        <SheetHeader className="shrink-0 border-b px-4 py-4 text-left sm:px-6">
          <SheetTitle>Audit entry</SheetTitle>
          <SheetDescription className="font-mono text-xs wrap-break-word">
            {r?.id ? `Entry ${r.id}` : "—"}
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-6">
            <section>
              <h3 className="mb-3 text-sm font-medium">Log row</h3>
              <dl className="grid gap-4 sm:grid-cols-2">
                <AuditDetailField label="Table" mono>
                  {String(r?.table_name ?? "—")}
                </AuditDetailField>
                <AuditDetailField label="Record id" mono>
                  {String(r?.record_id ?? "—")}
                </AuditDetailField>
                <AuditDetailField label="Summary" className="sm:col-span-2">
                  {r ? (
                    <AuditLogSummaryLine row={r} adminNameById={adminNameById} />
                  ) : (
                    "—"
                  )}
                </AuditDetailField>
                <AuditDetailField label="Created by">
                  {r
                    ? formatAuditActor(
                        r.created_by,
                        r.expand?.created_by,
                        adminNameById,
                      )
                    : "—"}
                </AuditDetailField>
                <AuditDetailField label="Edited by">
                  {r
                    ? formatAuditActor(
                        r.updated_by,
                        r.expand?.updated_by,
                        adminNameById,
                      )
                    : "—"}
                </AuditDetailField>
                <AuditDetailField label="Updated (log row)">
                  {formatAuditDate(r?.updated)}
                </AuditDetailField>
                <AuditDetailField label="Created (log row)">
                  {formatAuditDate(r?.created)}
                </AuditDetailField>
              </dl>
            </section>

            <section className="min-w-0 border-t pt-6">
              <h3 className="mb-2 text-sm font-medium">Related record</h3>
              <p className="mb-3 font-mono text-xs text-muted-foreground wrap-break-word">
                {collection && recordId ? (
                  <>
                    <span>{collection}</span>
                    <span> · </span>
                    <span>{recordId}</span>
                  </>
                ) : (
                  "—"
                )}
              </p>
              <RelatedRecordBlock
                collection={collection}
                recordId={recordId}
                fetchEnabled={open}
              />
            </section>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
