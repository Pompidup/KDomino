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
      "1": {
        lords: 1,
        maxDominoes: 48,
        dominoesPerTurn: 4,
        maxTurns: 12,
        maxKingdomSize: 5,
      },
      "2": {
        lords: 2,
        maxDominoes: 24,
        dominoesPerTurn: 4,
        maxTurns: 6,
        maxKingdomSize: 5,
      },
      "3": {
        lords: 1,
        maxDominoes: 48,
        dominoesPerTurn: 4,
        maxTurns: 12,
        maxKingdomSize: 5,
      },
      "4": {
        lords: 1,
        maxDominoes: 48,
        dominoesPerTurn: 4,
        maxTurns: 12,
        maxKingdomSize: 5,
      },
    });
    expect(result).toHaveProperty("extraRules");
    expect(result.extraRules).toHaveLength(9);
    expect(result.extraRules.map((r) => r.name)).toEqual([
      "The middle Kingdom",
      "Harmony",
      "The Mighty Duel",
      "Dynasty",
      "Empire of Fire",
      "Homo Habilis",
      "Neolithic",
      "Dynasty",
      "Dynasty",
    ]);
    expect(result).toHaveProperty("aogBasic");
    expect(result.aogBasic).toEqual({
      "2": {
        lords: 2,
        maxDominoes: 30,
        dominoesPerTurn: 5,
        maxTurns: 6,
        maxKingdomSize: 5,
        dominoesDiscardedPerTurn: 1,
      },
      "3": {
        lords: 1,
        maxDominoes: 60,
        dominoesPerTurn: 5,
        maxTurns: 12,
        maxKingdomSize: 5,
        dominoesDiscardedPerTurn: 2,
      },
      "4": {
        lords: 1,
        maxDominoes: 60,
        dominoesPerTurn: 5,
        maxTurns: 12,
        maxKingdomSize: 5,
        dominoesDiscardedPerTurn: 1,
      },
      "5": {
        lords: 1,
        maxDominoes: 60,
        dominoesPerTurn: 5,
        maxTurns: 12,
        maxKingdomSize: 5,
        dominoesDiscardedPerTurn: 0,
      },
    });
  });

  test("should return all extra rules", () => {
    // Arrange
    const repository = jsonRules();

    // Act
    const result = repository.getAllExtra();

    // Assert
    expect(result.length).toBe(9);
  });
});
