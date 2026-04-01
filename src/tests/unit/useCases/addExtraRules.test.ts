import { ErrorCode } from "@core/domain/errors/domainErrors.js";
import type { Domino } from "@core/domain/types/domino.js";
import type { NextStep } from "@core/domain/types/game.js";
import type { GameMode } from "@core/domain/types/mode.js";
import type { DominoesRepository } from "@core/portServerside/dominoesRepository.js";
import type { RuleRepository } from "@core/portServerside/ruleRepository.js";
import { addExtraRulesUseCase } from "@core/useCases/addExtraRules.js";
import { err, unwrap } from "@utils/result.js";
import { describe, expect, test } from "vitest";
import { createGameBuilder } from "../../builder/game.js";

describe("Add extra rules", () => {
  const mode: GameMode = {
    name: "Classic",
    description: "Classic mode",
  };

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

  const basicRules = {
    2: {
      lords: 2,
      maxDominoes: 10,
      dominoesPerTurn: 2,
      maxTurns: 5,
      maxKingdomSize: 5,
    },
    3: {
      lords: 3,
      maxDominoes: 15,
      dominoesPerTurn: 3,
      maxTurns: 7,
      maxKingdomSize: 5,
    },
    4: {
      lords: 4,
      maxDominoes: 20,
      dominoesPerTurn: 4,
      maxTurns: 9,
      maxKingdomSize: 5,
    },
  };

  test("should add extra rules", () => {
    // Arrange
    const initialGame = createGameBuilder<NextStep>()
      .withId("uuid-test")
      .withMode(mode)
      .withDominoes(dominoes)
      .build();

    const extraRules = [
      {
        name: "Extra Rule 1",
        description: "This is an extra rule for the game.",
        mode: [{ name: "Classic", description: "Classic mode" }],
        playersLimit: 4,
      },
      {
        name: "Extra Rule 2",
        description: "This is another extra rule for the game.",
        mode: [
          { name: "Classic", description: "Classic mode" },
          { name: "QueenDomino", description: "QueenDomino mode" },
        ],
      },
      {
        name: "Extra Rule 3",
        description: "A rule for advanced gameplay.",
        mode: [{ name: "QueenDomino", description: "QueenDomino mode" }],
      },
    ];

    const ruleRepository: RuleRepository = {
      getAll: () => ({ basic: basicRules, extraRules: extraRules }),
      getAllExtra: () => extraRules,
    };

    const dominoesRepository: DominoesRepository = {
      getForMode: () => dominoes,
    };

    const shuffleMethod = <T>(array: T[]) => array;

    const payload = {
      game: initialGame,
      rules: ["Extra Rule 1", "Extra Rule 2"],
      availablesRules: extraRules,
    };

    // Act
    const result = addExtraRulesUseCase({
      ruleRepository,
      dominoesRepository,
      shuffleMethod,
    })(payload.game, payload.rules);

    // Assert
    const unwrapResult = unwrap(result);
    expect(unwrapResult.rules.extra).toEqual([
      {
        name: "Extra Rule 1",
        description: "This is an extra rule for the game.",
        mode: [{ name: "Classic", description: "Classic mode" }],
        playersLimit: 4,
      },
      {
        name: "Extra Rule 2",
        description: "This is another extra rule for the game.",
        mode: [
          { name: "Classic", description: "Classic mode" },
          { name: "QueenDomino", description: "QueenDomino mode" },
        ],
      },
    ]);
  });

  test("should use seeded shuffle for Mighty Duel when game has a seed", () => {
    // Arrange
    const mightyDuelDominoes: Domino[] = Array.from({ length: 48 }, (_, i) => ({
      left: { type: "forest" as const, crowns: 0 },
      right: { type: "wheat" as const, crowns: i % 3 },
      number: i + 1,
    }));

    const extraRules = [
      {
        name: "The Mighty Duel",
        description: "Use all 48 dominoes and build a 7x7 kingdom.",
        mode: [{ name: "Classic", description: "Classic mode" }],
        playersLimit: 2,
      },
    ];

    const ruleRepository: RuleRepository = {
      getAll: () => ({ basic: basicRules, extraRules }),
      getAllExtra: () => extraRules,
    };

    const dominoesRepository: DominoesRepository = {
      getForMode: () => mightyDuelDominoes,
    };

    const shuffleMethod = <T>(array: T[]) => array;

    const initialGame = createGameBuilder<NextStep>()
      .withId("uuid-test")
      .withMode(mode)
      .withDominoes(dominoes)
      .withSeed("mighty-seed")
      .build();

    // Act
    const result1 = addExtraRulesUseCase({
      ruleRepository,
      dominoesRepository,
      shuffleMethod,
    })(initialGame, ["The Mighty Duel"]);
    const result2 = addExtraRulesUseCase({
      ruleRepository,
      dominoesRepository,
      shuffleMethod,
    })(initialGame, ["The Mighty Duel"]);

    // Assert - same seed produces same domino order
    const dominoes1 = unwrap(result1).dominoes;
    const dominoes2 = unwrap(result2).dominoes;
    expect(dominoes1).toEqual(dominoes2);
    expect(dominoes1.length).toBe(48);
  });

  test("should return error if extra rules not available", () => {
    // Arrange
    const initialGame = createGameBuilder<NextStep>()
      .withId("uuid-test")
      .withMode(mode)
      .withDominoes(dominoes)
      .build();

    const extraRules = [
      {
        name: "Extra Rule 1",
        description: "This is an extra rule for the game.",
        mode: [{ name: "Classic", description: "Classic mode" }],
        playersLimit: 4,
      },
      {
        name: "Extra Rule 2",
        description: "This is another extra rule for the game.",
        mode: [
          { name: "Classic", description: "Classic mode" },
          { name: "QueenDomino", description: "QueenDomino mode" },
        ],
      },
      {
        name: "Extra Rule 3",
        description: "A rule for advanced gameplay.",
        mode: [{ name: "QueenDomino", description: "QueenDomino mode" }],
      },
    ];

    const ruleRepository: RuleRepository = {
      getAll: () => ({ basic: basicRules, extraRules: extraRules }),
      getAllExtra: () => extraRules,
    };

    const dominoesRepository: DominoesRepository = {
      getForMode: () => dominoes,
    };

    const shuffleMethod = <T>(array: T[]) => array;

    const payload = {
      game: initialGame,
      rules: ["Extra Rule 1", "Extra Rule 2", "Extra Rule 4"],
      availablesRules: extraRules,
    };

    // Act
    const result = addExtraRulesUseCase({
      ruleRepository,
      dominoesRepository,
      shuffleMethod,
    })(payload.game, payload.rules);

    // Assert
    expect(result).toEqual(err(ErrorCode.STEP_EXECUTION_FAILED));
  });
});
