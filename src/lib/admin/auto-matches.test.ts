import { describe, expect, it } from "vitest";
import {
	assignTeamsToBrackets,
	autoMatchCreatePayload,
	buildBracketAutoMatchPreview,
	buildPlayoffPreview,
	type AutoMatchTeam,
	type PlayoffAdvancer,
} from "./auto-matches";

function teams(n: number, prefix = "T"): AutoMatchTeam[] {
	return Array.from({ length: n }, (_, i) => ({
		id: `${prefix}${i + 1}`,
		name: `${prefix}${i + 1}`,
	}));
}

describe("assignTeamsToBrackets", () => {
	it("rejects team counts that are not multiples of bracket count", () => {
		expect(assignTeamsToBrackets(teams(15), 4)).toEqual({
			ok: false,
			error: "Need a multiple of 4 teams to fill 4 equal brackets (got 15).",
		});
	});

	it("splits 64 teams into 4 brackets of 16", () => {
		const result = assignTeamsToBrackets(teams(64), 4);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.brackets).toHaveLength(4);
		expect(result.brackets.map((b) => b.teams.length)).toEqual([16, 16, 16, 16]);
		expect(result.brackets.map((b) => b.label)).toEqual([
			"Bracket A",
			"Bracket B",
			"Bracket C",
			"Bracket D",
		]);
		const ids = result.brackets.flatMap((b) => b.teams.map((t) => t.id));
		expect(new Set(ids).size).toBe(64);
	});

	it("splits 16 teams into 2 brackets of 8", () => {
		const result = assignTeamsToBrackets(teams(16), 2);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.brackets).toHaveLength(2);
		expect(result.brackets.map((b) => b.teams.length)).toEqual([8, 8]);
		expect(result.brackets.map((b) => b.label)).toEqual([
			"Bracket A",
			"Bracket B",
		]);
	});
});

describe("buildBracketAutoMatchPreview", () => {
	it("pairs within each bracket and leaves an odd team unpaired", () => {
		// 20 teams → 5 per bracket; one unpaired per bracket
		const preview = buildBracketAutoMatchPreview({
			teams: teams(20),
			bracketCount: 4,
			highestOrder: 0,
			defaultBestOf: 3,
		});
		expect(preview.ok).toBe(true);
		if (!preview.ok) return;
		expect(preview.preview.rows).toHaveLength(8); // 2 pairs × 4 brackets
		expect(preview.preview.leftOut).toHaveLength(4);
		for (const row of preview.preview.rows) {
			expect(row.bracket).toMatch(/^Bracket [A-D]$/);
			const bracketTeams = preview.preview.rows
				.filter((r) => r.bracket === row.bracket)
				.flatMap((r) => [r.teamA.id, r.teamB.id]);
			expect(bracketTeams).toContain(row.teamA.id);
			expect(bracketTeams).toContain(row.teamB.id);
		}
		// No cross-bracket pairing in elimination R1
		const byBracket = new Map<string, Set<string>>();
		for (const row of preview.preview.rows) {
			const set = byBracket.get(row.bracket ?? "") ?? new Set();
			set.add(row.teamA.id);
			set.add(row.teamB.id);
			byBracket.set(row.bracket ?? "", set);
		}
		const allIds = [...byBracket.values()].map((s) => [...s]);
		for (let i = 0; i < allIds.length; i++) {
			for (let j = i + 1; j < allIds.length; j++) {
				const overlap = allIds[i]!.filter((id) => allIds[j]!.includes(id));
				expect(overlap).toEqual([]);
			}
		}
	});

	it("creates 32 Round-1 matches for a full 64-team field", () => {
		const preview = buildBracketAutoMatchPreview({
			teams: teams(64),
			bracketCount: 4,
			highestOrder: 10,
			defaultBestOf: 3,
		});
		expect(preview.ok).toBe(true);
		if (!preview.ok) return;
		expect(preview.preview.rows).toHaveLength(32);
		expect(preview.preview.leftOut).toEqual([]);
		expect(preview.preview.rows[0]?.order).toBe(11);
		expect(preview.preview.rows.every((r) => r.round === "Round 1")).toBe(true);
		expect(preview.preview.rows.every((r) => r.bestOf === 3)).toBe(true);
	});

	it("writes bracket onto create payload rows", () => {
		const preview = buildBracketAutoMatchPreview({
			teams: teams(8),
			bracketCount: 4,
			highestOrder: 0,
		});
		expect(preview.ok).toBe(true);
		if (!preview.ok) return;
		const payload = autoMatchCreatePayload(preview.preview);
		expect(payload).toHaveLength(4);
		expect(payload.every((row) => row.bracket?.startsWith("Bracket "))).toBe(
			true,
		);
		expect(payload.every((row) => row.status === "draft")).toBe(true);
	});
});

describe("buildPlayoffPreview", () => {
	it("pairs 8 advancers with no same-bracket quarterfinal", () => {
		const advancers: PlayoffAdvancer[] = [
			{ team: { id: "A1", name: "A1" }, bracket: "Bracket A" },
			{ team: { id: "A2", name: "A2" }, bracket: "Bracket A" },
			{ team: { id: "B1", name: "B1" }, bracket: "Bracket B" },
			{ team: { id: "B2", name: "B2" }, bracket: "Bracket B" },
			{ team: { id: "C1", name: "C1" }, bracket: "Bracket C" },
			{ team: { id: "C2", name: "C2" }, bracket: "Bracket C" },
			{ team: { id: "D1", name: "D1" }, bracket: "Bracket D" },
			{ team: { id: "D2", name: "D2" }, bracket: "Bracket D" },
		];
		const result = buildPlayoffPreview({
			advancers,
			highestOrder: 0,
			defaultBestOf: 3,
		});
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.preview.rows).toHaveLength(4);
		for (const row of result.preview.rows) {
			const a = advancers.find((x) => x.team.id === row.teamA.id);
			const b = advancers.find((x) => x.team.id === row.teamB.id);
			expect(a?.bracket).toBeTruthy();
			expect(b?.bracket).toBeTruthy();
			expect(a?.bracket).not.toBe(b?.bracket);
		}
		expect(result.preview.rows.every((r) => r.bracket === "Playoffs")).toBe(
			true,
		);
		expect(result.preview.rows.every((r) => r.round === "Quarterfinals")).toBe(
			true,
		);
	});

	it("rejects when fewer than 2 advancers", () => {
		const result = buildPlayoffPreview({
			advancers: [
				{ team: { id: "A1", name: "A1" }, bracket: "Bracket A" },
			],
			highestOrder: 0,
		});
		expect(result.ok).toBe(false);
	});
});
