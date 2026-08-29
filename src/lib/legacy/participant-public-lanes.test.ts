import { describe, expect, it } from "vitest";
import { participantPublicLanes } from "./participant-public-lanes";

describe("participantPublicLanes", () => {
  it("prefers preferred_roles over preferred_lane", () => {
    expect(
      participantPublicLanes({
        preferred_roles: ["jungle"],
        preferred_lane: "mid",
      }),
    ).toEqual(["jungle"]);
  });

  it("reads preferred_lane when roles empty", () => {
    expect(participantPublicLanes({ preferred_lane: "gold" })).toEqual([
      "gold",
    ]);
  });

  it("reads camelCase preferredRoles", () => {
    expect(
      participantPublicLanes({ preferredRoles: ["exp", "support"] }),
    ).toEqual(["exp", "support"]);
  });
});
