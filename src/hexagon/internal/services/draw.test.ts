import { expect, test, beforeAll, describe } from "vitest";
import { draw as useCase } from "./draw.js";
import inMemoryDominoes from "../../../adapters/driven/inMemoryDominoes.js";
import { Game } from "../entities/game.js";

describe("Game Draw", () => {
  let state: Game;

  beforeAll(async () => {
    const dominoes = inMemoryDominoes().getAll();
    const currentDominoes = dominoes.splice(0, 4);

    state = {
      id: "uuid-test",
      dominoes,
      currentDominoes: currentDominoes.map((domino, index) => {
        return {
          domino,
          picked: false,
          lordId: null,
          position: index + 1,
        };
      }),
      players: [],
      lords: [],
      turn: 1,
      maxTurns: 12,
      maxDominoes: 48,
      dominoesPerTurn: 4,
      order: {},
    };
  });

  test("should draw dominoes", async () => {
    // Arrange
    const payload = {
      state,
    };

    // Act
    const newState = useCase(payload);

    // Assert
    expect(newState.dominoes.length).toEqual(40);
    expect(newState.currentDominoes.length).toEqual(4);
  });
});
