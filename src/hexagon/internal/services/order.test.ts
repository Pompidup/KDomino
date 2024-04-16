import { definePlayerOrder as useCase } from "./order.js";
import { describe, test, expect } from "vitest";
import helper from "../../../utils/testHelpers.js";
import inMemoryDominoes from "../../../adapters/driven/inMemoryDominoes.js";

describe("Game Order", () => {
  test("should throw if not all dominoes have been picked", async () => {
    // Arrange
    const setup = helper().setupGame(
      2,
      inMemoryDominoes().getAll(),
      false,
      true
    );

    setup.currentDominoes[0]!.picked = false;
    setup.lords[0]!.hasPick = false;
    setup.lords[0]!.turnEnded = false;

    const payload = {
      state: setup,
    };

    // Act
    // Assert
    expect(() => useCase(payload)).toThrow("Not all lords have played");
  });

  test("should update order", async () => {
    // Arrange
    const setup = helper().setupGame(
      2,
      inMemoryDominoes().getAll(),
      false,
      true
    );

    const payload = {
      state: setup,
    };

    // Act
    const state = useCase(payload);

    // Assert
    expect(state.order).toEqual({
      1: "uuid-4",
      2: "uuid-3",
      3: "uuid-2",
      4: "uuid-1",
    });
    expect(state.lords[0]!.order).toEqual(4);
    expect(state.lords[1]!.order).toEqual(3);
    expect(state.lords[2]!.order).toEqual(2);
    expect(state.lords[3]!.order).toEqual(1);
  });
});
