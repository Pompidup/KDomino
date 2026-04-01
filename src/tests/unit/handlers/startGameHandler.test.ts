import { winstonLogger } from "@adapter/winstonLogger.js";
import type { StartGameCommand } from "@application/commands/startGameCommand.js";
import { startGameHandler } from "@application/handlers/startGameHandler.js";
import { ErrorCode } from "@core/domain/errors/domainErrors.js";
import type {
  GameWithNextAction,
  NextAction,
  NextStep,
} from "@core/domain/types/game.js";
import { defaultTranslator } from "@core/i18n/translations.js";
import type { StartGameUseCase } from "@core/useCases/startGame.js";
import { err, ok } from "@utils/result.js";
import { describe, expect, test } from "vitest";
import { createGameBuilder } from "../../builder/game.js";

describe("startGameHandler", () => {
  const logger = winstonLogger(false);

  test("should throw an error if the game is not with next step", () => {
    // Arrange
    const mockUseCase: StartGameUseCase = () => {
      throw new Error("This should not be called");
    };
    const handler = startGameHandler(logger, defaultTranslator, mockUseCase);

    const game = createGameBuilder<NextAction>().build();

    const command: StartGameCommand = { game };

    // Act
    const act = () => handler(command);

    // Assert
    expect(act).toThrowError("Invalid game step");
  });

  test("should throw an error if the next action step is not 'start' or 'options'", () => {
    // Arrange
    const mockUseCase: StartGameUseCase = () => {
      throw new Error("This should not be called");
    };
    const handler = startGameHandler(logger, defaultTranslator, mockUseCase);

    const game = createGameBuilder<NextStep>()
      .withNextAction({ type: "step", step: "addPlayers" })
      .build();

    const command: StartGameCommand = { game };

    // Act
    const act = () => handler(command);

    // Assert
    expect(act).toThrowError("Invalid game step");
  });

  test("should call the use case and return the result if the next action step is 'start'", () => {
    // Arrange

    const game = createGameBuilder<NextStep>()
      .withNextAction({ type: "step", step: "start" })
      .build();

    const expectedGame: GameWithNextAction = {
      ...game,
      nextAction: {
        type: "action",
        nextLord: "nextLord",
        nextAction: "pickDomino",
      },
    };

    const mockUseCase: StartGameUseCase = () => ok(expectedGame);
    const handler = startGameHandler(logger, defaultTranslator, mockUseCase);
    const command: StartGameCommand = { game };

    // Act
    const result = handler(command);

    // Assert
    expect(result).toEqual(expectedGame);
  });

  test("should call the use case and return the result if the next action step is 'options'", () => {
    // Arrange

    const game = createGameBuilder<NextStep>()
      .withNextAction({ type: "step", step: "options" })
      .build();

    const expectedGame: GameWithNextAction = {
      ...game,
      nextAction: {
        type: "action",
        nextLord: "nextLord",
        nextAction: "pickDomino",
      },
    };

    const mockUseCase: StartGameUseCase = () => ok(expectedGame);
    const handler = startGameHandler(logger, defaultTranslator, mockUseCase);
    const command: StartGameCommand = { game };

    // Act
    const result = handler(command);

    // Assert
    expect(result).toEqual(expectedGame);
  });

  test("should throw an error if the use case returns an error", () => {
    // Arrange
    const mockUseCase: StartGameUseCase = () =>
      err(ErrorCode.STEP_EXECUTION_FAILED);
    const handler = startGameHandler(logger, defaultTranslator, mockUseCase);

    const game = createGameBuilder<NextStep>()
      .withNextAction({ type: "step", step: "start" })
      .build();

    const command: StartGameCommand = { game };

    // Act
    const act = () => handler(command);

    // Assert
    expect(act).toThrowError("Step execution failed");
  });
});
