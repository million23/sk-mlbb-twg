import type { ParticipantsRecord } from "@/hooks/orval/model/participantsRecord";
import {
  ageOnTournamentDay,
  ELIGIBLE_PHASES,
  type EligiblePhase,
  type ListedTeam,
  type TeamIntent,
} from "@/lib/registration/flow";

/** Committee Phase-9 check before approving a pending registrant. */
export function committeeApproveBlockReason(
  participant: ParticipantsRecord,
  listedTeams: ListedTeam[],
  peers: ParticipantsRecord[],
  tournamentDay: string,
): string | null {
  if (participant.registration_status !== "pending") {
    return "Approve only while pending";
  }

  const age = ageOnTournamentDay(participant.birthdate, tournamentDay);
  if (age !== null && age < 15) {
    return `Must be 15+ on tournament day (age on ${tournamentDay}: ${age})`;
  }

  if (
    !(ELIGIBLE_PHASES as readonly string[]).includes(participant.address_phase)
  ) {
    return "Phase must be 4, 9, or 10";
  }

  const intent = (participant.team_intent ?? "open_matching") as TeamIntent;
  if (intent === "open_matching") return null;

  const registrantPhase = participant.address_phase as EligiblePhase;

  if (intent === "create_team") {
    if (!participant.preferred_team_name?.trim()) {
      return "Team name is required when creating a team";
    }
    if (registrantPhase !== "9") {
      return "Phase-9 team rule: creator must be Phase 9 (no other members yet)";
    }
    return null;
  }

  if (intent === "join_team") {
    if (!participant.preferred_team) return "Pick a listed team to join";
    const team = listedTeams.find((t) => t.id === participant.preferred_team);
    if (!team) return "Unknown team";

    const peerPhases = peers
      .filter(
        (p) =>
          p.id !== participant.id &&
          p.preferred_team === participant.preferred_team &&
          (p.registration_status === "pending" ||
            p.registration_status === "approved") &&
          !p.archived,
      )
      .map((p) => p.address_phase as EligiblePhase);

    const memberPhases =
      team.member_phases.length > 0 ? team.member_phases : peerPhases;

    const hasPhase9 =
      memberPhases.length === 0 ||
      memberPhases.includes("9") ||
      registrantPhase === "9";

    if (!hasPhase9) {
      return `Phase-9 team rule: "${team.name}" has no Phase-9 resident and registrant is Phase ${registrantPhase}`;
    }
  }

  return null;
}

export function formatHomeAddress(p: ParticipantsRecord): string {
  return `Phase ${p.address_phase} Package ${p.address_package} Block ${p.address_block} Lot ${p.address_lot}`;
}

export const TEAM_INTENT_LABELS: Record<TeamIntent, string> = {
  open_matching: "Open matching",
  join_team: "Join listed team",
  create_team: "Create / name team",
};
