import { describe, expect, test } from "vitest";
import type { GameWithNextAction, NextStep } from "@core/domain/types/game.js";
import type { StartGameUseCase } from "@core/useCases/startGame.js";
import { createGameBuilder } from "../../builder/game.js";
import { err, ok } from "@utils/result.js";
import type { StartGameCommand } from "@application/commands/startGameCommand.js";
import { startGameHandler } from "@application/handlers/startGameHandler.js";
import { winstonLogger } from "@adapter/winstonLogger.js";

describe("startGameHandler", () => {
  const logger = winstonLogger(false);

  test("should throw an error if the next action step is not 'start' or 'options'", () => {
    // Arrange
    const mockUseCase: StartGameUseCase = () => {
      throw new Error("This should not be called");
    };
    const handler = startGameHandler(logger, mockUseCase);

    const game = createGameBuilder<NextStep>()
      .withNextAction({ type: "step", step: "addPlayers" })
      .build();

    const command: StartGameCommand = { game };

    // Act
    const act = () => handler(command);

    // Assert
    expect(act).toThrowError("Required game with start step or options step");
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
    const handler = startGameHandler(logger, mockUseCase);
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
    const handler = startGameHandler(logger, mockUseCase);
    const command: StartGameCommand = { game };

    // Act
    const result = handler(command);

    // Assert
    expect(result).toEqual(expectedGame);
  });

  test("should throw an error if the use case returns an error", () => {
    // Arrange
    const mockUseCase: StartGameUseCase = () => err("Use case failed");
    const handler = startGameHandler(logger, mockUseCase);

    const game = createGameBuilder<NextStep>()
      .withNextAction({ type: "step", step: "start" })
      .build();

    const command: StartGameCommand = { game };

    // Act
    const act = () => handler(command);

    // Assert
    expect(act).toThrowError("Use case failed");
  });
});
