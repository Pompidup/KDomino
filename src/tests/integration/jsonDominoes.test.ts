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

  test("should return 60 dominoes for AgeOfGiants mode", () => {
    const repository = jsonDominoes();
    const mode: GameMode = {
      name: "AgeOfGiants",
      description: "Age of Giants",
    };

    const result = repository.getForMode(mode);
    expect(result.length).toBe(60);
  });

  test("should return 60 dominoes for AgeOfGiants-QueenDomino mode", () => {
    const repository = jsonDominoes();
    const mode: GameMode = {
      name: "AgeOfGiants-QueenDomino",
      description: "AoG + QD",
    };

    const result = repository.getForMode(mode);
    expect(result.length).toBe(60);
  });

  test("should have giant dominos with letter and hasGiant flag", () => {
    const repository = jsonDominoes();
    const mode: GameMode = {
      name: "AgeOfGiants",
      description: "Age of Giants",
    };

    const dominoes = repository.getForMode(mode);
    const giantDominos = dominoes.filter(
      (d) => d.left.hasGiant || d.right.hasGiant,
    );
    expect(giantDominos.length).toBe(6);
    for (const d of giantDominos) {
      expect(d.letter).toBeDefined();
      expect(d.number).toBeLessThan(1);
    }
  });

  test("should have footprint dominos with hasFootprint flag", () => {
    const repository = jsonDominoes();
    const mode: GameMode = {
      name: "AgeOfGiants",
      description: "Age of Giants",
    };

    const dominoes = repository.getForMode(mode);
    const footprintDominos = dominoes.filter(
      (d) => d.left.hasFootprint || d.right.hasFootprint,
    );
    expect(footprintDominos.length).toBe(6);
    for (const d of footprintDominos) {
      expect(d.number).toBeGreaterThanOrEqual(49);
      expect(d.number).toBeLessThanOrEqual(54);
    }
  });

  test("letter dominos sort before numbered dominos", () => {
    const repository = jsonDominoes();
    const mode: GameMode = {
      name: "AgeOfGiants",
      description: "Age of Giants",
    };

    const dominoes = repository.getForMode(mode);
    const sorted = [...dominoes].sort((a, b) => a.number - b.number);

    // First 6 should be letter dominos
    for (let i = 0; i < 6; i++) {
      expect(sorted[i]!.letter).toBeDefined();
      expect(sorted[i]!.number).toBeLessThan(1);
    }
    // Remaining should be numbered >= 1
    for (let i = 6; i < sorted.length; i++) {
      expect(sorted[i]!.number).toBeGreaterThanOrEqual(1);
    }
  });
});
