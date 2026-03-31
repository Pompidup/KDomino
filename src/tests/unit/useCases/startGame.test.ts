import { describe, test, expect } from "vitest";
import { startGameUseCase } from "@core/useCases/startGame.js";
import { unwrap } from "@utils/result.js";
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
          maxKingdomSize: 5,
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
          maxKingdomSize: 5,
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

  test("should use seeded shuffle for lords when game has a seed", () => {
    // Arrange
    let callCount = 0;
    const initialGame = createGameBuilder<NextStep>()
      .withMode({ name: "Classic", description: "Classic mode" })
      .withRules({
        basic: {
          lords: 2,
          maxDominoes: 10,
          dominoesPerTurn: 2,
          maxTurns: 5,
          maxKingdomSize: 5,
        },
        extra: [],
      })
      .withDefaultDominoes()
      .withDefaultPlayers()
      .withSeed("deterministic-seed")
      .build();

    const deps = {
      uuidMethod: () => `lord-${++callCount}`,
      shuffleMethod: (array: any[]) => array,
    };

    // Act - run twice with fresh lord IDs
    callCount = 0;
    const result1 = startGameUseCase(deps)(initialGame);
    callCount = 0;
    const result2 = startGameUseCase(deps)(initialGame);

    // Assert - same seed produces same lord order
    const lords1 = unwrap(result1).lords.map((l) => l.playerId);
    const lords2 = unwrap(result2).lords.map((l) => l.playerId);
    expect(lords1).toEqual(lords2);
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
          maxKingdomSize: 5,
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
