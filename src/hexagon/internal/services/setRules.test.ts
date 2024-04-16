import { describe, expect, test } from "vitest";
import { setRules } from "./setRules.js";

describe("Set Game rules", () => {
  test("Should set rules to the game", () => {
    // Arrange
    const payload = {
      state: {
        id: "uuid-test",
        dominoes: [],
        currentDominoes: [],
        players: [],
        lords: [],
        turn: 0,
        maxTurns: 0,
        maxDominoes: 0,
        dominoesPerTurn: 0,
        order: {},
      },
      rules: ["Harmony", "The middle Kingdom"],
    };

    // Act
    const newState = setRules(payload);

    // Assert
    expect(newState.rules).toEqual([
      {
        name: "Harmony",
        description:
          "Gain 5 additional points if your kingdom is complete (no discarded dominoes).",
        mode: ["Classic"],
      },
      {
        name: "The middle Kingdom",
        description:
          "Gain 10 additional points if your castle is in the middle of the kingdom.",
        mode: ["Classic"],
      },
    ]);
  });
});
