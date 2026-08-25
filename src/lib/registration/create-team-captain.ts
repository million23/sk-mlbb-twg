/**
 * Create-team registration: first POST that reserves the squad name
 * becomes captain. Later teammates do not overwrite.
 *
 * Team row is saved in the participants create hook before the registrant
 * exists in the DB, so captain is planned here and applied once the
 * participant id is known (same request: record id, or after-create).
 */
export function planCreateTeamCaptainAssign(
	existingCaptain: string | null | undefined,
	participantId: string | null | undefined,
): string | null {
	const captain = (existingCaptain ?? "").trim();
	const pid = (participantId ?? "").trim();
	if (captain || !pid) return null;
	return pid;
}

export function formingTeamCreateFields(input: {
	tournamentId: string;
	teamName: string;
	captainParticipantId?: string | null;
}): {
	tournament: string;
	name: string;
	status: "forming";
	archived: false;
	captain?: string;
} {
	const captain = input.captainParticipantId?.trim();
	return {
		tournament: input.tournamentId,
		name: input.teamName,
		status: "forming",
		archived: false,
		...(captain ? { captain } : {}),
	};
}
