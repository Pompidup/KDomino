import { winstonLogger } from "@adapter/winstonLogger.js";
import type { PlaceDominoCommand } from "@application/commands/placeDominoCommand.js";
import { placeDominoHandler } from "@application/handlers/placeDominoHandler.js";
import { ErrorCode } from "@core/domain/errors/domainErrors.js";
import type {
  GameWithNextAction,
  GameWithNextStep,
  NextAction,
  NextStep,
} from "@core/domain/types/game.js";
import { defaultTranslator } from "@core/i18n/translations.js";
import type { PlaceDominoUseCase } from "@core/useCases/placeDomino.js";
import { err, ok } from "@utils/result.js";
import { describe, expect, test } from "vitest";
import { createGameBuilder } from "../../builder/game.js";

describe("placeDominoHandler", () => {
  const logger = winstonLogger(false);

  test("should throw an error if the game is not with next action", () => {
    // Arrange
    const mockUseCase: PlaceDominoUseCase = () => {
      throw new Error("This should not be called");
    };

    const handler = placeDominoHandler(logger, defaultTranslator, mockUseCase);

    const game = createGameBuilder<NextStep>()
      .withNextAction({ type: "step", step: "options" })
      .build();

    const command: PlaceDominoCommand = {
      game,
      lordId: "lord1",
      position: { x: 0, y: 0 },
      rotation: 0,
    };

    // Act
    const act = () => handler(command);

    // Assert
    expect(act).toThrowError("Invalid game step");
  });

  test("should throw an error if the next action is not 'placeDomino'", () => {
    // Arrange
    const mockUseCase: PlaceDominoUseCase = () => {
      throw new Error("This should not be called");
    };
    const handler = placeDominoHandler(logger, defaultTranslator, mockUseCase);
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
      rotation: 0,
    };

    // Act
    const act = () => handler(command);

    // Assert
    expect(act).toThrowError("Invalid game step");
  });

  test("should throw an error if the result is an error", () => {
    // Arrange
    const mockUseCase: PlaceDominoUseCase = () =>
      err(ErrorCode.INVALID_PLACEMENT);
    const handler = placeDominoHandler(logger, defaultTranslator, mockUseCase);
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
      rotation: 0,
    };

    // Act
    const act = () => handler(command);

    // Assert
    expect(act).toThrowError("Invalid placement");
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
      rotation: 0,
    };
    const mockUseCase: PlaceDominoUseCase = () => ok(expectedGame);
    const handler = placeDominoHandler(logger, defaultTranslator, mockUseCase);

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
      rotation: 0,
    };
    const mockUseCase: PlaceDominoUseCase = () => ok(expectedGame);
    const handler = placeDominoHandler(logger, defaultTranslator, mockUseCase);

    // Act
    const result = handler(command);

    // Assert
    expect(result).toEqual(expectedGame);
  });
});
