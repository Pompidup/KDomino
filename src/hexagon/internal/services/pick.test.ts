import { pick as useCase } from "./pick.js";
import { playerAction } from "./game.js";
import { describe, test, expect } from "vitest";
import helper from "../../../utils/testHelpers.js";
import inMemoryDominoes from "../../../adapters/driven/inMemoryDominoes.js";

describe("Game Pick", () => {
  test("should save player choice", async () => {
    // Arrange
    const setup = helper().setupGame(2, inMemoryDominoes().getAll());

    const payload = {
      lordId: "uuid-1",
      action: playerAction.pick,
      data: {
        state: setup,
        dominoPick: setup.currentDominoes[0]!.domino.number,
      },
    };

    // Act
    const state = useCase(payload);

    // Assert
    expect(state.currentDominoes[0]!.picked).toEqual(true);
    expect(state.currentDominoes[0]!.lordId).toEqual("uuid-1");
    expect(state.lords[0]!.hasPick).toEqual(true);
    expect(state.lords[0]!.turnEnded).toEqual(true);
  });

  test("should throw if it is not the player turn", async () => {
    // Arrange
    const setup = helper().setupGame(2, inMemoryDominoes().getAll());

    const payload = {
      lordId: "uuid-2",
      action: playerAction.pick,
      data: {
        state: setup,
        dominoPick: setup.currentDominoes[0]!.domino.number,
      },
    };

    // Act
    // Assert
    expect(() => useCase(payload)).toThrow("It is not your turn");
  });

  test("should throw if the player choose an invalid domino", async () => {
    // Arrange
    const setup = helper().setupGame(2, inMemoryDominoes().getAll());

    const payload = {
      lordId: "uuid-1",
      action: playerAction.pick,
      data: {
        state: setup,
        dominoPick: 999,
      },
    };

    // Act
    // Assert
    expect(() => useCase(payload)).toThrow("Domino not found");
  });

  test("should throw if player choose an already picked domino", async () => {
    // Arrange
    const setup = helper().setupGame(2, inMemoryDominoes().getAll());
    setup.currentDominoes[0]!.picked = true;
    setup.currentDominoes[0]!.lordId = "uuid-1";

    const payload = {
      lordId: "uuid-2",
      action: playerAction.pick,
      data: {
        state: setup,
        dominoPick: setup.currentDominoes[0]!.domino.number,
      },
    };

    // Act
    // Assert
    expect(() => useCase(payload)).toThrow("Domino already picked");
  });
});
