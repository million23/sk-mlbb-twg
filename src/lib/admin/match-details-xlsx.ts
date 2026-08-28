import { formatParticipantNameDisplay } from "@/lib/legacy/participant-normalize";
import { resultGameNumber } from "@/lib/legacy/match-result-game";
import {
	buildStructuredWorksheet,
	downloadWorkbook,
	type SpreadsheetColumn,
} from "@/lib/legacy/spreadsheet-export";

const LANE_LABELS: Record<string, string> = {
	mid: "Mid",
	gold: "Gold",
	exp: "Exp",
	support: "Support",
	jungle: "Jungle",
};

export type MatchDetailsMatch = {
	id?: string;
	matchLabel?: string;
	bracket?: string;
	round?: string;
	order?: number;
	bestOf?: number;
	teamAId?: string;
	teamBId?: string;
	teamAName: string;
	teamBName: string;
	scoreA?: number;
	scoreB?: number;
	winnerId?: string;
	winnerName?: string;
	statusLabel?: string;
	scheduledAt?: string;
	notes?: string;
	created?: string;
	updated?: string;
	archived?: boolean;
};

export type MatchDetailsPlayer = {
	id: string;
	ign?: string;
	name?: string;
	teamId?: string;
	archived?: boolean;
};

export type MatchDetailsStat = {
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

export type MatchDetailsRow = {
	id: string;
	label: string;
	bracket: string;
	round: string;
	order: number;
	bestOf: number;
	teamA: string;
	teamB: string;
	scoreA: number;
	scoreB: number;
	winner: string;
	status: string;
	scheduledAt: string;
	notes: string;
	created: string;
	updated: string;
};

export type MatchPlayerStatRow = {
	matchId: string;
	matchLabel: string;
	game: number;
	player: string;
	team: string;
	lane: string;
	kills: number | "";
	deaths: number | "";
	assists: number | "";
	kda: string;
	rating: number | "";
	gold: number | "";
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
	return match.winnerName?.trim() ?? "";
}

function playerLabel(player: MatchDetailsPlayer): string {
	const ign = player.ign?.trim() ?? "";
	const name = formatParticipantNameDisplay(player.name);
	if (ign && name) return `${ign} - ${name}`;
	return ign || name || player.id;
}

function formatLane(lane: string | undefined): string {
	if (!lane) return "";
	return LANE_LABELS[lane] ?? lane;
}

function formatKda(stat: MatchDetailsStat): string {
	if (stat.kills == null && stat.deaths == null && stat.assists == null) {
		return "";
	}
	return `${stat.kills ?? 0}/${stat.deaths ?? 0}/${stat.assists ?? 0}`;
}

export function buildMatchDetailsRows(
	matches: MatchDetailsMatch[],
): MatchDetailsRow[] {
	return [...matches]
		.filter((m) => m.archived !== true)
		.sort(sortMatches)
		.map((m) => ({
			id: m.id ?? "",
			label: matchLabel(m),
			bracket: m.bracket?.trim() ?? "",
			round: (m.round ?? "").trim() || "Bracket",
			order: m.order ?? 0,
			bestOf: m.bestOf ?? 1,
			teamA: m.teamAName,
			teamB: m.teamBName,
			scoreA: m.scoreA ?? 0,
			scoreB: m.scoreB ?? 0,
			winner: winnerLabel(m),
			status: m.statusLabel ?? "",
			scheduledAt: m.scheduledAt ?? "",
			notes: m.notes?.trim() ?? "",
			created: m.created ?? "",
			updated: m.updated ?? "",
		}));
}

export const MATCH_DETAILS_COLUMNS: SpreadsheetColumn<MatchDetailsRow>[] = [
	{ header: "Match ID", widthChars: 16, type: "text", get: (r) => r.id },
	{ header: "Label", widthChars: 32, type: "text", get: (r) => r.label },
	{ header: "Bracket", widthChars: 14, type: "text", get: (r) => r.bracket },
	{ header: "Round", widthChars: 14, type: "text", get: (r) => r.round },
	{ header: "Order", widthChars: 8, type: "number", get: (r) => r.order },
	{ header: "Best of", widthChars: 10, type: "number", get: (r) => r.bestOf },
	{ header: "Team A", widthChars: 22, type: "text", get: (r) => r.teamA },
	{ header: "Team B", widthChars: 22, type: "text", get: (r) => r.teamB },
	{ header: "Score A", widthChars: 10, type: "number", get: (r) => r.scoreA },
	{ header: "Score B", widthChars: 10, type: "number", get: (r) => r.scoreB },
	{ header: "Winner", widthChars: 22, type: "text", get: (r) => r.winner },
	{ header: "Status", widthChars: 12, type: "text", get: (r) => r.status },
	{
		header: "Scheduled",
		widthChars: 20,
		type: "date",
		get: (r) => r.scheduledAt,
	},
	{ header: "Notes", widthChars: 32, type: "text", get: (r) => r.notes },
	{ header: "Created", widthChars: 20, type: "date", get: (r) => r.created },
	{ header: "Updated", widthChars: 20, type: "date", get: (r) => r.updated },
];

export function buildMatchPlayerStatRows(input: {
	matches: MatchDetailsMatch[];
	players: MatchDetailsPlayer[];
	stats: MatchDetailsStat[];
}): MatchPlayerStatRow[] {
	const active = [...input.matches]
		.filter((m) => m.archived !== true)
		.sort(sortMatches);
	const matchById = new Map(active.flatMap((m) => (m.id ? [[m.id, m]] : [])));
	const playerById = new Map(
		input.players
			.filter((p) => p.archived !== true)
			.map((p) => [p.id, p] as const),
	);

	const rows: MatchPlayerStatRow[] = [];
	for (const stat of input.stats) {
		if (!stat.match || !stat.player) continue;
		const match = matchById.get(stat.match);
		if (!match) continue;
		const player = playerById.get(stat.player);
		const team =
			player?.teamId && player.teamId === match.teamAId
				? match.teamAName
				: player?.teamId && player.teamId === match.teamBId
					? match.teamBName
					: "";
		rows.push({
			matchId: match.id ?? "",
			matchLabel: matchLabel(match),
			game: resultGameNumber(stat),
			player: player ? playerLabel(player) : stat.player,
			team,
			lane: formatLane(stat.lane),
			kills: stat.kills ?? "",
			deaths: stat.deaths ?? "",
			assists: stat.assists ?? "",
			kda: formatKda(stat),
			rating: stat.game_performance_rating ?? "",
			gold: stat.accumulated_gold ?? "",
		});
	}

	rows.sort((a, b) => {
		const matchA = matchById.get(a.matchId);
		const matchB = matchById.get(b.matchId);
		if (matchA && matchB) {
			const byMatch = sortMatches(matchA, matchB);
			if (byMatch !== 0) return byMatch;
		}
		if (a.game !== b.game) return a.game - b.game;
		return a.player.localeCompare(b.player);
	});

	return rows;
}

export const MATCH_PLAYER_STAT_COLUMNS: SpreadsheetColumn<MatchPlayerStatRow>[] =
	[
		{
			header: "Match ID",
			widthChars: 16,
			type: "text",
			get: (r) => r.matchId,
		},
		{
			header: "Match",
			widthChars: 32,
			type: "text",
			get: (r) => r.matchLabel,
		},
		{ header: "Game", widthChars: 8, type: "number", get: (r) => r.game },
		{ header: "Player", widthChars: 36, type: "text", get: (r) => r.player },
		{ header: "Team", widthChars: 22, type: "text", get: (r) => r.team },
		{ header: "Lane", widthChars: 12, type: "text", get: (r) => r.lane },
		{ header: "Kills", widthChars: 8, type: "number", get: (r) => r.kills },
		{ header: "Deaths", widthChars: 8, type: "number", get: (r) => r.deaths },
		{
			header: "Assists",
			widthChars: 8,
			type: "number",
			get: (r) => r.assists,
		},
		{ header: "KDA", widthChars: 12, type: "text", get: (r) => r.kda },
		{
			header: "Perf rating",
			widthChars: 12,
			type: "number",
			get: (r) => r.rating,
		},
		{ header: "Gold", widthChars: 10, type: "number", get: (r) => r.gold },
	];

export function downloadMatchDetailsSpreadsheet(input: {
	fileBasename: string;
	workbookTitle?: string;
	matches: MatchDetailsMatch[];
	players: MatchDetailsPlayer[];
	stats: MatchDetailsStat[];
}): void {
	const matchRows = buildMatchDetailsRows(input.matches);
	const statRows = buildMatchPlayerStatRows(input);
	downloadWorkbook({
		fileBasename: input.fileBasename,
		workbookTitle: input.workbookTitle ?? "Match details",
		sheets: [
			{
				name: "Matches",
				ws: buildStructuredWorksheet(MATCH_DETAILS_COLUMNS, matchRows, {
					emptyMessage: "No matches to export",
				}),
			},
			{
				name: "Player results",
				ws: buildStructuredWorksheet(MATCH_PLAYER_STAT_COLUMNS, statRows, {
					emptyMessage: "No player results to export",
				}),
			},
		],
	});
}
