import { describe, expect, it } from "vitest";
import {
  hasPurokEndorsement,
  isConditionalApproval,
} from "./participant-approval";

describe("hasPurokEndorsement", () => {
  it("is false when the file field is empty", () => {
    expect(hasPurokEndorsement({})).toBe(false);
    expect(hasPurokEndorsement({ purok_endorsement: "" })).toBe(false);
    expect(hasPurokEndorsement({ purok_endorsement: "   " })).toBe(false);
  });

  it("is true when a filename is stored", () => {
    expect(hasPurokEndorsement({ purok_endorsement: "scan.png" })).toBe(true);
  });
});

describe("isConditionalApproval", () => {
  it("is only approved records without an endorsement file", () => {
    expect(
      isConditionalApproval({
        registration_status: "approved",
        purok_endorsement: "",
      }),
    ).toBe(true);
    expect(
      isConditionalApproval({
        registration_status: "approved",
        purok_endorsement: "scan.png",
      }),
    ).toBe(false);
    expect(
      isConditionalApproval({
        registration_status: "pending",
        purok_endorsement: "",
      }),
    ).toBe(false);
  });
});
