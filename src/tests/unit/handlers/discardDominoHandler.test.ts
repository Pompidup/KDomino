import { winstonLogger } from "@adapter/winstonLogger.js";
import type { DiscardDominoCommand } from "@application/commands/discardDominoCommand.js";
import { discardDominoHandler } from "@application/handlers/discardDominoHandler.js";
import { ErrorCode } from "@core/domain/errors/domainErrors.js";
import type {
  GameWithNextStep,
  NextAction,
  NextStep,
} from "@core/domain/types/game.js";
import { defaultTranslator } from "@core/i18n/translations.js";
import type { DiscardDominoUseCase } from "@core/useCases/discardDomino.js";
import { err, ok } from "@utils/result.js";
import { describe, expect, test } from "vitest";
import { createGameBuilder } from "../../builder/game.js";

describe("discardDominoHandler", () => {
  const logger = winstonLogger(false);

  test("should throw an error if the game is not with next action", () => {
    // Arrange
    const game = createGameBuilder<NextStep>()
      .withNextAction({ type: "step", step: "options" })
      .build();

    const command: DiscardDominoCommand = {
      game,
      lordId: "lord1",
    };

    const mockUseCase: DiscardDominoUseCase = () => {
      throw new Error("This should not be called");
    };
    const handler = discardDominoHandler(
      logger,
      defaultTranslator,
      mockUseCase,
    );

    // Act
    const act = () => handler(command);

    // Assert
    expect(act).toThrowError("Invalid game step");
  });

  test("should throw an error if the next action is not 'placeDomino'", () => {
    // Arrange
    const game = createGameBuilder<NextAction>().build();

    const command: DiscardDominoCommand = {
      game,
      lordId: "lord1",
    };

    const mockUseCase: DiscardDominoUseCase = () => {
      throw new Error("This should not be called");
    };
    const handler = discardDominoHandler(
      logger,
      defaultTranslator,
      mockUseCase,
    );

    // Act
    const act = () => handler(command);

    // Assert
    expect(act).toThrowError("Invalid game step");
  });

  test("should throw an error if the use case returns an error", () => {
    // Arrange
    const game = createGameBuilder<NextAction>()
      .withNextAction({
        type: "action",
        nextLord: "id",
        nextAction: "placeDomino",
      })
      .build();

    const command: DiscardDominoCommand = {
      game,
      lordId: "lord1",
    };

    const mockUseCase: DiscardDominoUseCase = () =>
      err(ErrorCode.LORD_NOT_FOUND);
    const handler = discardDominoHandler(
      logger,
      defaultTranslator,
      mockUseCase,
    );

    // Act
    const act = () => handler(command);

    // Assert
    expect(act).toThrowError("Lord not found");
  });

  test("should return GameWithNextAction if the use case returns it", () => {
    // Arrange
    const game = createGameBuilder<NextAction>()
      .withNextAction({
        type: "action",
        nextLord: "id",
        nextAction: "placeDomino",
      })
      .build();

    const command: DiscardDominoCommand = {
      game,
      lordId: "lord1",
    };

    const mockUseCase: DiscardDominoUseCase = () => ok(game);
    const handler = discardDominoHandler(
      logger,
      defaultTranslator,
      mockUseCase,
    );

    // Act
    const result = handler(command);

    // Assert
    expect(result).toEqual(game);
  });

  test("should return GameWithNextStep if the use case returns it", () => {
    // Arrange
    const game = createGameBuilder<NextAction>()
      .withNextAction({
        type: "action",
        nextLord: "id",
        nextAction: "placeDomino",
      })
      .build();

    const gameExpected: GameWithNextStep = {
      ...game,
      nextAction: {
        type: "step",
        step: "result",
      },
    };

    const command: DiscardDominoCommand = {
      game,
      lordId: "lord1",
    };

    const mockUseCase: DiscardDominoUseCase = () => ok(gameExpected);
    const handler = discardDominoHandler(
      logger,
      defaultTranslator,
      mockUseCase,
    );

    // Act
    const result = handler(command);

    // Assert
    expect(result).toEqual(gameExpected);
  });
});
