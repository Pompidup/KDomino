import type { Kingdom } from "@core/domain/types/kingdom.js";
import { calculateScoreUseCase } from "@core/useCases/calculateScore.js";
import { unwrap } from "@utils/result.js";
import { describe, expect, test } from "vitest";

describe("calculateScore", () => {
  test("should calculate the score for an empty kingdom", () => {
    // Arrange
    const kingdom: Kingdom = [
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "castle", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
    ];

    // Act
    const result = calculateScoreUseCase(kingdom);

    // Assert
    const unwrapResult = unwrap(result);
    expect(unwrapResult).toEqual({
      points: 0,
      maxPropertiesSize: 0,
      totalCrowns: 0,
    });
  });

  test("should calculate the score for a kingdom with a single property and no crowns", () => {
    // Arrange
    const initialGrid: Kingdom = [
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "castle", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
    ];

    // Act
    const result = calculateScoreUseCase(initialGrid);

    // Assert
    const unwrapResult = unwrap(result);
    expect(unwrapResult).toEqual({
      points: 0,
      maxPropertiesSize: 24,
      totalCrowns: 0,
    });
  });

  test("should calculate the score for a kingdom with a single property and 1 crowns", () => {
    // Arrange
    const initialGrid: Kingdom = [
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "wheat", crowns: 1 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "castle", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
    ];

    // Act
    const result = calculateScoreUseCase(initialGrid);

    // Assert
    const unwrapResult = unwrap(result);
    expect(unwrapResult).toEqual({
      points: 24,
      maxPropertiesSize: 24,
      totalCrowns: 1,
    });
  });

  test("should calculate the score for a kingdom with a single property and 5 crowns", () => {
    // Arrange
    const initialGrid: Kingdom = [
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "wheat", crowns: 1 },
        { type: "wheat", crowns: 1 },
        { type: "wheat", crowns: 1 },
        { type: "wheat", crowns: 1 },
        { type: "wheat", crowns: 1 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "castle", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
    ];

    // Act
    const result = calculateScoreUseCase(initialGrid);

    // Assert
    const unwrapResult = unwrap(result);
    expect(unwrapResult).toEqual({
      points: 120,
      maxPropertiesSize: 24,
      totalCrowns: 5,
    });
  });

  test("should calculate the score for a kingdom with multiple properties", () => {
    // Arrange
    const initialGrid: Kingdom = [
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "swamp", crowns: 1 },
        { type: "swamp", crowns: 0 },
        { type: "swamp", crowns: 0 },
        { type: "swamp", crowns: 0 },
        { type: "swamp", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "wheat", crowns: 1 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "forest", crowns: 1 },
        { type: "forest", crowns: 0 },
        { type: "castle", crowns: 0 },
        { type: "sea", crowns: 1 },
        { type: "sea", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "plain", crowns: 0 },
        { type: "plain", crowns: 1 },
        { type: "plain", crowns: 0 },
        { type: "plain", crowns: 0 },
        { type: "plain", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "mine", crowns: 1 },
        { type: "mine", crowns: 0 },
        { type: "mine", crowns: 0 },
        { type: "mine", crowns: 0 },
        { type: "mine", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
    ];

    // Act
    const result = calculateScoreUseCase(initialGrid);

    // Assert
    const unwrapResult = unwrap(result);
    expect(unwrapResult).toEqual({
      points: 24,
      maxPropertiesSize: 5,
      totalCrowns: 6,
    });
  });

  test("should calculate the score for a kingdom with several properties of same type", () => {
    // Arrange
    const initialGrid: Kingdom = [
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "swamp", crowns: 2 },
        { type: "swamp", crowns: 0 },
        { type: "swamp", crowns: 0 },
        { type: "swamp", crowns: 0 },
        { type: "swamp", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "wheat", crowns: 2 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "swamp", crowns: 1 },
        { type: "swamp", crowns: 0 },
        { type: "castle", crowns: 0 },
        { type: "swamp", crowns: 1 },
        { type: "swamp", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 1 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "swamp", crowns: 1 },
        { type: "swamp", crowns: 0 },
        { type: "swamp", crowns: 0 },
        { type: "swamp", crowns: 0 },
        { type: "swamp", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
    ];

    // Act
    const result = calculateScoreUseCase(initialGrid);

    // Assert
    const unwrapResult = unwrap(result);
    expect(unwrapResult).toEqual({
      points: 34,
      maxPropertiesSize: 5,
      totalCrowns: 8,
    });
  });
});
