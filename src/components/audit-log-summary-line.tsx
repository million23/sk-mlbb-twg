"use client";

import type { AuditLogRow } from "@/hooks/use-audit-log";
import { getAuditLogSummaryParts } from "@/lib/audit-log-summary";
import { cn } from "@/lib/utils";

const codeChip = cn(
  "rounded-md border border-border/70 bg-muted/60 px-1.5 py-0.5 font-mono text-[0.8125rem] leading-snug text-foreground",
);

type Props = {
  row: AuditLogRow;
  adminNameById: ReadonlyMap<string, string>;
  className?: string;
};

export function AuditLogSummaryLine({ row, adminNameById, className }: Props) {
  const p = getAuditLogSummaryParts(row, adminNameById);

  return (
    <span className={cn("text-sm", className)}>
      {p.actor} {p.verbWord}{" "}
      {p.hasRecordId ? (
        <code className={codeChip}>{p.idPart}</code>
      ) : (
        <span className="italic text-muted-foreground">{p.idPart}</span>
      )}{" "}
      in <code className={codeChip}>{p.tablePart}</code>
    </span>
  );
}
