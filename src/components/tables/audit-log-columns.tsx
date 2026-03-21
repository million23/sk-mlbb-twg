"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { AuditLogDetailOpenButton } from "@/components/audit-log-detail-sheet";
import { AuditLogSummaryLine } from "@/components/audit-log-summary-line";
import type { AuditLogRow } from "@/hooks/use-audit-log";
import { formatAuditDate } from "@/lib/audit-log-display";
import { formatAuditLogSummaryLine } from "@/lib/audit-log-summary";

export type AuditLogTableMeta = {
  adminNameById: ReadonlyMap<string, string>;
  onOpenDetail: (row: AuditLogRow) => void;
};

/** Exported for loading skeleton layout to match DataTable columns. */
export const AUDIT_LOG_ACTIONS_HEAD_CLASS =
  "sticky right-0 z-20 w-12 min-w-12 border-l border-border bg-background p-0 text-center";
export const AUDIT_LOG_ACTIONS_CELL_CLASS =
  "sticky right-0 z-20 w-12 min-w-12 border-l border-border bg-background px-1 text-center transition-colors group-hover:bg-muted/50";

export function getAuditLogColumns(
  meta: AuditLogTableMeta,
): ColumnDef<AuditLogRow>[] {
  return [
    {
      id: "summary",
      accessorFn: (r) =>
        formatAuditLogSummaryLine(r, meta.adminNameById),
      header: "Summary",
      cell: ({ row }) => (
        <AuditLogSummaryLine
          row={row.original}
          adminNameById={meta.adminNameById}
        />
      ),
      meta: {
        tdClassName:
          "max-w-[min(28rem,50vw)] whitespace-normal wrap-break-word",
      },
    },
    {
      accessorKey: "updated",
      header: "Updated",
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-xs text-muted-foreground">
          {formatAuditDate(row.original.updated)}
        </span>
      ),
    },
    {
      accessorKey: "created",
      header: "Created",
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-xs text-muted-foreground">
          {formatAuditDate(row.original.created)}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => (
        <span className="sr-only">Details</span>
      ),
      cell: ({ row }) => (
        <AuditLogDetailOpenButton
          row={row.original}
          onOpen={meta.onOpenDetail}
        />
      ),
      enableSorting: false,
      meta: {
        thClassName: AUDIT_LOG_ACTIONS_HEAD_CLASS,
        tdClassName: AUDIT_LOG_ACTIONS_CELL_CLASS,
      },
    },
  ];
}
