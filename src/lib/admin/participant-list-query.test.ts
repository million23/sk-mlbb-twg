import { describe, expect, it } from "vitest";
import {
  escapePocketBaseFilterValue,
  participantListFilter,
} from "./participant-list-query";

describe("escapePocketBaseFilterValue", () => {
  it("escapes quotes and backslashes", () => {
    expect(escapePocketBaseFilterValue('a"b\\c')).toBe('a\\"b\\\\c');
  });
});

describe("participantListFilter", () => {
  it("scopes to tournament and active rows", () => {
    expect(participantListFilter("abc", "all", "")).toBe(
      'tournament = "abc" && archived != true',
    );
  });

  it("adds registration status for tabs", () => {
    expect(participantListFilter("abc", "pending", "")).toBe(
      'tournament = "abc" && archived != true && registration_status = "pending"',
    );
  });

  it("adds a search clause", () => {
    expect(participantListFilter("abc", "all", "kai")).toContain(
      'name ~ "kai"',
    );
  });
});
