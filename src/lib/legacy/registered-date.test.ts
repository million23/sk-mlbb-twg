import { describe, expect, it } from "vitest";
import {
	calendarDayFromPbDate,
	toPocketBaseDateTime,
} from "./registered-date";

describe("calendarDayFromPbDate", () => {
	it("extracts YYYY-MM-DD from date-only, ISO, and PocketBase DateTime", () => {
		expect(calendarDayFromPbDate("2008-01-15")).toBe("2008-01-15");
		expect(calendarDayFromPbDate("2008-01-15T12:30:00.000Z")).toBe(
			"2008-01-15",
		);
		expect(calendarDayFromPbDate("2008-01-15 00:00:00.000Z")).toBe(
			"2008-01-15",
		);
	});

	it("returns empty for missing or invalid values", () => {
		expect(calendarDayFromPbDate("")).toBe("");
		expect(calendarDayFromPbDate(undefined)).toBe("");
		expect(calendarDayFromPbDate("not-a-date")).toBe("");
	});
});

describe("toPocketBaseDateTime", () => {
	it("writes UTC midnight in PocketBase DateTime format", () => {
		expect(toPocketBaseDateTime("2008-01-15")).toBe(
			"2008-01-15 00:00:00.000Z",
		);
		expect(toPocketBaseDateTime("2008-01-15T12:30:00.000Z")).toBe(
			"2008-01-15 00:00:00.000Z",
		);
		expect(toPocketBaseDateTime("2008-01-15 00:00:00.000Z")).toBe(
			"2008-01-15 00:00:00.000Z",
		);
	});

	it("returns empty for missing values", () => {
		expect(toPocketBaseDateTime("")).toBe("");
		expect(toPocketBaseDateTime(undefined)).toBe("");
	});
});
