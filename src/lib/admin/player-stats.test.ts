import { describe, expect, it } from "vitest";
import { computePlayerStats } from "./player-stats";

const teams = [
  { id: "t1", name: "Alpha" },
  { id: "t2", name: "Bravo" },
];

const matches = [
  {
    id: "m1",
    teamA: "t1",
    teamB: "t2",
    winner: "t1",
    scoreA: 2,
    scoreB: 1,
    status: "completed",
  },
];

const participants = [
  { id: "p1", team: "t1", name: "Ada", ign: "ADA" },
  { id: "p2", team: "t2", name: "Bea", ign: "BEA" },
  { id: "p3", team: "t1", name: "Cam", ign: "CAM" },
];

describe("computePlayerStats", () => {
  it("picks the best player in each lane by score", () => {
    const result = computePlayerStats({
      teams,
      matches,
      participants,
      matchResults: [
        {
          match: "m1",
          player: "p1",
          lane: "gold",
          kills: 8,
          deaths: 1,
          assists: 4,
          game_performance_rating: 9,
          accumulated_gold: 12000,
        },
        {
          match: "m1",
          player: "p2",
          lane: "gold",
          kills: 2,
          deaths: 6,
          assists: 1,
          game_performance_rating: 4,
          accumulated_gold: 8000,
        },
        {
          match: "m1",
          player: "p3",
          lane: "mid",
          kills: 5,
          deaths: 2,
          assists: 5,
          game_performance_rating: 8,
          accumulated_gold: 11000,
        },
      ],
    });

    expect(result.bestByLane.gold?.playerId).toBe("p1");
    expect(result.bestByLane.mid?.playerId).toBe("p3");
    expect(result.bestByLane.exp).toBeUndefined();
    expect(result.bestByLane.gold?.avgKda).toBeCloseTo(12);
  });

  it("aggregates individual stats across lanes", () => {
    const result = computePlayerStats({
      teams,
      matches,
      participants,
      matchResults: [
        {
          match: "m1",
          player: "p1",
          lane: "gold",
          kills: 4,
          deaths: 1,
          assists: 2,
          game_performance_rating: 8,
          accumulated_gold: 10000,
        },
        {
          match: "m1",
          player: "p1",
          lane: "mid",
          kills: 2,
          deaths: 1,
          assists: 4,
          game_performance_rating: 6,
          accumulated_gold: 8000,
        },
      ],
    });

    expect(result.players).toHaveLength(1);
    const row = result.players[0];
    expect(row?.playerId).toBe("p1");
    expect(row?.games).toBe(2);
    expect(row?.kills).toBe(6);
    expect(row?.assists).toBe(6);
    expect(row?.avgPerformanceRating).toBe(7);
    expect(row?.avgGold).toBe(9000);
    expect(row?.primaryLane).toBe("gold");
  });

  it("ignores results from matches missing a side or unknown players", () => {
    const result = computePlayerStats({
      teams,
      matches: [{ id: "open", teamA: "t1", status: "scheduled" }],
      participants,
      matchResults: [
        {
          match: "open",
          player: "p1",
          lane: "gold",
          kills: 10,
          deaths: 0,
          assists: 0,
          game_performance_rating: 10,
        },
        {
          match: "m1",
          player: "ghost",
          lane: "gold",
          kills: 10,
          deaths: 0,
          assists: 0,
          game_performance_rating: 10,
        },
      ],
    });

    expect(result.players).toEqual([]);
    expect(result.laneRankings).toEqual([]);
  });
});
