import {
	downloadStructuredSpreadsheet,
	type SpreadsheetColumn,
} from "@/lib/legacy/spreadsheet-export";

export type MatchDetailsMatch = {
	id?: string;
	matchLabel?: string;
	round?: string;
	order?: number;
	teamAId?: string;
	teamBId?: string;
	teamAName: string;
	teamBName: string;
	scoreA?: number;
	scoreB?: number;
	winnerId?: string;
	winnerName?: string;
	archived?: boolean;
};

export type MatchDetailsRow = {
	label: string;
	teamA: string;
	scoreA: number;
	teamB: string;
	scoreB: number;
	winner: string;
};

function sortMatches(a: MatchDetailsMatch, b: MatchDetailsMatch): number {
	const roundA = (a.round ?? "").trim() || "Bracket";
	const roundB = (b.round ?? "").trim() || "Bracket";
	const byRound = roundA.localeCompare(roundB);
	if (byRound !== 0) return byRound;
	return (a.order ?? 0) - (b.order ?? 0);
}

function matchLabel(match: MatchDetailsMatch): string {
	const label = match.matchLabel?.trim();
	if (label) return label;
	return `${match.teamAName} vs ${match.teamBName}`;
}

function winnerLabel(match: MatchDetailsMatch): string {
	if (match.winnerId && match.winnerId === match.teamAId) return match.teamAName;
	if (match.winnerId && match.winnerId === match.teamBId) return match.teamBName;
	const named = match.winnerName?.trim();
	if (named) return named;
	return "None";
}

export function buildMatchDetailsRows(
	matches: MatchDetailsMatch[],
): MatchDetailsRow[] {
	return [...matches]
		.filter((m) => m.archived !== true)
		.sort(sortMatches)
		.map((m) => ({
			label: matchLabel(m),
			teamA: m.teamAName,
			scoreA: m.scoreA ?? 0,
			teamB: m.teamBName,
			scoreB: m.scoreB ?? 0,
			winner: winnerLabel(m),
		}));
}

export const MATCH_DETAILS_COLUMNS: SpreadsheetColumn<MatchDetailsRow>[] = [
	{ header: "Match", widthChars: 32, type: "text", get: (r) => r.label },
	{ header: "Team A", widthChars: 22, type: "text", get: (r) => r.teamA },
	{
		header: "Team A wins",
		widthChars: 14,
		type: "number",
		get: (r) => r.scoreA,
	},
	{ header: "Team B", widthChars: 22, type: "text", get: (r) => r.teamB },
	{
		header: "Team B wins",
		widthChars: 14,
		type: "number",
		get: (r) => r.scoreB,
	},
	{ header: "Winner", widthChars: 22, type: "text", get: (r) => r.winner },
];

export function downloadMatchDetailsSpreadsheet(input: {
	fileBasename: string;
	workbookTitle?: string;
	matches: MatchDetailsMatch[];
}): void {
	downloadStructuredSpreadsheet({
		fileBasename: input.fileBasename,
		sheetName: "Scores",
		workbookTitle: input.workbookTitle ?? "Match scores",
		columns: MATCH_DETAILS_COLUMNS,
		rows: buildMatchDetailsRows(input.matches),
		emptyMessage: "No matches to export",
	});
}
