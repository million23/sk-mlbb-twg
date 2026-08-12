import { describe, expect, it } from "vitest";
import type { ParticipantsRecord } from "@/hooks/orval/model/participantsRecord";
import {
  participantsByPhase,
  participantsByRegistrationStatus,
  participantsByTeamIntent,
} from "@/lib/analytics/tournament-analytics";

function participant(
  overrides: Partial<ParticipantsRecord> = {},
): ParticipantsRecord {
  return {
    tournament: "tournament-id",
    name: "Participant",
    email: "participant@example.com",
    ign: "Player",
    birthdate: "2000-01-01",
    user_id: "user-id",
    server_id: "server-id",
    address_phase: "4",
    address_package: "1",
    address_block: "1",
    address_lot: "1",
    preferred_lane: "mid",
    registration_status: "pending",
    status: "unassigned",
    archived: false,
    ...overrides,
  };
}

describe("tournament analytics", () => {
  it("groups participants by phase in stable display order", () => {
    const data = participantsByPhase([
      participant({ address_phase: "10" }),
      participant({ address_phase: "4" }),
      participant({ address_phase: "4" }),
      participant({ address_phase: "9" }),
    ]);

    expect(data).toEqual([
      { label: "Phase 4", value: 2 },
      { label: "Phase 9", value: 1 },
      { label: "Phase 10", value: 1 },
    ]);
  });

  it("groups registration statuses and ignores unknown values", () => {
    const data = participantsByRegistrationStatus([
      participant({ registration_status: "pending" }),
      participant({ registration_status: "approved" }),
      participant({ registration_status: "approved" }),
      participant({ registration_status: "rejected" }),
    ]);

    expect(data).toEqual([
      { label: "Pending", value: 1 },
      { label: "Approved", value: 2 },
      { label: "Rejected", value: 1 },
    ]);
  });

  it("groups team intent without exposing participant details", () => {
    const data = participantsByTeamIntent([
      participant({ team_intent: "open_matching" }),
      participant({ team_intent: "join_team" }),
      participant({ team_intent: "join_team" }),
      participant({ team_intent: "create_team" }),
      participant({ team_intent: undefined }),
    ]);

    expect(data).toEqual([
      { label: "Open matching", value: 1 },
      { label: "Join existing team", value: 2 },
      { label: "Create team", value: 1 },
    ]);
  });
});
