import type { TeamsRecordStatus } from "@/hooks/orval/model/teamsRecordStatus";

/** Derive status from roster size. Returns null when inactive should be left alone / no change. */
export function resolveTeamStatus(
	memberCount: number,
	current: TeamsRecordStatus | undefined,
	minReady = 5,
): TeamsRecordStatus | null {
	if (current === "inactive") return null;
	if (memberCount >= minReady) {
		return current === "ready" ? null : "ready";
	}
	if (memberCount === 0) {
		return current === "incomplete" ? null : "incomplete";
	}
	return current === "forming" ? null : "forming";
}

/**
 * Status + captain writes after roster changes.
 * Captain must be written even when status is already correct — team POST
 * often drops captain (empty relation / related row not a member yet).
 */
export function nextTeamRosterPatch(input: {
	memberCount: number;
	currentStatus?: TeamsRecordStatus;
	captainId?: string;
	memberIds: string[];
	minReady?: number;
}): Record<string, unknown> | null {
	const minReady = input.minReady ?? 5;
	const nextStatus = resolveTeamStatus(
		input.memberCount,
		input.currentStatus,
		minReady,
	);
	const captain = input.captainId?.trim() || "";
	const captainIsMember = Boolean(captain && input.memberIds.includes(captain));

	const patch: Record<string, unknown> = {};
	if (nextStatus) patch.status = nextStatus;
	if (captain && !captainIsMember) patch.captain = "";
	else if (captainIsMember) patch.captain = captain;

	return Object.keys(patch).length > 0 ? patch : null;
}
