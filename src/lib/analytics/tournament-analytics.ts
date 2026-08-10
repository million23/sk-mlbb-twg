import type { ParticipantsRecord } from "@/hooks/orval/model/participantsRecord";

export type AnalyticsPoint = {
  label: string;
  value: number;
};

const PHASE_LABELS = ["Phase 4", "Phase 9", "Phase 10"] as const;

export function participantsByPhase(
  participants: ParticipantsRecord[],
): AnalyticsPoint[] {
  return PHASE_LABELS.map((phase) => ({
    label: phase,
    value: participants.filter((participant) => {
      const value = String(participant.address_phase);
      return value === phase.replace("Phase ", "");
    }).length,
  }));
}

export function participantsByRegistrationStatus(
  participants: ParticipantsRecord[],
): AnalyticsPoint[] {
  const labels = ["Pending", "Approved", "Rejected"] as const;
  return labels.map((label) => ({
    label,
    value: participants.filter(
      (participant) => participant.registration_status === label.toLowerCase(),
    ).length,
  }));
}

export function participantsByTeamIntent(
  participants: ParticipantsRecord[],
): AnalyticsPoint[] {
  const labels = new Map([
    ["open_matching", "Open matching"],
    ["join_team", "Join existing team"],
    ["create_team", "Create team"],
  ]);

  return [...labels].map(([key, label]) => ({
    label,
    value: participants.filter((participant) => participant.team_intent === key)
      .length,
  }));
}


