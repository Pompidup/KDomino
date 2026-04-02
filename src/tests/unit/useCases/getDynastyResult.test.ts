import type { GameWithResults } from "@core/domain/types/index.js";
import { getDynastyResultUseCase } from "@core/useCases/getDynastyResult.js";
import { describe, expect, test } from "vitest";

const makeGameResult = (
  results: { playerId: string; playerName: string; points: number }[],
): GameWithResults => ({
  id: "game-id",
  dominoes: [],
  currentDominoes: [],
  players: [],
  lords: [],
  turn: 0,
  nextAction: { type: "step", step: "result" },
  rules: {
    basic: {
      lords: 2,
      maxDominoes: 24,
      dominoesPerTurn: 4,
      maxTurns: 6,
      maxKingdomSize: 5,
    },
    extra: [],
  },
  mode: { name: "Classic", description: "Classic mode" },
  result: results.map((r, i) => ({
    playerId: r.playerId,
    playerName: r.playerName,
    details: { points: r.points, maxPropertiesSize: 0, totalCrowns: 0 },
    position: i + 1,
  })),
});

describe("getDynastyResult", () => {
  test("should sum points across 3 games and rank players", () => {
    const games = [
      makeGameResult([
        { playerId: "p1", playerName: "Alice", points: 30 },
        { playerId: "p2", playerName: "Bob", points: 20 },
      ]),
      makeGameResult([
        { playerId: "p1", playerName: "Alice", points: 10 },
        { playerId: "p2", playerName: "Bob", points: 25 },
      ]),
      makeGameResult([
        { playerId: "p1", playerName: "Alice", points: 15 },
        { playerId: "p2", playerName: "Bob", points: 30 },
      ]),
    ];

    const result = getDynastyResultUseCase(games);

    expect(result).toEqual([
      {
        playerId: "p2",
        playerName: "Bob",
        totalPoints: 75,
        gamesPoints: [20, 25, 30],
        position: 1,
      },
      {
        playerId: "p1",
        playerName: "Alice",
        totalPoints: 55,
        gamesPoints: [30, 10, 15],
        position: 2,
      },
    ]);
  });

  test("should handle tied dynasty scores", () => {
    const games = [
      makeGameResult([
        { playerId: "p1", playerName: "Alice", points: 20 },
        { playerId: "p2", playerName: "Bob", points: 20 },
      ]),
    ];

    const result = getDynastyResultUseCase(games);

    expect(result[0]!.position).toBe(1);
    expect(result[1]!.position).toBe(1);
  });

  test("should work with a single game", () => {
    const games = [
      makeGameResult([{ playerId: "p1", playerName: "Alice", points: 42 }]),
    ];

    const result = getDynastyResultUseCase(games);

    expect(result).toHaveLength(1);
    expect(result[0]!.totalPoints).toBe(42);
    expect(result[0]!.position).toBe(1);
  });
});
