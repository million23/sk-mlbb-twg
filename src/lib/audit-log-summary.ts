import type { AuditLogRow } from "@/hooks/use-audit-log";
import { formatAuditActor } from "@/lib/audit-actor-display";

const SAME_MOMENT_MS = 2500;

function parseTime(value: unknown): number | null {
  if (value == null || value === "") return null;
  const s = typeof value === "string" ? value : String(value);
  const t = Date.parse(s);
  return Number.isNaN(t) ? null : t;
}

function inferVerb(
  row: AuditLogRow,
  hasRecordId: boolean,
): "added" | "modified" | "removed" {
  if (!hasRecordId) return "removed";

  const c = parseTime(row.created);
  const u = parseTime(row.updated);
  if (c == null || u == null) return "modified";
  if (Math.abs(u - c) <= SAME_MOMENT_MS) return "added";
  return "modified";
}

function resolveActor(
  row: AuditLogRow,
  adminNameById: ReadonlyMap<string, string>,
  verb: "added" | "modified" | "removed",
): string {
  if (verb === "added") {
    const byCreated = formatAuditActor(
      row.created_by,
      row.expand?.created_by,
      adminNameById,
    );
    if (byCreated !== "—") return byCreated;
    return formatAuditActor(
      row.updated_by,
      row.expand?.updated_by,
      adminNameById,
    );
  }
  const byUpdated = formatAuditActor(
    row.updated_by,
    row.expand?.updated_by,
    adminNameById,
  );
  if (byUpdated !== "—") return byUpdated;
  return formatAuditActor(
    row.created_by,
    row.expand?.created_by,
    adminNameById,
  );
}

function formatTableName(raw: unknown): string {
  const s = raw == null ? "" : String(raw).trim();
  if (!s) return "—";
  return s.replace(/_/g, " ");
}

export type AuditLogSummaryParts = {
  actor: string;
  verbWord: string;
  idPart: string;
  tablePart: string;
  hasRecordId: boolean;
};

/**
 * Parsed summary: `<someone> <added|modified|removed> <record id> in <table name>`
 * (no backend `key_field`; verb is inferred from timestamps / missing record id).
 */
export function getAuditLogSummaryParts(
  row: AuditLogRow,
  adminNameById: ReadonlyMap<string, string>,
): AuditLogSummaryParts {
  const recordRaw = row.record_id;
  const hasRecordId =
    recordRaw != null && String(recordRaw).trim().length > 0;
  const recordId = hasRecordId ? String(recordRaw).trim() : "";

  const verb = inferVerb(row, hasRecordId);
  let actor = resolveActor(row, adminNameById, verb);
  if (actor === "—") actor = "Someone";

  const verbWord =
    verb === "added" ? "added" : verb === "removed" ? "removed" : "modified";

  const idPart = hasRecordId ? recordId : "a record";
  const tablePart = formatTableName(row.table_name);

  return { actor, verbWord, idPart, tablePart, hasRecordId };
}

/** Plain string for search / accessor (no markup). */
export function formatAuditLogSummaryLine(
  row: AuditLogRow,
  adminNameById: ReadonlyMap<string, string>,
): string {
  const p = getAuditLogSummaryParts(row, adminNameById);
  return `${p.actor} ${p.verbWord} ${p.idPart} in ${p.tablePart}`;
}
