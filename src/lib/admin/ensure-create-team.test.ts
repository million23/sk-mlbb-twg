import { describe, expect, it } from "vitest";
import {
	createTeamFormationGate,
	nameKey,
	resolveCreateTeamRecord,
} from "./ensure-create-team";

describe("nameKey", () => {
	it("trims and lowercases preferred team names", () => {
		expect(nameKey("  Night Owls ")).toBe("night owls");
	});
});

describe("resolveCreateTeamRecord", () => {
	const teams = [
		{
			id: "t1",
			tournament: "tour",
			name: "Night Owls",
			status: "forming" as const,
			archived: false,
		},
		{
			id: "t2",
			tournament: "tour",
			name: "Other",
			status: "forming" as const,
			archived: false,
		},
	];

	it("prefers preferred_team id from registration", () => {
		expect(resolveCreateTeamRecord(teams, "t1", "night owls")?.id).toBe("t1");
	});

	it("falls back to name match when id missing", () => {
		expect(resolveCreateTeamRecord(teams, "", "night owls")?.id).toBe("t1");
	});

	it("falls back to name when id is stale", () => {
		expect(resolveCreateTeamRecord(teams, "gone", "night owls")?.id).toBe(
			"t1",
		);
	});
});

describe("createTeamFormationGate", () => {
	it("waits while any peer is still pending", () => {
		const gate = createTeamFormationGate([
			{ id: "a", registration_status: "approved", created: "2026-01-01" },
			{ id: "b", registration_status: "pending", created: "2026-01-02" },
		]);
		expect(gate).toEqual({ ready: false, reason: "still_pending" });
	});

	it("is ready when all active peers are approved", () => {
		const gate = createTeamFormationGate([
			{ id: "b", registration_status: "approved", created: "2026-01-02" },
			{ id: "a", registration_status: "approved", created: "2026-01-01" },
			{ id: "c", registration_status: "rejected", created: "2026-01-03" },
		]);
		expect(gate.ready).toBe(true);
		if (!gate.ready) return;
		expect(gate.approved.map((p) => p.id)).toEqual(["a", "b"]);
	});

	it("returns no_approved when only rejected peers remain", () => {
		const gate = createTeamFormationGate([
			{ id: "c", registration_status: "rejected" },
		]);
		expect(gate).toEqual({ ready: false, reason: "no_approved" });
	});
});
