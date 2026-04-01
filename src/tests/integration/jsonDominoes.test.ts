import jsonDominoes from "@adapter/jsonDominoes";
import type { GameMode } from "@core/domain/types/mode";
import { describe, expect, test } from "vitest";

describe("jsonDominoes", () => {
  test("should return dominoes for a given game mode", () => {
    // Arrange
    const repository = jsonDominoes();
    const mode: GameMode = { name: "Classic", description: "Classic mode" };

    // Act
    const result = repository.getForMode(mode);

    // Assert
    expect(result.length).toBe(48);
  });

  test("should return an empty array for an unknown game mode", () => {
    const repository = jsonDominoes();
    const mode: GameMode = { name: "unknown", description: "Unknown mode" };

    const result = repository.getForMode(mode);
    expect(result).toEqual([]);
  });

  test("should return 48 dominoes for QueenDomino mode", () => {
    const repository = jsonDominoes();
    const mode: GameMode = {
      name: "QueenDomino",
      description: "Queendomino expansion",
    };

    const result = repository.getForMode(mode);
    expect(result.length).toBe(48);
  });

  test("should include construction squares on some QueenDomino tiles", () => {
    const repository = jsonDominoes();
    const mode: GameMode = {
      name: "QueenDomino",
      description: "Queendomino expansion",
    };

    const dominoes = repository.getForMode(mode);
    const tilesWithCS = dominoes.filter(
      (d) => d.left.hasConstructionSquare || d.right.hasConstructionSquare,
    );
    expect(tilesWithCS.length).toBeGreaterThan(0);
    expect(tilesWithCS.length).toBeLessThanOrEqual(48);
  });

  test("should not have construction squares on Classic dominoes", () => {
    const repository = jsonDominoes();
    const mode: GameMode = { name: "Classic", description: "Classic mode" };

    const dominoes = repository.getForMode(mode);
    const tilesWithCS = dominoes.filter(
      (d) => d.left.hasConstructionSquare || d.right.hasConstructionSquare,
    );
    expect(tilesWithCS.length).toBe(0);
  });
});
