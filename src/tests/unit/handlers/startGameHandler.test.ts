import { describe, expect, test } from "vitest";
import type {
  GameWithNextAction,
  NextStep,
} from "../../../core/domain/types/game.js";
import type { StartGameUseCase } from "../../../core/useCases/startGame.js";
import { createGameBuilder } from "../../builder/game.js";
import { err, ok } from "../../../utils/result.js";
import type { StartGameCommand } from "../../../application/commands/startGameCommand.js";
import { startGameHandler } from "../../../application/handlers/startGameHandler.js";

describe("startGameHandler", () => {
  test("should throw an error if the next action step is not 'start'", () => {
    // Arrange
    const mockUseCase: StartGameUseCase = () => {
      throw new Error("This should not be called");
    };
    const handler = startGameHandler(mockUseCase);

    const game = createGameBuilder<NextStep>()
      .withNextAction({ type: "step", step: "addPlayers" })
      .build();

    const command: StartGameCommand = { game };

    // Act
    const act = () => handler(command);

    // Assert
    expect(act).toThrowError("Invalid next action");
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
    const handler = startGameHandler(mockUseCase);
    const command: StartGameCommand = { game };

    // Act
    const result = handler(command);

    // Assert
    expect(result).toEqual(expectedGame);
  });

  test("should throw an error if the use case returns an error", () => {
    // Arrange
    const mockUseCase: StartGameUseCase = () => err("Use case failed");
    const handler = startGameHandler(mockUseCase);

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