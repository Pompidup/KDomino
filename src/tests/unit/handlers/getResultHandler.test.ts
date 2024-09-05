import { describe, expect, test } from "vitest";
import type { GetResultCommand } from "@application/commands/getResultCommand.js";
import { getResultHandler } from "@application/handlers/getResultHandler.js";
import type {
  NextStep,
  GameWithResults,
} from "@core/domain/types/game.js";
import type { GetResultUseCase } from "@core/useCases/getResult.js";
import { err, ok } from "@utils/result.js";
import { createGameBuilder } from "./../../builder/game.js";

describe("getResultHandler", () => {
  test("should throw an error if the next action step is not 'result'", () => {
    // Arrange
    const game = createGameBuilder<NextStep>()
      .withNextAction({ type: "step", step: "addPlayers" })
      .build();

    const mockUseCase: GetResultUseCase = () => {
      throw new Error("This should not be called");
    };

    const handler = getResultHandler(mockUseCase);

    const command: GetResultCommand = {
      game,
    };

    // Act
    const act = () => handler(command);

    // Assert
    expect(act).toThrowError("Required game with result step");
  });

  test("should throw an error if the use case returns an error", () => {
    // Arrange
    const game = createGameBuilder<NextStep>()
      .withNextAction({ type: "step", step: "result" })
      .build();

    const mockUseCase: GetResultUseCase = () => err("use case failed");
    const handler = getResultHandler(mockUseCase);

    const command: GetResultCommand = {
      game,
    };

    // Act
    const act = () => handler(command);

    // Assert
    expect(act).toThrowError("use case failed");
  });

  test("should return the result value if the use case succeeds", () => {
    // Arrange
    const game = createGameBuilder<NextStep>()
      .withNextAction({ type: "step", step: "result" })
      .build();

    const expectedResult: GameWithResults = {
      ...game,
      result: [],
    };

    const mockUseCase: GetResultUseCase = () => ok(expectedResult);

    const handler = getResultHandler(mockUseCase);

    const command: GetResultCommand = {
      game,
    };

    // Act
    const result = handler(command);

    // Assert
    expect(result).toBe(expectedResult);
  });
});
