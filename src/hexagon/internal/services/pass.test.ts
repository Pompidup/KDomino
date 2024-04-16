import { describe, expect, test } from "vitest";
import { PlayerActionPayload } from "./game.js";
import helper from "../../../utils/testHelpers.js";
import { pass } from "./pass.js";
import inMemoryDominoes from "../../../adapters/driven/inMemoryDominoes.js";

describe("Game Pass", () => {
  test("should pass turn", () => {
    // Arrange
    const setup = helper().setupGame(2, inMemoryDominoes().getAll());

    const payload: PlayerActionPayload<"pass"> = {
      lordId: setup.lords[0].id,
      action: "pass",
      data: {
        state: setup,
      },
    };

    // Act
    const newState = pass(payload);

    // Act
    expect(newState.lords[0].hasPlace).toEqual(true);
  });
});
