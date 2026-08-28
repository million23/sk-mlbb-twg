import type { ParticipantsRecord } from "@/hooks/orval/model/participantsRecord";
import type { TeamsRecord } from "@/hooks/orval/model/teamsRecord";
import { fromMatchApiRecord } from "@/lib/admin/match-write";
import type { MatchRecord } from "@/hooks/legacy/use-matches";
import type { MatchResultRecord } from "@/hooks/legacy/use-match-results";

function relationId(
  value: unknown,
): string | undefined {
  if (typeof value === "string" && value.trim()) return value;
  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id?: unknown }).id;
    if (typeof id === "string") return id;
  }
  return undefined;
}

export function mapTeamRow(row: Record<string, unknown>): TeamsRecord {
  const captain = row.captain;
  const captainObj =
    captain && typeof captain === "object"
      ? (captain as Record<string, unknown>)
      : undefined;
  return {
    ...(row as unknown as TeamsRecord),
    captain: relationId(captain) ?? (typeof captain === "string" ? captain : undefined),
    expand: captainObj ? { captain: captainObj } : undefined,
  } as TeamsRecord;
}

export function mapParticipantRow(
  row: Record<string, unknown>,
): ParticipantsRecord {
  const preferred = row.preferred_team;
  const team = row.team;
  const preferredObj =
    preferred && typeof preferred === "object"
      ? (preferred as Record<string, unknown>)
      : undefined;
  const teamObj =
    team && typeof team === "object" ? (team as Record<string, unknown>) : undefined;
  return {
    ...(row as unknown as ParticipantsRecord),
    preferred_team: relationId(preferred),
    team: relationId(team),
    expand: {
      ...(preferredObj ? { preferred_team: preferredObj } : {}),
      ...(teamObj ? { team: teamObj } : {}),
    },
  } as ParticipantsRecord;
}

export function mapMatchRow(row: Record<string, unknown>): MatchRecord {
  const teamA = row.team_a;
  const teamB = row.team_b;
  const winner = row.winner;
  const teamAObj =
    teamA && typeof teamA === "object" ? (teamA as Record<string, unknown>) : undefined;
  const teamBObj =
    teamB && typeof teamB === "object" ? (teamB as Record<string, unknown>) : undefined;
  const winnerObj =
    winner && typeof winner === "object"
      ? (winner as Record<string, unknown>)
      : undefined;
  return fromMatchApiRecord({
    ...row,
    team_a: relationId(teamA) ?? row.team_a,
    team_b: relationId(teamB) ?? row.team_b,
    winner: relationId(winner) ?? row.winner,
    expand: {
      team_a: teamAObj,
      team_b: teamBObj,
      winner: winnerObj,
    },
  } as Record<string, unknown>) as MatchRecord;
}

export function mapMatchResultRow(
  row: Record<string, unknown>,
): MatchResultRecord {
  const player = row.player;
  const match = row.match;
  const playerObj =
    player && typeof player === "object"
      ? (player as Record<string, unknown>)
      : undefined;
  const matchObj =
    match && typeof match === "object" ? (match as Record<string, unknown>) : undefined;
  return {
    ...(row as MatchResultRecord),
    player: relationId(player) ?? (row.player as string),
    match: relationId(match) ?? (row.match as string),
    expand: {
      ...(playerObj ? { player: playerObj } : {}),
      ...(matchObj ? { match: matchObj } : {}),
    },
  } as MatchResultRecord;
}

export const PARTICIPANT_EMBED = "*";
export const TEAM_EMBED = "*";
export const MATCH_EMBED = "*";
export const MATCH_RESULT_PLAYER_EMBED = "*";
export const MATCH_RESULT_EMBED = "*";
