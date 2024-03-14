import { expect, test, beforeAll, describe } from "vitest";
import inMemoryDominoes from "../../../infrastructure/repositories/inMemoryDominoes.js";
import { draw } from "./draw.js";
import type { Game } from "../../entities/game.js";

describe("Game Draw", () => {
  let state: Game;

  beforeAll(async () => {
    const dominoes = await inMemoryDominoes().getAll();
    const currentDominoes = dominoes.splice(0, 4);

    state = {
      id: "uuid-test",
      dominoes,
      currentDominoes: currentDominoes.map((domino, index) => {
        return {
          domino,
          picked: false,
          kingId: null,
          position: index + 1,
        };
      }),
      players: [],
      kings: [],
      turn: 1,
      maxTurns: 12,
      maxDominoes: 48,
      dominoesPerTurn: 4,
      order: {},
    };
  });

  test("should draw dominoes", async () => {
    // Arrange
    const useCase = draw();

    const payload = {
      state,
    };

    // Act
    const newState = await useCase(payload);

    // Assert
    expect(newState.dominoes.length).toEqual(40);
    expect(newState.currentDominoes.length).toEqual(4);
  });
});
