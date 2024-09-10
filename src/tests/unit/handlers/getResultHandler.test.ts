import { describe, expect, test } from "vitest";
import type { GetResultCommand } from "@application/commands/getResultCommand.js";
import { getResultHandler } from "@application/handlers/getResultHandler.js";
import type {
  NextStep,
  GameWithResults,
  NextAction,
} from "@core/domain/types/game.js";
import { err, ok } from "@utils/result.js";
import { createGameBuilder } from "./../../builder/game.js";
import { winstonLogger } from "@adapter/winstonLogger.js";

describe("getResultHandler", () => {
  const logger = winstonLogger(false);

  test("should throw an error if the game is not with next step", () => {
    // Arrange
    const game = createGameBuilder<NextAction>().build();

    const useCasesDeps = {
      getResultUseCase: () => {
        throw new Error("This should not be called");
      },
      calculateScoreUseCase: () => {
        throw new Error("This should not be called");
      },
    };

    const handler = getResultHandler(logger, useCasesDeps);

    const command: GetResultCommand = {
      game,
    };

    // Act
    const act = () => handler(command);

    // Assert
    expect(act).toThrowError("Required game with nextAction type: 'step'");
  });

  test("should throw an error if the next action step is not 'result'", () => {
    // Arrange
    const game = createGameBuilder<NextStep>()
      .withNextAction({ type: "step", step: "addPlayers" })
      .build();

    const useCasesDeps = {
      getResultUseCase: () => {
        throw new Error("This should not be called");
      },
      calculateScoreUseCase: () => {
        throw new Error("This should not be called");
      },
    };

    const handler = getResultHandler(logger, useCasesDeps);

    const command: GetResultCommand = {
      game,
    };

    // Act
    const act = () => handler(command);

    // Assert
    expect(act).toThrowError("Required game with result step");
  });

  test("should throw an error if the calculate score use case return an error", () => {
    // Arrange
    const game = createGameBuilder<NextStep>()
      .withAllDefaults()
      .withNextAction({ type: "step", step: "result" })
      .build();

    const useCasesDeps = {
      getResultUseCase: () => {
        throw new Error("This should not be called");
      },
      calculateScoreUseCase: () => err("use case failed"),
    };

    const handler = getResultHandler(logger, useCasesDeps);

    const command: GetResultCommand = {
      game,
    };

    // Act
    const act = () => handler(command);

    // Assert
    expect(act).toThrowError("use case failed");
  });

  test("should throw an error if get result use case returns an error", () => {
    // Arrange
    const game = createGameBuilder<NextStep>()
      .withNextAction({ type: "step", step: "result" })
      .build();

    const score = { points: 0, maxPropertiesSize: 0, totalCrowns: 0 };

    const useCasesDeps = {
      getResultUseCase: () => err("use case failed"),
      calculateScoreUseCase: () => ok(score),
    };

    const handler = getResultHandler(logger, useCasesDeps);

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

    const score = { points: 0, maxPropertiesSize: 0, totalCrowns: 0 };

    const scoreResult = [
      {
        playerId: game.players[0]?.id!,
        playerName: game.players[0]?.name!,
        details: score,
        position: 1,
      },
      {
        playerId: game.players[1]?.id!,
        playerName: game.players[1]?.name!,
        details: score,
        position: 1,
      },
    ];

    const expectedResult: GameWithResults = {
      ...game,
      result: scoreResult,
    };

    const useCasesDeps = {
      getResultUseCase: () => ok(expectedResult),
      calculateScoreUseCase: () => ok(score),
    };

    const handler = getResultHandler(logger, useCasesDeps);

    const command: GetResultCommand = {
      game,
    };

    // Act
    const result = handler(command);

    // Assert
    expect(result).toBe(expectedResult);
  });
});
