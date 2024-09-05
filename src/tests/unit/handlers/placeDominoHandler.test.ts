import { describe, expect, test } from "vitest";
import {
  GameWithNextAction,
  GameWithNextStep,
  NextAction,
} from "../../../core/domain/types/game.js";
import type { PlaceDominoUseCase } from "../../../core/useCases/placeDomino.js";
import { createGameBuilder } from "../../builder/game.js";
import { err, ok } from "../../../utils/result.js";
import type { PlaceDominoCommand } from "../../../application/commands/placeDominoCommand.js";
import { placeDominoHandler } from "../../../application/handlers/placeDominoHandler.js";

describe("placeDominoHandler", () => {
  test("should throw an error if the next action is not 'placeDomino'", () => {
    // Arrange
    const mockUseCase: PlaceDominoUseCase = () => {
      throw new Error("This should not be called");
    };
    const handler = placeDominoHandler(mockUseCase);
    const game = createGameBuilder<NextAction>()
      .withNextAction({
        type: "action",
        nextLord: "id",
        nextAction: "pickDomino",
      })
      .build();
    const command: PlaceDominoCommand = {
      game,
      lordId: "lord1",
      position: { x: 0, y: 0 },
      orientation: "horizontal",
      rotation: 0,
    };

    // Act
    const act = () => handler(command);

    // Assert
    expect(act).toThrowError("Required game with placeDomino step");
  });

  test("should throw an error if the result is an error", () => {
    // Arrange
    const mockUseCase: PlaceDominoUseCase = () => err("use case failed");
    const handler = placeDominoHandler(mockUseCase);
    const game = createGameBuilder<NextAction>()
      .withNextAction({
        type: "action",
        nextLord: "id",
        nextAction: "placeDomino",
      })
      .build();
    const command: PlaceDominoCommand = {
      game,
      lordId: "lord1",
      position: { x: 0, y: 0 },
      orientation: "horizontal",
      rotation: 0,
    };

    // Act
    const act = () => handler(command);

    // Assert
    expect(act).toThrowError("use case failed");
  });

  test("should return the game with next action", () => {
    // Arrange
    const game = createGameBuilder<NextAction>()
      .withNextAction({
        type: "action",
        nextLord: "id",
        nextAction: "placeDomino",
      })
      .build();

    const expectedGame: GameWithNextAction = {
      ...game,
      nextAction: {
        type: "action",
        nextLord: "id",
        nextAction: "pickDomino",
      },
    };

    const command: PlaceDominoCommand = {
      game,
      lordId: "lord1",
      position: { x: 0, y: 0 },
      orientation: "horizontal",
      rotation: 0,
    };
    const mockUseCase: PlaceDominoUseCase = () => ok(expectedGame);
    const handler = placeDominoHandler(mockUseCase);

    // Act
    const result = handler(command);

    // Assert
    expect(result).toEqual(expectedGame);
  });

  test("should return the game with next step", () => {
    // Arrange

    const game = createGameBuilder<NextAction>()
      .withNextAction({
        type: "action",
        nextLord: "id",
        nextAction: "placeDomino",
      })
      .build();

    const expectedGame: GameWithNextStep = {
      ...game,
      nextAction: {
        type: "step",
        step: "result",
      },
    };

    const command: PlaceDominoCommand = {
      game,
      lordId: "lord1",
      position: { x: 0, y: 0 },
      orientation: "horizontal",
      rotation: 0,
    };
    const mockUseCase: PlaceDominoUseCase = () => ok(expectedGame);
    const handler = placeDominoHandler(mockUseCase);

    // Act
    const result = handler(command);

    // Assert
    expect(result).toEqual(expectedGame);
  });
});
