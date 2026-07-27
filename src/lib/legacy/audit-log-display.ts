import { format, isValid } from "date-fns";
import { enUS } from "date-fns/locale";

export function formatAuditDate(value: unknown): string {
  if (value == null || value === "") return "—";
  const s = typeof value === "string" ? value : String(value);
  const date = new Date(s);
  if (!isValid(date)) return s;
  return format(date, "MMMM dd, yyyy - hh:mm a", { locale: enUS });
}
