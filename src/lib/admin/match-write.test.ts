import { describe, expect, it } from "vitest";
import { fromMatchApiRecord, toMatchWritePayload } from "./match-write";

describe("toMatchWritePayload", () => {
	it("maps camelCase create fields to PocketBase snake_case", () => {
		expect(
			toMatchWritePayload(
				{
					tournament: "t1",
					teamA: "a1",
					teamB: "b1",
					round: "Round 1",
					order: 2,
					bestOf: 3,
					status: "draft",
					matchLabel: "A vs B",
					bracket: "Bracket A",
				},
				"create",
			),
		).toEqual({
			tournament: "t1",
			team_a: "a1",
			team_b: "b1",
			round: "Round 1",
			order: 2,
			best_of: 3,
			status: "draft",
			match_label: "A vs B",
			bracket: "Bracket A",
			archived: false,
		});
	});

	it("fills required archived and best_of on create when omitted", () => {
		expect(toMatchWritePayload({ tournament: "t1" }, "create")).toEqual({
			tournament: "t1",
			archived: false,
			best_of: 3,
		});
	});

	it("does not invent archived or best_of on update", () => {
		expect(
			toMatchWritePayload({ status: "scheduled" }, "update"),
		).toEqual({ status: "scheduled" });
	});
});

describe("fromMatchApiRecord", () => {
	it("copies snake_case team fields onto camelCase for the UI", () => {
		const row = fromMatchApiRecord({
			id: "m1",
			team_a: "a1",
			team_b: "b1",
			match_label: "Alpha vs Beta",
			best_of: 3,
			expand: {
				team_a: { id: "a1", name: "Alpha" },
				team_b: { id: "b1", name: "Beta" },
			},
		});
		expect(row.teamA).toBe("a1");
		expect(row.teamB).toBe("b1");
		expect(row.matchLabel).toBe("Alpha vs Beta");
		expect(row.bestOf).toBe(3);
		expect(row.expand?.teamA?.name).toBe("Alpha");
		expect(row.expand?.teamB?.name).toBe("Beta");
	});
});
