import { describe, expect, test } from "vitest";
import type { DiscardDominoCommand } from "../../../application/commands/discardDominoCommand.js";
import { discardDominoHandler } from "../../../application/handlers/discardDominoHandler.js";
import {
  NextAction,
  type GameWithNextStep,
} from "../../../core/domain/types/game.js";
import type { DiscardDominoUseCase } from "../../../core/useCases/discardDomino.js";
import { err, ok } from "../../../utils/result.js";
import { createGameBuilder } from "../../builder/game.js";

describe("discardDominoHandler", () => {
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
    const handler = discardDominoHandler(mockUseCase);

    // Act
    const act = () => handler(command);

    // Assert
    expect(act).toThrowError("Required game with placeDomino action");
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

    const mockUseCase: DiscardDominoUseCase = () => err("Use case failed");
    const handler = discardDominoHandler(mockUseCase);

    // Act
    const act = () => handler(command);

    // Assert
    expect(act).toThrowError("Use case failed");
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
    const handler = discardDominoHandler(mockUseCase);

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
    const handler = discardDominoHandler(mockUseCase);

    // Act
    const result = handler(command);

    // Assert
    expect(result).toEqual(gameExpected);
  });
});
