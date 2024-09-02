import { describe, test, expect } from "vitest";
import jsonRules from "../../adapterServerside/jsonRules.js";

describe("jsonRules", () => {
  test("should return all rules", () => {
    // Arrange
    const repository = jsonRules();

    // Act
    const result = repository.getAll();

    // Assert
    expect(result).toHaveProperty("basic");
    expect(result.basic).toEqual({
      "2": { lords: 2, maxDominoes: 24, dominoesPerTurn: 4, maxTurns: 6 },
      "3": { lords: 1, maxDominoes: 36, dominoesPerTurn: 3, maxTurns: 12 },
      "4": { lords: 1, maxDominoes: 48, dominoesPerTurn: 4, maxTurns: 12 },
    });
    expect(result).toHaveProperty("extraRules");
    expect(result.extraRules).toEqual([
      {
        name: "The middle Kingdom",
        description:
          "Gain 10 additional points if your castle is in the middle of the kingdom.",
        mode: [{ name: "Classic", description: "King Domino classic mode" }],
      },
      {
        name: "Harmony",
        description:
          "Gain 5 additional points if your kingdom is complete (no discarded dominoes).",
        mode: [{ name: "Classic", description: "King Domino classic mode" }],
      },
    ]);
  });

  test("should return all extra rules", () => {
    // Arrange
    const repository = jsonRules();

    // Act
    const result = repository.getAllExtra();

    // Assert
    expect(result.length).toBe(2);
  });
});
