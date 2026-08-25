import type { ParticipantsRecord } from "@/hooks/orval/model/participantsRecord";
import {
  ageOnTournamentDay,
  ELIGIBLE_PHASES,
  type ListedTeam,
  type TeamIntent,
} from "@/lib/registration/flow";

export function hasPurokEndorsement(
  record: Pick<ParticipantsRecord, "purok_endorsement">,
): boolean {
  return Boolean(record.purok_endorsement?.trim());
}

/** Approved without a purok endorsement file. They present it at the tournament. */
export function isConditionalApproval(
  record: Pick<ParticipantsRecord, "registration_status" | "purok_endorsement">,
): boolean {
  return record.registration_status === "approved" && !hasPurokEndorsement(record);
}

/** Committee checks before approving a pending registrant. Phase-9 deferred. */
export function committeeApproveBlockReason(
  participant: ParticipantsRecord,
  listedTeams: ListedTeam[],
  _peers: ParticipantsRecord[],
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

  if (intent === "create_team") {
    if (!participant.preferred_team_name?.trim()) {
      return "Team name is required when creating a team";
    }
    // Phase-9 team rule deferred — do not block approve.
    return null;
  }

  if (intent === "join_team") {
    if (!participant.preferred_team) return "Pick a listed team to join";
    const team = listedTeams.find((t) => t.id === participant.preferred_team);
    if (!team) return "Unknown team";
    // Phase-9 team rule deferred — do not block approve.
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
