import { describe, expect, it } from "vitest";
import {
	nextOpenMatchName,
	openMatchingPool,
	planAutoOpenTeams,
	type OpenMatchingCandidate,
} from "./auto-open-teams";

const LANES = ["mid", "gold", "exp", "support", "jungle"] as const;

function laneSquad(
	prefix: string,
	start = 0,
): OpenMatchingCandidate[] {
	return LANES.map((lane, i) => ({
		id: `${prefix}${start + i}`,
		team_intent: "open_matching",
		registration_status: "approved",
		team: "",
		status: "unassigned",
		preferred_lane: lane,
		preferred_roles: [lane],
	}));
}

describe("openMatchingPool", () => {
	it("keeps only approved open-matching unassigned players", () => {
		const pool = openMatchingPool([
			{
				id: "a",
				team_intent: "open_matching",
				registration_status: "approved",
				team: "",
			},
			{
				id: "b",
				team_intent: "join_team",
				registration_status: "approved",
				team: "",
			},
			{
				id: "c",
				team_intent: "open_matching",
				registration_status: "pending",
				team: "",
			},
			{
				id: "d",
				team_intent: "open_matching",
				registration_status: "approved",
				team: "t1",
			},
			{
				id: "e",
				team_intent: "open_matching",
				registration_status: "approved",
				team: "",
				status: "inactive",
			},
		]);
		expect(pool.map((p) => p.id)).toEqual(["a"]);
	});
});

describe("nextOpenMatchName", () => {
	it("skips names already in use", () => {
		const used = new Set(["open match 1", "open match 2"]);
		expect(nextOpenMatchName(used).name).toBe("Open Match 3");
	});
});

describe("planAutoOpenTeams", () => {
	it("returns empty plan for empty pool", () => {
		expect(planAutoOpenTeams([], { shuffle: false })).toEqual({
			teams: [],
			leftoverIds: [],
		});
	});

	it("leaves fewer than 5 as leftovers", () => {
		const pool = laneSquad("p").slice(0, 4);
		const plan = planAutoOpenTeams(pool, { shuffle: false });
		expect(plan.teams).toEqual([]);
		expect(plan.leftoverIds.sort()).toEqual(["p0", "p1", "p2", "p3"]);
	});

	it("forms one Open Match team from a full lane cover", () => {
		const pool = laneSquad("p");
		const plan = planAutoOpenTeams(pool, { shuffle: false });
		expect(plan.teams).toHaveLength(1);
		expect(plan.teams[0]?.name).toBe("Open Match 1");
		expect(plan.teams[0]?.memberIds).toHaveLength(5);
		expect(plan.teams[0]?.captainId).toBe(plan.teams[0]?.memberIds[0]);
		expect(plan.leftoverIds).toEqual([]);
	});

	it("packs multiple squads and leaves remainder", () => {
		const pool = [...laneSquad("a"), ...laneSquad("b"), ...laneSquad("c").slice(0, 2)];
		const plan = planAutoOpenTeams(pool, { shuffle: false });
		expect(plan.teams).toHaveLength(2);
		expect(plan.teams.map((t) => t.name)).toEqual([
			"Open Match 1",
			"Open Match 2",
		]);
		const assigned = new Set(plan.teams.flatMap((t) => t.memberIds));
		expect(assigned.size).toBe(10);
		expect(plan.leftoverIds).toHaveLength(2);
		for (const id of plan.leftoverIds) {
			expect(assigned.has(id)).toBe(false);
		}
	});

	it("avoids colliding with existing team names", () => {
		const pool = laneSquad("p");
		const plan = planAutoOpenTeams(pool, {
			shuffle: false,
			existingTeamNames: ["Open Match 1", "open match 2"],
		});
		expect(plan.teams[0]?.name).toBe("Open Match 3");
	});
});
