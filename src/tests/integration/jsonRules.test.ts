import { describe, expect, test } from "vitest";
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
      "1": { lords: 1, maxDominoes: 48, dominoesPerTurn: 4, maxTurns: 12, maxKingdomSize: 5 },
      "2": { lords: 2, maxDominoes: 24, dominoesPerTurn: 4, maxTurns: 6, maxKingdomSize: 5 },
      "3": { lords: 1, maxDominoes: 48, dominoesPerTurn: 4, maxTurns: 12, maxKingdomSize: 5 },
      "4": { lords: 1, maxDominoes: 48, dominoesPerTurn: 4, maxTurns: 12, maxKingdomSize: 5 },
    });
    expect(result).toHaveProperty("extraRules");
    expect(result.extraRules).toHaveLength(4);
    expect(result.extraRules.map((r) => r.name)).toEqual([
      "The middle Kingdom",
      "Harmony",
      "The Mighty Duel",
      "Dynasty",
    ]);
    for (const rule of result.extraRules) {
      expect(rule.mode.map((m) => m.name)).toContain("Classic");
      expect(rule.mode.map((m) => m.name)).toContain("QueenDomino");
    }
  });

  test("should return all extra rules", () => {
    // Arrange
    const repository = jsonRules();

    // Act
    const result = repository.getAllExtra();

    // Assert
    expect(result.length).toBe(4);
  });
});
