import { isValid, parseISO } from "date-fns";
import { normalizePbDateString } from "@/lib/registered-date";
import * as XLSX from "xlsx";

const SHEET_NAME_MAX = 31;

/** How each column is stored for Excel / Sheets / LibreOffice compatibility */
export type SpreadsheetColumnType = "text" | "number" | "date";

export type SpreadsheetColumn<T> = {
	/** First-row header (stable column name for imports) */
	header: string;
	/** Approximate character width (Excel `wch`) */
	widthChars: number;
	type: SpreadsheetColumnType;
	/** Raw value; empty exports as blank cell */
	get: (row: T) => unknown;
};

export type DownloadStructuredSpreadsheetOptions<T> = {
	fileBasename: string;
	sheetName: string;
	/** File → Properties → Title in Excel */
	workbookTitle?: string;
	columns: SpreadsheetColumn<T>[];
	rows: T[];
	/** Shown in column A when `rows` is empty (headers still exported) */
	emptyMessage?: string;
};

function sanitizeSheetName(name: string): string {
	const cleaned = name.replace(/[/\\?*[\]:]/g, "_").slice(0, SHEET_NAME_MAX);
	return cleaned || "Sheet1";
}

function sanitizeFileBasename(basename: string): string {
	return basename.replace(/[/\\?*[\]:]/g, "_").trim() || "export";
}

function fileTimestamp(): string {
	return new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
}

function parseToDate(value: unknown): Date | null {
	if (value == null || value === "") return null;
	if (value instanceof Date && isValid(value)) return value;
	const s = String(value).trim();
	if (!s) return null;
	const d = parseISO(normalizePbDateString(s));
	return isValid(d) ? d : null;
}

function cellValueForColumn(
	type: SpreadsheetColumnType,
	raw: unknown,
): string | number | Date {
	if (raw == null || raw === "") return "";
	switch (type) {
		case "text":
			return String(raw);
		case "number": {
			const n =
				typeof raw === "number"
					? raw
					: Number(String(raw).replace(/,/g, ""));
			return Number.isFinite(n) ? n : "";
		}
		case "date": {
			const d = parseToDate(raw);
			return d ?? "";
		}
		default:
			return String(raw);
	}
}

/**
 * Build a worksheet with:
 * - Explicit header row (row 1) and stable column order
 * - Column widths (`!cols`)
 * - Typed cells (numbers, dates as Excel serials / date type on write)
 * - Date display format `yyyy-mm-dd` (locale-neutral)
 * - AutoFilter over the data range
 * - Slightly taller header row (`!rows`)
 */
export function buildStructuredWorksheet<T>(
	columns: SpreadsheetColumn<T>[],
	rows: T[],
	options: { emptyMessage?: string } = {},
): XLSX.WorkSheet {
	const { emptyMessage = "No data to export" } = options;
	const headers = columns.map((c) => c.header);

	const dataRows: (string | number | Date)[][] =
		rows.length > 0
			? rows.map((row) =>
					columns.map((col) => cellValueForColumn(col.type, col.get(row))),
				)
			: [
					[
						emptyMessage,
						...Array(Math.max(0, columns.length - 1)).fill(""),
					],
				];

	const aoa: (string | number | Date)[][] = [headers, ...dataRows];
	const ws = XLSX.utils.aoa_to_sheet(aoa);

	ws["!cols"] = columns.map((c) => ({ wch: c.widthChars }));

	const ref = ws["!ref"];
	if (ref) {
		const range = XLSX.utils.decode_range(ref);
		const dateFmt = "yyyy-mm-dd";
		for (let c = range.s.c; c <= range.e.c; c++) {
			const col = columns[c];
			if (!col || col.type !== "date") continue;
			for (let r = 1; r <= range.e.r; r++) {
				const addr = XLSX.utils.encode_cell({ r, c });
				const cell = ws[addr];
				if (!cell || cell.v == null || cell.v === "") continue;
				cell.z = dateFmt;
			}
		}
		for (let c = range.s.c; c <= range.e.c; c++) {
			const col = columns[c];
			if (!col || col.type !== "number") continue;
			for (let r = 1; r <= range.e.r; r++) {
				const addr = XLSX.utils.encode_cell({ r, c });
				const cell = ws[addr];
				if (!cell || cell.v == null || cell.v === "") continue;
				if (cell.t === "n") cell.z = "0";
			}
		}

		ws["!autofilter"] = { ref };

		ws["!rows"] = [{ hpt: 22 }];
	}

	return ws;
}

export function downloadStructuredSpreadsheet<T>(
	opts: DownloadStructuredSpreadsheetOptions<T>,
): void {
	const {
		fileBasename,
		sheetName,
		workbookTitle,
		columns,
		rows,
		emptyMessage,
	} = opts;

	const ws = buildStructuredWorksheet(columns, rows, { emptyMessage });
	const wb = XLSX.utils.book_new();
	wb.Props = {
		Title: workbookTitle ?? sheetName,
		Subject: "Tournament data export",
		Author: "SK MLBB TWG",
		CreatedDate: new Date(),
	};
	XLSX.utils.book_append_sheet(wb, ws, sanitizeSheetName(sheetName));

	const name = sanitizeFileBasename(fileBasename);
	const filename = `${name}-${fileTimestamp()}.xlsx`;

	XLSX.writeFile(wb, filename, {
		bookType: "xlsx",
		compression: true,
		cellDates: true,
	});
}
