import { describe, expect, it } from "vitest";
import {
  bestResultIdByLane,
  displayGameByResultId,
  matchResultTabNumbers,
  matchSeriesGameCount,
  resultGameNumber,
  seriesGameNumbers,
  storedGameNumber,
  visibleMatchResultRows,
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

describe("displayGameByResultId", () => {
  it("keeps stored game numbers when they differ", () => {
    const map = displayGameByResultId(
      [
        { id: "a", player: "p1", game_number: 1 },
        { id: "b", player: "p1", game_number: 2 },
      ],
      3,
    );
    expect(map.get("a")).toBe(1);
    expect(map.get("b")).toBe(2);
  });
});

describe("visibleMatchResultRows", () => {
  it("drops unnumbered rows and games past best-of", () => {
    const rows = visibleMatchResultRows(
      [
        { id: "missing", player: "p1", lane: "gold" },
        { id: "g1", player: "p1", lane: "gold", game_number: 1 },
        { id: "g15", player: "p1", lane: "mid", game_number: 15 },
      ],
      3,
    );
    expect(rows.map((r) => r.id)).toEqual(["g1"]);
  });

  it("hides a game-1 dump of the same players and lanes", () => {
    const rows = visibleMatchResultRows(
      [
        { id: "a", player: "p1", lane: "gold", game_number: 1 },
        { id: "b", player: "p1", lane: "gold", game_number: 1 },
        { id: "c", player: "p1", lane: "mid", game_number: 1 },
        { id: "d", player: "p1", lane: "mid", game_number: 1 },
      ],
      3,
    );
    expect(rows).toEqual([]);
  });

  it("keeps the newest duplicate for the same player, game, and lane", () => {
    const rows = visibleMatchResultRows(
      [
        {
          id: "old",
          player: "p1",
          lane: "gold",
          game_number: 1,
          updated: "2026-09-01T01:00:00.000Z",
        },
        {
          id: "new",
          player: "p1",
          lane: "gold",
          game_number: 1,
          updated: "2026-09-01T03:00:00.000Z",
        },
        {
          id: "g2",
          player: "p1",
          lane: "gold",
          game_number: 2,
          updated: "2026-09-01T04:00:00.000Z",
        },
      ],
      3,
    );
    expect(rows.map((r) => r.id).sort()).toEqual(["g2", "new"]);
  });
});

describe("matchResultTabNumbers", () => {
  it("stays inside best-of even when dirty rows exist", () => {
    expect(
      matchResultTabNumbers(
        Array.from({ length: 15 }, (_, i) => ({
          id: String(i),
          player: "p1",
          game_number: 1,
        })),
        3,
      ),
    ).toEqual([1, 2, 3]);
  });
});

describe("storedGameNumber", () => {
  it("returns null when the field is missing", () => {
    expect(storedGameNumber({})).toBeNull();
    expect(storedGameNumber({ game_number: 0 })).toBeNull();
  });
});

describe("bestResultIdByLane", () => {
  it("picks the higher performance rating in a lane", () => {
    const best = bestResultIdByLane([
      {
        id: "weak",
        lane: "gold",
        game_performance_rating: 4,
        kills: 10,
        deaths: 1,
        assists: 10,
      },
      {
        id: "strong",
        lane: "gold",
        game_performance_rating: 9,
        kills: 1,
        deaths: 5,
        assists: 1,
      },
    ]);
    expect(best.get("gold")).toBe("strong");
  });
});
