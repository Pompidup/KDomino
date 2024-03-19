import inMemoryDominoes from "../../../infrastructure/repositories/inMemoryDominoes.js";
import { order } from "./order.js";
import { describe, test, expect } from "vitest";
import helper from "../../../utils/testHelpers.js";

describe("Game Order", () => {
  test("should throw if not all dominoes have been picked", async () => {
    // Arrange
    const setup = helper().setupGame(
      2,
      await inMemoryDominoes().getAll(),
      false,
      true
    );

    setup.currentDominoes[0]!.picked = false;
    setup.kings[0]!.hasPick = false;
    setup.kings[0]!.turnEnded = false;

    const useCase = order();

    const payload = {
      state: setup,
    };

    // Act
    const state = useCase(payload);

    // Assert
    await expect(state).rejects.toThrow("Not all kings have played");
  });

  test("should update order", async () => {
    // Arrange
    const setup = helper().setupGame(
      2,
      await inMemoryDominoes().getAll(),
      false,
      true
    );

    const useCase = order();

    const payload = {
      state: setup,
    };

    // Act
    const state = await useCase(payload);

    // Assert
    expect(state.order).toEqual({
      1: "uuid-4",
      2: "uuid-3",
      3: "uuid-2",
      4: "uuid-1",
    });
    expect(state.kings[0]!.order).toEqual(4);
    expect(state.kings[1]!.order).toEqual(3);
    expect(state.kings[2]!.order).toEqual(2);
    expect(state.kings[3]!.order).toEqual(1);
  });
});
