import { describe, expect, it } from "vitest";
import {
	createTeamFormationGate,
	nameKey,
	planJoinTeamAssign,
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

describe("planJoinTeamAssign", () => {
	it("proceeds for join_team with preferred_team", () => {
		expect(
			planJoinTeamAssign({
				team_intent: "join_team",
				id: "p1",
				preferred_team: "team_sample",
				team: "",
				status: "unassigned",
			}),
		).toEqual({
			proceed: true,
			participantId: "p1",
			teamId: "team_sample",
		});
	});

	it("skips open_matching", () => {
		expect(
			planJoinTeamAssign({
				team_intent: "open_matching",
				id: "p1",
				preferred_team: "team_sample",
			}),
		).toEqual({ assigned: false, reason: "not_join_team" });
	});

	it("requires preferred_team", () => {
		expect(
			planJoinTeamAssign({
				team_intent: "join_team",
				id: "p1",
				preferred_team: "",
			}),
		).toEqual({ assigned: false, reason: "missing_team" });
	});

	it("no-ops when already on preferred team", () => {
		expect(
			planJoinTeamAssign({
				team_intent: "join_team",
				id: "p1",
				preferred_team: "team_sample",
				team: "team_sample",
				status: "assigned",
			}),
		).toEqual({
			assigned: true,
			teamId: "team_sample",
			teamName: "",
			alreadyAssigned: true,
		});
	});
});
