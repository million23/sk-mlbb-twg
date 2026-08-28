import { formatParticipantNameDisplay } from "@/lib/legacy/participant-normalize";
import { resultGameNumber } from "@/lib/legacy/match-result-game";
import * as XLSX from "xlsx";

const SHEET_NAME_MAX = 31;

const HEADERS = [
	"Player",
	"Team",
	"Lane",
	"KDA",
	"Perf rating",
	"Gold",
] as const;

const LANE_LABELS: Record<string, string> = {
	mid: "Mid",
	gold: "Gold",
	exp: "Exp",
	support: "Support",
	jungle: "Jungle",
};

const HEADER_FILL = "BDD7EE";

export type MatchRosterMatch = {
	id?: string;
	teamAId?: string;
	teamBId?: string;
	teamAName: string;
	teamBName: string;
	round?: string;
	order?: number;
	archived?: boolean;
};

export type MatchRosterPlayer = {
	id: string;
	ign?: string;
	name?: string;
	teamId?: string;
	archived?: boolean;
};

export type MatchRosterStat = {
	match?: string;
	player?: string;
	game_number?: number | null;
	lane?: string;
	kills?: number;
	deaths?: number;
	assists?: number;
	game_performance_rating?: number;
	accumulated_gold?: number;
};

export type MatchRosterCell = string | number;

function sanitizeSheetName(name: string): string {
	const cleaned = name.replace(/[/\\?*[\]:]/g, "_").slice(0, SHEET_NAME_MAX);
	return cleaned || "Sheet1";
}

function sanitizeFileBasename(basename: string): string {
	return basename.replace(/[/\\?*[\]:]/g, "_").trim() || "export";
}

function fileTimestamp(): string {
	return new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
}

function playerLabel(player: MatchRosterPlayer): string {
	const ign = player.ign?.trim() ?? "";
	const name = formatParticipantNameDisplay(player.name);
	if (ign && name) return `${ign} - ${name}`;
	return ign || name || player.id;
}

function sortPlayers(a: MatchRosterPlayer, b: MatchRosterPlayer): number {
	const ignCmp = (a.ign?.trim() ?? "").localeCompare(b.ign?.trim() ?? "");
	if (ignCmp !== 0) return ignCmp;
	return (a.name?.trim() ?? "").localeCompare(b.name?.trim() ?? "");
}

function sortMatches(a: MatchRosterMatch, b: MatchRosterMatch): number {
	const roundA = (a.round ?? "").trim() || "Bracket";
	const roundB = (b.round ?? "").trim() || "Bracket";
	const byRound = roundA.localeCompare(roundB);
	if (byRound !== 0) return byRound;
	return (a.order ?? 0) - (b.order ?? 0);
}

function formatKda(stat: MatchRosterStat | undefined): string {
	if (!stat) return "";
	if (stat.kills == null && stat.deaths == null && stat.assists == null) {
		return "";
	}
	return `${stat.kills ?? 0}/${stat.deaths ?? 0}/${stat.assists ?? 0}`;
}

function formatLane(lane: string | undefined): string {
	if (!lane) return "";
	return LANE_LABELS[lane] ?? lane;
}

function statsByMatchPlayer(
	stats: MatchRosterStat[],
): Map<string, MatchRosterStat> {
	const map = new Map<string, MatchRosterStat>();
	for (const stat of stats) {
		if (!stat.match || !stat.player) continue;
		if (resultGameNumber(stat) !== 1) continue;
		map.set(`${stat.match}:${stat.player}`, stat);
	}
	return map;
}

function emptyRow(): MatchRosterCell[] {
	return ["", "", "", "", "", ""];
}

function appendTeamBlock(
	rows: MatchRosterCell[][],
	teamName: string,
	teamId: string | undefined,
	players: MatchRosterPlayer[],
	matchId: string | undefined,
	statsMap: Map<string, MatchRosterStat>,
) {
	rows.push([teamName, "", "", "", "", ""]);
	const roster = players
		.filter(
			(p) =>
				p.archived !== true &&
				Boolean(p.id) &&
				Boolean(teamId) &&
				p.teamId === teamId,
		)
		.sort(sortPlayers);

	for (const player of roster) {
		const stat =
			matchId && player.id
				? statsMap.get(`${matchId}:${player.id}`)
				: undefined;
		const gold =
			stat?.accumulated_gold != null &&
			Number.isFinite(stat.accumulated_gold)
				? stat.accumulated_gold
				: "";
		const rating =
			stat?.game_performance_rating != null &&
			Number.isFinite(stat.game_performance_rating)
				? stat.game_performance_rating
				: "";
		rows.push([
			playerLabel(player),
			teamName,
			formatLane(stat?.lane),
			formatKda(stat),
			rating,
			gold,
		]);
	}
}

/** Header + match blocks: team heading, players, VS, other team, blank between matches. */
export function buildMatchRosterAoa(input: {
	matches: MatchRosterMatch[];
	players: MatchRosterPlayer[];
	stats?: MatchRosterStat[];
}): MatchRosterCell[][] {
	const rows: MatchRosterCell[][] = [[...HEADERS]];
	const statsMap = statsByMatchPlayer(input.stats ?? []);
	const matches = [...input.matches]
		.filter((m) => m.archived !== true)
		.sort(sortMatches);

	matches.forEach((match, index) => {
		if (index > 0) rows.push(emptyRow());
		appendTeamBlock(
			rows,
			match.teamAName,
			match.teamAId,
			input.players,
			match.id,
			statsMap,
		);
		rows.push(["VS", "", "", "", "", ""]);
		appendTeamBlock(
			rows,
			match.teamBName,
			match.teamBId,
			input.players,
			match.id,
			statsMap,
		);
	});

	return rows;
}

export function buildMatchRosterWorksheet(
	aoa: MatchRosterCell[][],
): XLSX.WorkSheet {
	const ws = XLSX.utils.aoa_to_sheet(aoa);
	ws["!cols"] = [
		{ wch: 42 },
		{ wch: 22 },
		{ wch: 12 },
		{ wch: 12 },
		{ wch: 14 },
		{ wch: 12 },
	];
	ws["!rows"] = [{ hpt: 22 }];

	for (let c = 0; c < HEADERS.length; c++) {
		const addr = XLSX.utils.encode_cell({ r: 0, c });
		const cell = ws[addr];
		if (!cell) continue;
		cell.s = {
			fill: { fgColor: { rgb: HEADER_FILL }, patternType: "solid" },
			font: { bold: true },
			border: {
				bottom: { style: "medium", color: { rgb: "000000" } },
			},
		};
	}

	return ws;
}

export function downloadMatchRosterSpreadsheet(input: {
	fileBasename: string;
	sheetName?: string;
	workbookTitle?: string;
	matches: MatchRosterMatch[];
	players: MatchRosterPlayer[];
	stats?: MatchRosterStat[];
}): void {
	const aoa = buildMatchRosterAoa(input);
	const ws = buildMatchRosterWorksheet(aoa);
	const wb = XLSX.utils.book_new();
	const sheetName = sanitizeSheetName(input.sheetName ?? "Matches");
	wb.Props = {
		Title: input.workbookTitle ?? sheetName,
		Subject: "Match roster export",
		Author: "SK MLBB TWG",
		CreatedDate: new Date(),
	};
	XLSX.utils.book_append_sheet(wb, ws, sheetName);
	const name = sanitizeFileBasename(input.fileBasename);
	XLSX.writeFile(wb, `${name}-${fileTimestamp()}.xlsx`, {
		bookType: "xlsx",
		compression: true,
		cellStyles: true,
	});
}
