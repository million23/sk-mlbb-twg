import { describe, expect, it } from "vitest";
import {
	buildAdvanceRoundPreview,
	findAdvanceSourceRound,
	suggestNextRoundName,
	type BracketMatchInput,
} from "./bracket-rounds";

function match(partial: BracketMatchInput): BracketMatchInput {
	return {
		status: "completed",
		...partial,
	};
}

function completedRound1BracketA(): BracketMatchInput[] {
	// 4 matches → 4 winners in Bracket A
	return [
		match({
			bracket: "Bracket A",
			round: "Round 1",
			teamA: "a1",
			teamB: "a2",
			winner: "a1",
			teamAName: "A1",
			teamBName: "A2",
			winnerName: "A1",
		}),
		match({
			bracket: "Bracket A",
			round: "Round 1",
			teamA: "a3",
			teamB: "a4",
			winner: "a3",
			teamAName: "A3",
			teamBName: "A4",
			winnerName: "A3",
		}),
		match({
			bracket: "Bracket A",
			round: "Round 1",
			teamA: "a5",
			teamB: "a6",
			winner: "a5",
			teamAName: "A5",
			teamBName: "A6",
			winnerName: "A5",
		}),
		match({
			bracket: "Bracket A",
			round: "Round 1",
			teamA: "a7",
			teamB: "a8",
			winner: "a7",
			teamAName: "A7",
			teamBName: "A8",
			winnerName: "A7",
		}),
	];
}

describe("suggestNextRoundName", () => {
	it("maps elimination rounds toward playoffs", () => {
		expect(suggestNextRoundName("Round 1")).toBe("Round 2");
		expect(suggestNextRoundName("Round 2")).toBe("Semifinals");
		expect(suggestNextRoundName("Semifinals")).toBe("Playoffs");
	});
});

describe("findAdvanceSourceRound", () => {
	it("picks the latest elimination round that still needs advancing", () => {
		const matches = [
			...completedRound1BracketA(),
			match({
				bracket: "Bracket B",
				round: "Round 1",
				teamA: "b1",
				teamB: "b2",
				winner: "b1",
				winnerName: "B1",
				teamAName: "B1",
				teamBName: "B2",
			}),
		];
		expect(findAdvanceSourceRound(matches)).toEqual({
			ok: true,
			sourceRound: "Round 1",
		});
	});

	it("skips a round that already has a next round generated", () => {
		const matches = [
			...completedRound1BracketA(),
			match({
				bracket: "Bracket A",
				round: "Round 2",
				teamA: "a1",
				teamB: "a3",
				winner: "a1",
				winnerName: "A1",
				teamAName: "A1",
				teamBName: "A3",
				status: "completed",
			}),
			match({
				bracket: "Bracket A",
				round: "Round 2",
				teamA: "a5",
				teamB: "a7",
				winner: "a5",
				winnerName: "A5",
				teamAName: "A5",
				teamBName: "A7",
				status: "completed",
			}),
		];
		expect(findAdvanceSourceRound(matches)).toEqual({
			ok: true,
			sourceRound: "Round 2",
		});
	});
});

