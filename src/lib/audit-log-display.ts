import { format } from "date-fns";

export function formatAuditDate(value: unknown): string {
  if (value == null || value === "") return "—";
  const s = typeof value === "string" ? value : String(value);
  try {
    return format(new Date(s), "MMM d, yyyy HH:mm:ss");
  } catch {
    return s;
  }
}
