import { describe, test, expect } from "vitest";
import { startGameUseCase } from "@core/useCases/startGame.js";
import { unwrap } from "@utils/testHelpers.js";
import { createGameBuilder } from "../../builder/game.js";
import type { NextStep } from "@core/domain/types/game.js";

describe("Start game", () => {
  test("should defined next player and action", () => {
    // Arrange
    const initialGame = createGameBuilder<NextStep>()
      .withMode({ name: "Classic", description: "Classic mode" })
      .withRules({
        basic: {
          lords: 2,
          maxDominoes: 10,
          dominoesPerTurn: 4,
          maxTurns: 5,
        },
        extra: [],
      })
      .withDefaultDominoes()
      .withDefaultPlayers()
      .build();

    const deps = {
      uuidMethod: () => "lord-id",
      shuffleMethod: (array: any[]) => array,
    };

    const expectedNextAction = {
      type: "action",
      nextLord: "lord-id",
      nextAction: "pickDomino",
    };
    // Act
    const result = startGameUseCase(deps)(initialGame);

    // Assert
    expect(unwrap(result).nextAction).toEqual(expectedNextAction);
  });

  test("should apply rules when dominoes are draw", () => {
    // Arrange
    const initialGame = createGameBuilder<NextStep>()
      .withMode({ name: "Classic", description: "Classic mode" })
      .withRules({
        basic: {
          lords: 2,
          maxDominoes: 10,
          dominoesPerTurn: 2,
          maxTurns: 5,
        },
        extra: [],
      })
      .withDefaultDominoes()
      .withDefaultPlayers()
      .build();

    const deps = {
      uuidMethod: () => "lord-id",
      shuffleMethod: (array: any[]) => array,
    };

    const expectedDominoes = [
      {
        domino: initialGame.dominoes[0],
        picked: false,
        lordId: null,
        position: 1,
      },
      {
        domino: initialGame.dominoes[1],
        picked: false,
        lordId: null,
        position: 2,
      },
    ];

    // Act
    const result = startGameUseCase(deps)(initialGame);

    // Assert
    expect(unwrap(result).currentDominoes).toEqual(expectedDominoes);
  });

  test("should apply rules for creating lords", () => {
    // Arrange
    const initialGame = createGameBuilder<NextStep>()
      .withMode({ name: "Classic", description: "Classic mode" })
      .withRules({
        basic: {
          lords: 2,
          maxDominoes: 10,
          dominoesPerTurn: 2,
          maxTurns: 5,
        },
        extra: [],
      })
      .withDefaultDominoes()
      .withDefaultPlayers()
      .build();

    const deps = {
      uuidMethod: () => "lord-id",
      shuffleMethod: (array: any[]) => array,
    };

    const expectedLords = [
      {
        id: "lord-id",
        playerId: "player1-id",
        turnEnded: false,
        hasPick: false,
        hasPlace: true,
      },
      {
        id: "lord-id",
        playerId: "player1-id",
        turnEnded: false,
        hasPick: false,
        hasPlace: true,
      },
      {
        id: "lord-id",
        playerId: "player2-id",
        turnEnded: false,
        hasPick: false,
        hasPlace: true,
      },
      {
        id: "lord-id",
        playerId: "player2-id",
        turnEnded: false,
        hasPick: false,
        hasPlace: true,
      },
    ];

    // Act
    const result = startGameUseCase(deps)(initialGame);

    // Assert
    const unwrapped = unwrap(result);
    expect(unwrapped.lords).toEqual(expectedLords);
  });
});
