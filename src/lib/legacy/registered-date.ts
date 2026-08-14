import { format, isValid, parseISO } from "date-fns";

/**
 * PocketBase often returns `YYYY-MM-DD HH:mm:ss.sssZ` (space) instead of `T`.
 * date-fns `parseISO` requires the `T` form for datetimes.
 */
export function normalizePbDateString(raw: string): string {
	const s = raw.trim();
	if (!s) return s;
	if (s.includes("T")) return s;
	if (/^\d{4}-\d{2}-\d{2}\s+\S/.test(s)) {
		return s.replace(/^(\d{4}-\d{2}-\d{2})\s+/, "$1T");
	}
	return `${s}T12:00:00`;
}

/** Calendar day prefix from date-only, ISO, or PocketBase DateTime. */
export function calendarDayFromPbDate(raw: string | undefined): string {
	if (!raw?.trim()) return "";
	const m = /^(\d{4}-\d{2}-\d{2})/.exec(raw.trim());
	return m?.[1] ?? "";
}

/**
 * PocketBase DateTime write format: `YYYY-MM-DD HH:mm:ss.SSSZ` (UTC).
 * Calendar dates (birthdates) are stored at midnight UTC.
 *
 * @see https://pocketbase.io/jsvm/interfaces/types.DateTime.html
 */
export function toPocketBaseDateTime(raw: string | undefined): string {
	const day = calendarDayFromPbDate(raw);
	if (!day) return raw?.trim() ?? "";
	return `${day} 00:00:00.000Z`;
}

function parseRegisteredInstant(created: string): Date | null {
	const d = parseISO(normalizePbDateString(created));
	return isValid(d) ? d : null;
}

/** Full instant in UTC for `<time dateTime>` and APIs. */
export function toRegisteredInstantIso(
	created: string | undefined,
): string | undefined {
	if (!created) return undefined;
	const d = parseRegisteredInstant(created);
	return d ? d.toISOString() : undefined;
}

/** PocketBase `created` / ISO string → ms for sorting (0 if missing/invalid). */
export function registeredAtMs(created: string | undefined): number {
	if (!created) return 0;
	const d = parseRegisteredInstant(created);
	return d ? d.getTime() : 0;
}

/** Newest registration first. */
export function compareRegisteredDesc(
	a: { created?: string },
	b: { created?: string },
): number {
	return registeredAtMs(b.created) - registeredAtMs(a.created);
}

/** UI label: registration date from record `created` (calendar date only). */
export function formatRegisteredDate(created: string | undefined): string {
	if (!created) return "—";
	const d = parseRegisteredInstant(created);
	if (!d) return "—";
	return format(d, "MMM d, yyyy - hh:mm a");
}
