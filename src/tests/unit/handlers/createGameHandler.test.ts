import { winstonLogger } from "@adapter/winstonLogger.js";
import type { CreateGameCommand } from "@application/commands/createGameCommand.js";
import { createGameHandler } from "@application/handlers/createGameHandler.js";
import { ErrorCode } from "@core/domain/errors/domainErrors.js";
import type { NextStep } from "@core/domain/types/game.js";
import { defaultTranslator } from "@core/i18n/translations.js";
import type { CreateGameUseCase } from "@core/useCases/createGame.js";
import { err, ok } from "@utils/result.js";
import { describe, expect, test } from "vitest";
import { createGameBuilder } from "../../builder/game.js";

describe("createGameHandler", () => {
  test("should return game and next action when use case succeeds", () => {
    // Arrange
    const command: CreateGameCommand = {
      mode: "Classic",
    };

    const game = createGameBuilder<NextStep>().build();
    const mockUseCase: CreateGameUseCase = () => ok(game);
    const handler = createGameHandler(
      winstonLogger(false),
      defaultTranslator,
      mockUseCase,
    );

    // Act
    const result = handler(command);

    // Assert
    expect(result).toEqual(game);
  });

  test("should throw an error when use case fails", () => {
    // Arrange
    const command: CreateGameCommand = {
      mode: "Classic",
    };

    const mockUseCase: CreateGameUseCase = () => err(ErrorCode.MODE_NOT_FOUND);
    const handler = createGameHandler(
      winstonLogger(false),
      defaultTranslator,
      mockUseCase,
    );

    // Act
    const act = () => handler(command);

    // Assert
    expect(act).toThrowError("Game mode not found");
  });
});
