import { describe, expect, it } from "vitest";
import { shouldReplaceMatchStatsRows } from "./match-stats-rows";

describe("shouldReplaceMatchStatsRows", () => {
  it("does not clobber local rows when the same match refetches", () => {
    expect(
      shouldReplaceMatchStatsRows({
        open: true,
        matchId: "m1",
        alreadySyncedMatchId: "m1",
        resultsPending: false,
      }),
    ).toBe(false);
  });

  it("waits until the first result fetch finishes", () => {
    expect(
      shouldReplaceMatchStatsRows({
        open: true,
        matchId: "m1",
        alreadySyncedMatchId: null,
        resultsPending: true,
      }),
    ).toBe(false);
  });

  it("loads server rows once the sheet opens on a match", () => {
    expect(
      shouldReplaceMatchStatsRows({
        open: true,
        matchId: "m1",
        alreadySyncedMatchId: null,
        resultsPending: false,
      }),
    ).toBe(true);
  });
});
