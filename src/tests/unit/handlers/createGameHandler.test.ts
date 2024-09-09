import { winstonLogger } from "@adapter/winstonLogger.js";
import { describe, expect, test } from "vitest";
import type { CreateGameCommand } from "@application/commands/createGameCommand.js";
import { createGameHandler } from "@application/handlers/createGameHandler.js";
import type { NextStep } from "@core/domain/types/game.js";
import type { CreateGameUseCase } from "@core/useCases/createGame.js";
import { createGameBuilder } from "../../builder/game.js";
import { err, ok } from "@utils/result.js";

describe("createGameHandler", () => {
  test("should return game and next action when use case succeeds", () => {
    // Arrange
    const command: CreateGameCommand = {
      mode: "Classic",
    };

    const game = createGameBuilder<NextStep>().build();
    const mockUseCase: CreateGameUseCase = () => ok(game);
    const handler = createGameHandler(winstonLogger(false), mockUseCase);

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

    const mockUseCase: CreateGameUseCase = () => err("Use case failed");
    const handler = createGameHandler(winstonLogger(false), mockUseCase);

    // Act
    const act = () => handler(command);

    // Assert
    expect(act).toThrowError("Use case failed");
  });
});
