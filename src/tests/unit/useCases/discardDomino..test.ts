import { ErrorCode } from "@core/domain/errors/domainErrors.js";
import type { NextAction } from "@core/domain/types/game.js";
import { discardDominoUseCase } from "@core/useCases/discardDomino.js";
import { err, unwrap } from "@utils/result.js";
import { describe, expect, test } from "vitest";
import { createGameBuilder } from "../../builder/game.js";

describe("Game Pass", () => {
  test("should pass turn and next action will be pickDomino", () => {
    // Arrange
    const initialGame = createGameBuilder()
      .withAllDefaults()
      .withNextAction({
        type: "action",
        nextLord: "lord1-id",
        nextAction: "placeDomino",
      } as NextAction)
      .build();

    // Act
    const result = discardDominoUseCase(initialGame, "lord1-id");

    // Assert
    const unwrapResult = unwrap(result);
    expect(unwrapResult.lords[0]?.turnEnded).toBe(false);
    expect(unwrapResult.lords[0]?.hasPick).toBe(false);
    expect(unwrapResult.lords[0]?.hasPlace).toBe(true);
    expect(unwrapResult.nextAction).toEqual({
      type: "action",
      nextLord: "lord1-id",
      nextAction: "pickDomino",
    });
  });

  test("should pass turn for last game turn", () => {
    // Arrange
    const initialGame = createGameBuilder()
      .withAllDefaults()
      .withNextAction({
        type: "action",
        nextLord: "lord1-id",
        nextAction: "placeDomino",
      })
      .withTurn(6)
      .build();

    // Act
    const result = discardDominoUseCase(initialGame, "lord1-id");

    // Assert
    const unwrapResult = unwrap(result);
    expect(unwrapResult.lords[0]?.turnEnded).toBe(true);
    expect(unwrapResult.lords[0]?.hasPick).toBe(false);
    expect(unwrapResult.lords[0]?.hasPlace).toBe(true);
    expect(unwrapResult.nextAction).toEqual({
      type: "action",
      nextLord: "lord2-id",
      nextAction: "placeDomino",
    });
  });

  test("should pass turn for last player for last turn", () => {
    // Arrange
    const initialGame = createGameBuilder()
      .withAllDefaults()
      .withNextAction({
        type: "action",
        nextLord: "lord4-id",
        nextAction: "placeDomino",
      })
      .withTurn(6)
      .build();

    initialGame.lords.map((lord, index) => {
      if (index !== 3) {
        lord.hasPick = false;
        lord.hasPlace = true;
        lord.turnEnded = true;
      } else {
        lord.hasPick = false;
        lord.hasPlace = false;
        lord.turnEnded = false;
      }
    });

    // Act
    const result = discardDominoUseCase(initialGame, "lord4-id");

    // Assert
    const unwrapResult = unwrap(result);
    expect(unwrapResult.lords[3]?.turnEnded).toBe(true);
    expect(unwrapResult.lords[3]?.hasPick).toBe(false);
    expect(unwrapResult.lords[3]?.hasPlace).toBe(true);
    expect(unwrapResult.nextAction).toEqual({
      type: "step",
      step: "result",
    });
  });

  test("should return error if lord not found", () => {
    // Arrange
    const initialGame = createGameBuilder<NextAction>()
      .withAllDefaults()
      .build();

    // Act
    const result = discardDominoUseCase(initialGame, "not-found");

    // Assert
    expect(result).toEqual(err(ErrorCode.LORD_NOT_FOUND));
  });

  test("should return error if not lord turn", () => {
    // Arrange
    const initialGame = createGameBuilder()
      .withAllDefaults()
      .withNextAction({
        type: "action",
        nextLord: "lord2-id",
        nextAction: "placeDomino",
      })
      .build();

    // Act
    const result = discardDominoUseCase(initialGame, "lord1-id");

    // Assert
    expect(result).toEqual(err(ErrorCode.NOT_YOUR_TURN));
  });

  test("should return error if lord can't pass", () => {
    // Arrange
    const initialGame = createGameBuilder()
      .withAllDefaults()
      .withNextAction({
        type: "action",
        nextLord: "lord1-id",
        nextAction: "placeDomino",
      })
      .build();

    initialGame.lords[0]!.hasPlace = true;

    // Act
    const result = discardDominoUseCase(initialGame, "lord1-id");

    // Assert
    expect(result).toEqual(err(ErrorCode.CANNOT_PLACE));
  });
});
