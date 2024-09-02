import { describe, test, expect } from "vitest";
import jsonDominoes from "../../adapterServerside/jsonDominoes";
import { GameMode } from "../../core/domain/types";

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
});
