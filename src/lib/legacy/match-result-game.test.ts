import { describe, expect, it } from "vitest";
import {
  matchSeriesGameCount,
  resultGameNumber,
  seriesGameNumbers,
} from "./match-result-game";

describe("resultGameNumber", () => {
  it("treats missing values as game 1", () => {
    expect(resultGameNumber({})).toBe(1);
    expect(resultGameNumber({ game_number: null })).toBe(1);
    expect(resultGameNumber({ game_number: 0 })).toBe(1);
  });

  it("keeps a positive game index", () => {
    expect(resultGameNumber({ game_number: 3 })).toBe(3);
    expect(resultGameNumber({ game_number: 2.9 })).toBe(2);
  });
});

describe("matchSeriesGameCount", () => {
  it("uses best-of, minimum 1", () => {
    expect(matchSeriesGameCount(5)).toBe(5);
    expect(matchSeriesGameCount(undefined)).toBe(1);
    expect(matchSeriesGameCount(0)).toBe(1);
  });
});

describe("seriesGameNumbers", () => {
  it("lists 1..bestOf", () => {
    expect(seriesGameNumbers(3)).toEqual([1, 2, 3]);
  });
});
