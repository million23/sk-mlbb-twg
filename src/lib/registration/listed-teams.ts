import type { ParticipantsRecord } from "@/hooks/orval/model/participantsRecord";
import type { TeamsRecord } from "@/hooks/orval/model/teamsRecord";

export type JoinListParticipant = Pick<
	ParticipantsRecord,
	| "id"
	| "team"
	| "preferred_team"
	| "team_intent"
	| "registration_status"
	| "status"
>;

/**
 * Public join-team list: hide forming teams that only exist as create-team
 * registration placeholders (preferred_team links, nobody assigned yet).
 * Empty admin-created shells stay visible.
 */
export function isJoinableListedTeam(
	team: TeamsRecord,
	participants: JoinListParticipant[],
): boolean {
	if (!team.id || team.archived || team.status === "inactive") return false;
	if (team.status !== "forming") return true;

	const assigned = participants.some(
		(p) => p.team === team.id && p.status === "assigned",
	);
	if (assigned) return true;

	const pendingCreatePlaceholder = participants.some(
		(p) =>
			p.preferred_team === team.id &&
			p.team_intent === "create_team" &&
			(p.registration_status === "pending" ||
				p.registration_status === "approved"),
	);
	return !pendingCreatePlaceholder;
}
