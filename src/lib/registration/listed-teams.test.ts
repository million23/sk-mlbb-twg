import { describe, expect, it } from "vitest";
import { isJoinableListedTeam } from "./listed-teams";

const baseTeam = {
	id: "team1",
	tournament: "tour",
	name: "Night Owls",
	status: "forming" as const,
	archived: false,
};

describe("isJoinableListedTeam", () => {
	it("hides forming create-team placeholders with only pending preferred links", () => {
		expect(
			isJoinableListedTeam(baseTeam, [
				{
					id: "p1",
					preferred_team: "team1",
					team_intent: "create_team",
					registration_status: "pending",
					status: "unassigned",
				},
			]),
		).toBe(false);
	});

	it("shows forming teams that already have assigned members", () => {
		expect(
			isJoinableListedTeam(baseTeam, [
				{
					id: "p1",
					team: "team1",
					preferred_team: "team1",
					team_intent: "create_team",
					registration_status: "approved",
					status: "assigned",
				},
			]),
		).toBe(true);
	});

	it("shows empty admin-created forming shells", () => {
		expect(isJoinableListedTeam(baseTeam, [])).toBe(true);
	});

	it("shows ready teams regardless of placeholders", () => {
		expect(
			isJoinableListedTeam(
				{ ...baseTeam, status: "ready" },
				[
					{
						id: "p1",
						preferred_team: "team1",
						team_intent: "create_team",
						registration_status: "pending",
						status: "unassigned",
					},
				],
			),
		).toBe(true);
	});
});
