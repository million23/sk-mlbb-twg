import { describe, expect, it } from "vitest";
import {
	formatPreferredLaneLabels,
	preferredLanesList,
} from "./lane-role-icons";

describe("preferredLanesList", () => {
	it("does not treat a PocketBase string as an array (production w.map crash)", () => {
		const raw: string = "mid";
		// The verify page used to guard with `lanes && lanes.length` then `lanes.map`.
		// Strings pass that guard; .map is not a function.
		expect(Array.isArray(raw)).toBe(false);
		expect(raw.length).toBeGreaterThan(0);
		expect(preferredLanesList(raw)).toEqual(["mid"]);
		expect(preferredLanesList("mid,gold")).toEqual(["mid", "gold"]);
		expect(preferredLanesList(["exp", "support"])).toEqual(["exp", "support"]);
		expect(preferredLanesList("")).toEqual([]);
		expect(preferredLanesList(undefined)).toEqual([]);
	});
});

describe("formatPreferredLaneLabels", () => {
	it("labels a comma-joined receipt string", () => {
		expect(formatPreferredLaneLabels("mid")).toBe("Middle Lane");
		expect(formatPreferredLaneLabels("mid,jungle")).toBe(
			"Middle Lane, Jungler",
		);
	});
});
