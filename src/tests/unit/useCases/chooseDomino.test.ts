import { chooseDominoUseCase } from "@core/useCases/chooseDomino";
import { unwrap } from "@utils/result.js";
import { describe, test, expect } from "vitest";
import type { Domino } from "@core/domain/types/domino.js";
import { createGameBuilder } from "../../builder/game.js";
import { err } from "@utils/result.js";

describe("Choose Domino", () => {
  test("should save player choice", async () => {
    // Arrange
    const dominoes: Domino[] = [
      {
        left: {
          type: "forest",
          crowns: 0,
        },
        right: {
          type: "forest",
          crowns: 0,
        },
        number: 1,
      },
      {
        left: {
          type: "forest",
          crowns: 0,
        },
        right: {
          type: "forest",
          crowns: 0,
        },
        number: 2,
      },
    ];

    const currentDominoes = dominoes.slice(0, 4);
    const revealsDomino = currentDominoes.map((domino, index) => {
      return {
        domino,
        lordId: "",
        picked: false,
        position: index + 1,
      };
    });

    const initialGame = createGameBuilder()
      .withAllDefaults()
      .withDominoes(dominoes)
      .withCurrentDominoes(revealsDomino)
      .withNextAction({
        type: "action",
        nextLord: "lord1-id",
        nextAction: "pickDomino",
      })
      .build();

    initialGame.lords[0]!.hasPlace = true;

    // Act
    const result = chooseDominoUseCase(
      initialGame,
      initialGame.lords[0]!.id,
      revealsDomino[0]!.domino.number
    );

    // Assert
    const unwrapResult = unwrap(result);
    expect(unwrapResult.currentDominoes[0]!.picked).toEqual(true);
    expect(unwrapResult.currentDominoes[0]!.lordId).toEqual("lord1-id");
    expect(unwrapResult.lords[0]!.hasPick).toEqual(true);
    expect(unwrapResult.lords[0]!.turnEnded).toEqual(true);
  });

  test("should return error if lord can pick", async () => {
    // Arrange
    const initialGame = createGameBuilder()
      .withAllDefaults()
      .withNextAction({
        type: "action",
        nextLord: "lord1-id",
        nextAction: "pickDomino",
      })
      .build();

    initialGame.lords[0]!.hasPick = true;
    initialGame.lords[0]!.turnEnded = false;

    // Act
    const result = chooseDominoUseCase(
      initialGame,
      initialGame.lords[0]!.id,
      1
    );

    // Assert
    expect(result).toEqual(err("Lord can't pick"));
  });

  test("should return error if domino not found", async () => {
    // Arrange
    const initialGame = createGameBuilder()
      .withAllDefaults()
      .withNextAction({
        type: "action",
        nextLord: "lord1-id",
        nextAction: "pickDomino",
      })
      .build();
    initialGame.lords[0]!.hasPlace = true;

    // Act
    const result = chooseDominoUseCase(
      initialGame,
      initialGame.lords[0]!.id,
      3
    );

    // Assert
    expect(result).toEqual(err("Domino not found"));
  });

  test("should return error if domino already picked", async () => {
    // Arrange
    const dominoes: Domino[] = [
      {
        left: {
          type: "forest",
          crowns: 0,
        },
        right: {
          type: "forest",
          crowns: 0,
        },
        number: 1,
      },
      {
        left: {
          type: "forest",
          crowns: 0,
        },
        right: {
          type: "forest",
          crowns: 0,
        },
        number: 2,
      },
    ];

    const currentDominoes = dominoes.slice(0, 4);
    const revealsDomino = currentDominoes.map((domino, index) => {
      return {
        domino,
        lordId: "",
        picked: true,
        position: index + 1,
      };
    });

    const initialGame = createGameBuilder()
      .withAllDefaults()
      .withDominoes(dominoes)
      .withCurrentDominoes(revealsDomino)
      .withNextAction({
        type: "action",
        nextLord: "lord1-id",
        nextAction: "pickDomino",
      })
      .build();

    initialGame.lords[0]!.hasPlace = true;

    // Act
    const result = chooseDominoUseCase(
      initialGame,
      initialGame.lords[0]!.id,
      revealsDomino[0]!.domino.number
    );

    // Assert
    expect(result).toEqual(err("Domino already picked"));
  });

  test("should end turn if all lords have played", async () => {
    // Arrange
    const initialGame = createGameBuilder()
      .withAllDefaults()
      .withTurn(0)
      .withNextAction({
        type: "action",
        nextLord: "lord4-id",
        nextAction: "pickDomino",
      })
      .build();

    const currentDominoes = initialGame.dominoes.slice(0, 4);
    const revealsDomino = currentDominoes.map((domino, index) => {
      if (index === 3) {
        return {
          domino,
          lordId: "",
          picked: false,
          position: index + 1,
        };
      }
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
        lord.hasPlace = true;
        lord.turnEnded = false;
      }
    });

    // Act
    const result = chooseDominoUseCase(
      initialGame,
      initialGame.lords[3]!.id,
      revealsDomino[3]!.domino.number
    );

    // Assert
    const unwrapResult = unwrap(result);
    expect(unwrapResult.turn).toEqual(1);
    expect(unwrapResult.nextAction).toEqual({
      type: "action",
      nextLord: "lord1-id",
      nextAction: "placeDomino",
    });
  });
});
