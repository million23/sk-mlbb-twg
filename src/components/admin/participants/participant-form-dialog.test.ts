import { describe, expect, it } from "vitest";
import type { ParticipantFormValues } from "@/hooks/admin/use-tournament-participants";
import { validateParticipantFormValues } from "./participant-form-dialog";

function base(
  overrides: Partial<ParticipantFormValues> = {},
): ParticipantFormValues {
  return {
    name: "Juan Dela Cruz",
    email: "juan@example.com",
    ign: "JuanML",
    birthdate: "2008-01-10",
    contact_number: "09171234567",
    user_id: "123456789",
    server_id: "2001",
    address_phase: "9",
    address_package: "12",
    address_block: "14",
    address_lot: "3",
    preferred_lane: ["jungle"],
    team_intent: "open_matching",
    preferred_team: "",
    preferred_team_name: "",
    registration_status: "approved",
    registration_reject_reason: "",
    ...overrides,
  };
}

describe("validateParticipantFormValues", () => {
  it("accepts a valid payload", () => {
    expect(validateParticipantFormValues(base())).toBeNull();
  });

  it("requires user id", () => {
    expect(validateParticipantFormValues(base({ user_id: "" }))).toMatch(
      /user id is required/i,
    );
  });

  it("rejects user id shorter than 7 digits", () => {
    expect(validateParticipantFormValues(base({ user_id: "123456" }))).toMatch(
      /7–10 digits/i,
    );
  });

  it("accepts 7-digit user id", () => {
    expect(
      validateParticipantFormValues(base({ user_id: "1234567" })),
    ).toBeNull();
  });

  it("rejects user id longer than 10 digits", () => {
    expect(
      validateParticipantFormValues(base({ user_id: "12345678901" })),
    ).toMatch(/7–10 digits/i);
  });

  it("rejects server id shorter than 4 digits", () => {
    expect(validateParticipantFormValues(base({ server_id: "200" }))).toMatch(
      /4–5 digits/i,
    );
  });
});
