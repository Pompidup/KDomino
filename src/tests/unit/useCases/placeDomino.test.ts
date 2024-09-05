import { placeDominoUseCase } from "@core/useCases/placeDomino.js";
import { describe, test, expect } from "vitest";
import { unwrap } from "@utils/testHelpers.js";
import { createGameBuilder } from "../../builder/game.js";
import { err } from "@utils/result.js";
import type { NextAction } from "@core/domain/types/game.js";

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

    const result = placeDominoUseCase(
      game,
      "lord1-id",
      { x: 5, y: 4 },
      "horizontal",
      0
    );

    const updatedGame = unwrap(result);

    expect(updatedGame.players[0]!.kingdom[4]![5]).toEqual(game.dominoes[0]!.left);
    expect(updatedGame.players[0]!.kingdom[4]![6]).toEqual(
      game.dominoes[0]!.right
    );
  });

  test("should return error if lord is not found", () => {
    const game = createGameBuilder<NextAction>().withAllDefaults().build();

    const result = placeDominoUseCase(
      game,
      "lord1-id",
      { x: 5, y: 4 },
      "horizontal",
      0
    );

    expect(result).toEqual(err("Lord not found"));
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

    const result = placeDominoUseCase(
      game,
      "lord1-id",
      { x: 5, y: 4 },
      "horizontal",
      0
    );

    expect(result).toEqual(err("Not your turn"));
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

    const result = placeDominoUseCase(
      game,
      "lord1-id",
      { x: 5, y: 4 },
      "horizontal",
      0
    );

    expect(result).toEqual(err("Lord can't place"));
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

    const result = placeDominoUseCase(
      game,
      "lord1-id",
      { x: 10, y: 4 },
      "horizontal",
      0
    );

    expect(result).toEqual(err("Invalid placement (not fit into the grid)"));
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

    const result = placeDominoUseCase(
      game,
      "lord1-id",
      { x: 4, y: 4 },
      "horizontal",
      0
    );

    expect(result).toEqual(err("Invalid placement (not empty)"));
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

    const result = placeDominoUseCase(
      game,
      "lord1-id",
      { x: 5, y: 5 },
      "horizontal",
      0
    );

    expect(result).toEqual(err("Invalid placement (not adjacent)"));
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

    const result = placeDominoUseCase(
      game,
      "lord1-id",
      { x: 5, y: 4 },
      "horizontal",
      0
    );

    expect(result).toEqual(err("Invalid placement (not valid adjacent)"));
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
      placeDominoUseCase(game, "lord1-id", { x: 5, y: 4 }, "horizontal", 0)
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
      placeDominoUseCase(game, "lord1-id", { x: 5, y: 4 }, "horizontal", 0)
    );

    expect(updatedGame.nextAction.type).toBe("action");
    expect((updatedGame.nextAction as NextAction).nextAction).toBe(
      "pickDomino"
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
      placeDominoUseCase(game, "lord1-id", { x: 5, y: 4 }, "horizontal", 0)
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

    initialGame.lords.map((lord, index) => {
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
        "horizontal",
        0
      )
    );

    // Assert
    expect(updatedGame.turn).toBe(6);
    expect(updatedGame.nextAction).toEqual({
      type: "step",
      step: "result",
    });
  });
});