describe("buildAdvanceRoundPreview", () => {
	it("pairs winners within each bracket into the next round", () => {
		const matches = [
			...completedRound1BracketA(),
			match({
				bracket: "Bracket B",
				round: "Round 1",
				teamA: "b1",
				teamB: "b2",
				winner: "b1",
				winnerName: "B1",
				teamAName: "B1",
				teamBName: "B2",
			}),
			match({
				bracket: "Bracket B",
				round: "Round 1",
				teamA: "b3",
				teamB: "b4",
				winner: "b3",
				winnerName: "B3",
				teamAName: "B3",
				teamBName: "B4",
			}),
			match({
				bracket: "Bracket B",
				round: "Round 1",
				teamA: "b5",
				teamB: "b6",
				winner: "b5",
				winnerName: "B5",
				teamAName: "B5",
				teamBName: "B6",
			}),
			match({
				bracket: "Bracket B",
				round: "Round 1",
				teamA: "b7",
				teamB: "b8",
				winner: "b7",
				winnerName: "B7",
				teamAName: "B7",
				teamBName: "B8",
			}),
		];

		const result = buildAdvanceRoundPreview({
			matches,
			sourceRound: "Round 1",
			highestOrder: 20,
			defaultBestOf: 3,
		});
		expect(result.ok).toBe(true);
		if (!result.ok || result.kind !== "next_round") return;
		expect(result.nextRound).toBe("Round 2");
		expect(result.preview.rows).toHaveLength(4); // 2 per bracket × 2 brackets
		expect(
			result.preview.rows.every((r) => r.round === "Round 2"),
		).toBe(true);
		for (const row of result.preview.rows) {
			expect(row.bracket).toMatch(/^Bracket [AB]$/);
		}
	});

	it("rejects when a source-round match has no winner yet", () => {
		const matches = [
			...completedRound1BracketA(),
			match({
				bracket: "Bracket A",
				round: "Round 1",
				teamA: "a9",
				teamB: "a10",
				winner: "",
				status: "scheduled",
				teamAName: "A9",
				teamBName: "A10",
			}),
		];
		const result = buildAdvanceRoundPreview({
			matches,
			sourceRound: "Round 1",
			highestOrder: 0,
		});
		expect(result.ok).toBe(false);
	});

	it("signals playoffs when each bracket is down to 2 winners", () => {
		const matches = [
			match({
				bracket: "Bracket A",
				round: "Semifinals",
				teamA: "a1",
				teamB: "a3",
				winner: "a1",
				winnerName: "A1",
				teamAName: "A1",
				teamBName: "A3",
			}),
			match({
				bracket: "Bracket A",
				round: "Semifinals",
				teamA: "a5",
				teamB: "a7",
				winner: "a5",
				winnerName: "A5",
				teamAName: "A5",
				teamBName: "A7",
			}),
			match({
				bracket: "Bracket B",
				round: "Semifinals",
				teamA: "b1",
				teamB: "b3",
				winner: "b1",
				winnerName: "B1",
				teamAName: "B1",
				teamBName: "B3",
			}),
			match({
				bracket: "Bracket B",
				round: "Semifinals",
				teamA: "b5",
				teamB: "b7",
				winner: "b5",
				winnerName: "B5",
				teamAName: "B5",
				teamBName: "B7",
			}),
		];
		const result = buildAdvanceRoundPreview({
			matches,
			sourceRound: "Semifinals",
			highestOrder: 40,
		});
		expect(result.ok).toBe(true);
		if (!result.ok || result.kind !== "playoffs_ready") return;
		expect(result.advancers).toHaveLength(4);
		expect(
			result.advancers.map((a) => a.team.id).sort(),
		).toEqual(["a1", "a5", "b1", "b5"]);
	});

	it("leaves an odd winner unpaired inside a bracket", () => {
		const matches = [
			match({
				bracket: "Bracket A",
				round: "Round 1",
				teamA: "a1",
				teamB: "a2",
				winner: "a1",
				winnerName: "A1",
				teamAName: "A1",
				teamBName: "A2",
			}),
			match({
				bracket: "Bracket A",
				round: "Round 1",
				teamA: "a3",
				teamB: "a4",
				winner: "a3",
				winnerName: "A3",
				teamAName: "A3",
				teamBName: "A4",
			}),
			match({
				bracket: "Bracket A",
				round: "Round 1",
				teamA: "a5",
				teamB: "a6",
				winner: "a5",
				winnerName: "A5",
				teamAName: "A5",
				teamBName: "A6",
			}),
		];
		const result = buildAdvanceRoundPreview({
			matches,
			sourceRound: "Round 1",
			highestOrder: 0,
		});
		expect(result.ok).toBe(true);
		if (!result.ok || result.kind !== "next_round") return;
		expect(result.preview.rows).toHaveLength(1);
		expect(result.preview.leftOut).toHaveLength(1);
	});
});
