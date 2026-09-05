import { describe, expect, it } from "vitest";
import { shouldReplaceMatchStatsRows } from "./match-stats-rows";

const ready = {
  open: true,
  matchId: "m1",
  resultsPending: false,
  isFetching: false,
  isSaving: false,
  hasDirtyRows: false,
  hasLocalRows: true,
};

describe("shouldReplaceMatchStatsRows", () => {
  it("keeps local rows while a refetch is in flight", () => {
    expect(
      shouldReplaceMatchStatsRows({
        ...ready,
        isFetching: true,
      }),
    ).toBe(false);
  });

  it("applies server rows after a refetch finishes", () => {
    expect(shouldReplaceMatchStatsRows(ready)).toBe(true);
  });

  it("waits until the first result fetch finishes", () => {
    expect(
      shouldReplaceMatchStatsRows({
        ...ready,
        resultsPending: true,
        hasLocalRows: false,
      }),
    ).toBe(false);
  });

  it("does not overwrite unsaved edits", () => {
    expect(
      shouldReplaceMatchStatsRows({
        ...ready,
        hasDirtyRows: true,
      }),
    ).toBe(false);
  });
});
