import { winstonLogger } from "@adapter/winstonLogger.js";
import { calculateScoreHandler } from "@application/handlers/calculateScoreHandler.js";
import type { Kingdom } from "@core/domain/types";
import { err, ok } from "@utils/result.js";
import { describe, expect, test } from "vitest";

describe("calculateScoreHandler", () => {
  const logger = winstonLogger(false);

  test("should throw an error if useCase failed", () => {
    // Arrange
    const kingdom = [[]];

    const mockUseCase = () => err("use case failed");

    const handler = calculateScoreHandler(logger, mockUseCase);

    const command = {
      kingdom,
    };

    // Act
    const act = () => handler(command);

    // Assert
    expect(act).toThrowError("use case failed");
  });

  test("should return the result value if the use case succeeds", () => {
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

    const expectedResult = {
      points: 24,
      maxPropertiesSize: 24,
      totalCrowns: 1,
    };

    const mockUseCase = () => ok(expectedResult);

    const handler = calculateScoreHandler(logger, mockUseCase);

    const command = {
      kingdom,
    };

    // Act
    const result = handler(command);

    // Assert
    expect(result).toEqual(expectedResult);
  });
});
