import { describe, expect, test } from "vitest";
import type { ChooseDominoCommand } from "@application/commands/chooseDominoCommand.js";
import { chooseDominoHandler } from "@application/handlers/chooseDominoHandler.js";
import type { NextAction } from "@core/domain/types/game.js";
import type { ChooseDominoUseCase } from "@core/useCases/chooseDomino.js";
import { err, ok } from "@utils/result.js";
import { createGameBuilder } from "../../builder/game.js";
import { winstonLogger } from "@adapter/winstonLogger.js";

describe("chooseDominoHandler", () => {
  const logger = winstonLogger(false);

  test("should throw an error if the next action is not 'pickDomino'", () => {
    // Arrange
    const game = createGameBuilder<NextAction>()
      .withNextAction({
        type: "action",
        nextLord: "id",
        nextAction: "placeDomino",
      })
      .build();

    const command: ChooseDominoCommand = {
      game,
      lordId: "lord1",
      dominoPick: 1,
    };

    const mockUseCase: ChooseDominoUseCase = () => {
      throw new Error("This should not be called");
    };

    const handler = chooseDominoHandler(logger, mockUseCase);

    // Act
    const act = () => handler(command);

    // Assert
    expect(act).toThrowError("Required game with pickDomino action");
  });

  test("should return the result value if useCase is succed", () => {
    // Arrange
    const game = createGameBuilder<NextAction>()
      .withNextAction({
        type: "action",
        nextLord: "id",
        nextAction: "pickDomino",
      })
      .build();

    const command: ChooseDominoCommand = {
      game,
      lordId: "lord1",
      dominoPick: 1,
    };

    const mockUseCase: ChooseDominoUseCase = () => ok(game);

    const handler = chooseDominoHandler(logger, mockUseCase);

    // Act
    const result = handler(command);

    // Assert
    expect(result).toEqual(game);
  });

  test("should throw an error if the use case returns an error", () => {
    // Arrange
    const game = createGameBuilder<NextAction>()
      .withNextAction({
        type: "action",
        nextLord: "id",
        nextAction: "pickDomino",
      })
      .build();

    const command: ChooseDominoCommand = {
      game,
      lordId: "lord1",
      dominoPick: 1,
    };

    const mockUseCase: ChooseDominoUseCase = () => err("useCase error");

    const handler = chooseDominoHandler(logger, mockUseCase);

    // Act
    const act = () => handler(command);

    // Assert
    expect(act).toThrowError("useCase error");
  });
});
