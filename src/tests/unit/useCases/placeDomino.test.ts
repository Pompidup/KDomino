import { ErrorCode } from "@core/domain/errors/domainErrors.js";
import type { NextAction } from "@core/domain/types/game.js";
import { placeDominoUseCase } from "@core/useCases/placeDomino.js";
import { err, unwrap } from "@utils/result.js";
import { describe, expect, test } from "vitest";
import { createGameBuilder } from "../../builder/game.js";

describe("Game Place", () => {
  test("should place a domino", () => {
    const game = createGameBuilder()
      .withAllDefaults()
      .withNextAction({
        type: "action",
        nextLord: "lord1-id",
        nextAction: "placeDomino",
      })
      .build();

    game.lords[0]!.dominoPicked = game.dominoes[0];

    const result = placeDominoUseCase(game, "lord1-id", { x: 5, y: 4 }, 0);

    const updatedGame = unwrap(result);

    expect(updatedGame.players[0]!.kingdom[4]![5]).toEqual(
      game.dominoes[0]!.left,
    );
    expect(updatedGame.players[0]!.kingdom[4]![6]).toEqual(
      game.dominoes[0]!.right,
    );
  });

  test("should return error if lord is not found", () => {
    const game = createGameBuilder<NextAction>().withAllDefaults().build();

    const result = placeDominoUseCase(game, "lord1-id", { x: 5, y: 4 }, 0);

    expect(result).toEqual(err(ErrorCode.LORD_NOT_FOUND));
  });

  test("should return error if it's not lord turn", () => {
    const game = createGameBuilder()
      .withAllDefaults()
      .withNextAction({
        type: "action",
        nextLord: "lord2-id",
        nextAction: "placeDomino",
      })
      .build();

    const result = placeDominoUseCase(game, "lord1-id", { x: 5, y: 4 }, 0);

    expect(result).toEqual(err(ErrorCode.NOT_YOUR_TURN));
  });

  test("should return error if lord can't place", () => {
    const game = createGameBuilder()
      .withAllDefaults()
      .withNextAction({
        type: "action",
        nextLord: "lord1-id",
        nextAction: "placeDomino",
      })
      .build();

    game.lords[0]!.hasPick = true;

    const result = placeDominoUseCase(game, "lord1-id", { x: 5, y: 4 }, 0);

    expect(result).toEqual(err(ErrorCode.CANNOT_PLACE));
  });

  test("should return error if not fit into the grid", () => {
    const game = createGameBuilder()
      .withAllDefaults()
      .withNextAction({
        type: "action",
        nextLord: "lord1-id",
        nextAction: "placeDomino",
      })
      .build();

    game.lords[0]!.dominoPicked = game.dominoes[0];

    const result = placeDominoUseCase(game, "lord1-id", { x: 10, y: 4 }, 0);

    expect(result).toEqual(err(ErrorCode.PLACEMENT_OUT_OF_BOUNDS));
  });

  test("should return error if position is already occupied", () => {
    const game = createGameBuilder()
      .withAllDefaults()
      .withNextAction({
        type: "action",
        nextLord: "lord1-id",
        nextAction: "placeDomino",
      })
      .build();

    game.players[0]!.kingdom[4]![5] = game.dominoes[0]!.left;

    game.lords[0]!.dominoPicked = game.dominoes[0];

    const result = placeDominoUseCase(game, "lord1-id", { x: 4, y: 4 }, 0);

    expect(result).toEqual(err(ErrorCode.PLACEMENT_NOT_EMPTY));
  });

  test("should return error if position is not adjacent to another tile", () => {
    const game = createGameBuilder()
      .withAllDefaults()
      .withNextAction({
        type: "action",
        nextLord: "lord1-id",
        nextAction: "placeDomino",
      })
      .build();

    game.lords[0]!.dominoPicked = game.dominoes[0];

    const result = placeDominoUseCase(game, "lord1-id", { x: 5, y: 5 }, 0);

    expect(result).toEqual(err(ErrorCode.PLACEMENT_NOT_ADJACENT));
  });

  test("should return error if position is not adjacent to valid tile", () => {
    const game = createGameBuilder()
      .withAllDefaults()
      .withNextAction({
        type: "action",
        nextLord: "lord1-id",
        nextAction: "placeDomino",
      })
      .build();

    game.players[0]!.kingdom[4]![4] = { type: "forest", crowns: 1 };

    game.lords[0]!.dominoPicked = game.dominoes[0];

    const result = placeDominoUseCase(game, "lord1-id", { x: 5, y: 4 }, 0);

    expect(result).toEqual(err(ErrorCode.PLACEMENT_INVALID_TERRAIN));
  });

  test('should update lord "hasPlace" to true', () => {
    const game = createGameBuilder()
      .withAllDefaults()
      .withNextAction({
        type: "action",
        nextLord: "lord1-id",
        nextAction: "placeDomino",
      })
      .build();

    game.lords[0]!.dominoPicked = game.dominoes[0];

    const updatedGame = unwrap(
      placeDominoUseCase(game, "lord1-id", { x: 5, y: 4 }, 0),
    );

    expect(updatedGame.lords[0]!.hasPlace).toBe(true);
  });

  test("should update next action to pick domino", () => {
    const game = createGameBuilder()
      .withAllDefaults()
      .withNextAction({
        type: "action",
        nextLord: "lord1-id",
        nextAction: "placeDomino",
      })
      .build();

    game.lords[0]!.dominoPicked = game.dominoes[0];

    const updatedGame = unwrap(
      placeDominoUseCase(game, "lord1-id", { x: 5, y: 4 }, 0),
    );

    expect(updatedGame.nextAction.type).toBe("action");
    expect((updatedGame.nextAction as NextAction).nextAction).toBe(
      "pickDomino",
    );
  });

  test("should end lord turn if it's last turn", () => {
    // Arrange
    const game = createGameBuilder()
      .withAllDefaults()
      .withTurn(6)
      .withNextAction({
        type: "action",
        nextLord: "lord1-id",
        nextAction: "placeDomino",
      })
      .build();
    false;

    game.lords[0]!.dominoPicked = game.dominoes[0];

    // Act
    const updatedGame = unwrap(
      placeDominoUseCase(game, "lord1-id", { x: 5, y: 4 }, 0),
    );

    // Assert
    expect(updatedGame.lords[0]!.turnEnded).toBe(true);
    expect((updatedGame.nextAction as NextAction).nextLord).toBe("lord2-id");
  });

  test("should end game if it's last turn and all lords have placed", () => {
    // Arrange
    const initialGame = createGameBuilder()
      .withAllDefaults()
      .withTurn(6)
      .withNextAction({
        type: "action",
        nextLord: "lord4-id",
        nextAction: "placeDomino",
      })
      .build();

    const currentDominoes = initialGame.dominoes.slice(0, 4);
    const revealsDomino = currentDominoes.map((domino, index) => {
      return {
        domino,
        lordId: `lord${index + 1}-id`,
        picked: true,
        position: index + 1,
      };
    });

    initialGame.currentDominoes = revealsDomino;

    initialGame.lords.forEach((lord, index) => {
      if (index !== 3) {
        lord.hasPick = true;
        lord.hasPlace = true;
        lord.turnEnded = true;
        lord.dominoPicked = revealsDomino[index]!.domino;
      } else {
        lord.hasPick = false;
        lord.hasPlace = false;
        lord.turnEnded = false;
        lord.dominoPicked = revealsDomino[index]!.domino;
      }
    });

    // Act
    const updatedGame = unwrap(
      placeDominoUseCase(
        initialGame,
        initialGame.lords[3]!.id,
        { x: 5, y: 4 },
        0,
      ),
    );

    // Assert
    expect(updatedGame.turn).toBe(6);
    expect(updatedGame.nextAction).toEqual({
      type: "step",
      step: "result",
    });
  });
});
