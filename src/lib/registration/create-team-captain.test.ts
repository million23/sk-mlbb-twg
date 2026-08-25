import { describe, expect, it } from "vitest";
import {
	formingTeamCreateFields,
	planCreateTeamCaptainAssign,
} from "./create-team-captain";

describe("formingTeamCreateFields", () => {
	it("puts captain on the forming team create payload when the registrant id exists", () => {
		expect(
			formingTeamCreateFields({
				tournamentId: "tour",
				teamName: "Night Owls",
				captainParticipantId: "p_captain",
			}).captain,
		).toBe("p_captain");
	});

	it("omits captain when the registrant id is not ready yet", () => {
		expect(
			formingTeamCreateFields({
				tournamentId: "tour",
				teamName: "Night Owls",
			}).captain,
		).toBeUndefined();
	});
});

describe("planCreateTeamCaptainAssign", () => {
	it("assigns the first create-team POST as captain when the team has none", () => {
		expect(planCreateTeamCaptainAssign("", "p1")).toBe("p1");
	});

	it("does not let later teammates overwrite captain", () => {
		expect(planCreateTeamCaptainAssign("p1", "p2")).toBe(null);
	});

	it("does nothing without a participant id", () => {
		expect(planCreateTeamCaptainAssign("", "")).toBe(null);
	});
});
