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
  "sticky right-0 z-20 w-[6.75rem] min-w-[6.75rem] border-l border-border bg-background text-left text-xs font-medium text-muted-foreground";
export const AUDIT_LOG_ACTIONS_CELL_CLASS =
  "sticky right-0 z-20 w-[6.75rem] min-w-[6.75rem] border-l border-border bg-background transition-colors group-hover:bg-muted/50";

export function getAuditLogColumns(
  meta: AuditLogTableMeta,
): ColumnDef<AuditLogRow>[] {
  return [
    {
      accessorKey: "table_name",
      header: "Table",
      cell: ({ row }) => (
        <span className="font-mono text-xs">
          {String(row.original.table_name ?? "—")}
        </span>
      ),
    },
    {
      accessorKey: "record_id",
      header: "Record",
      cell: ({ row }) => (
        <span className="break-all font-mono text-xs">
          {String(row.original.record_id ?? "—")}
        </span>
      ),
    },
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
      header: "View",
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
