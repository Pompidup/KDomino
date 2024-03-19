import { describe, expect, test } from "vitest";
import { PlayerActionPayload } from "./game.js";
import helper from "../../../utils/testHelpers.js";
import inMemoryDominoes from "../../../infrastructure/repositories/inMemoryDominoes.js";
import { pass } from "./pass.js";

describe("Game Pass", () => {
  test("should pass turn", async () => {
    // Arrange
    const setup = helper().setupGame(2, await inMemoryDominoes().getAll());

    const payload: PlayerActionPayload<"pass"> = {
      kingId: setup.kings[0].id,
      action: "pass",
      data: {
        state: setup,
      },
    };

    // Act
    const newState = pass(payload);

    // Act
    expect(newState.kings[0].hasPlace).toEqual(true);
  });
});
