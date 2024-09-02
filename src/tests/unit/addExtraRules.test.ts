import { unwrap } from "../../utils/testHelpers.js";
import { describe, test, expect } from "vitest";
import { addExtraRulesUseCase } from "../../core/useCases/addExtraRules.js";
import { GameMode } from "../../core/domain/types/mode.js";
import { Domino } from "../../core/domain/types/domino.js";
import { createGameBuilder } from "../builder/game.js";
import { err } from "../../utils/result.js";
import { RuleRepository } from "../../core/portServerside/ruleRepository.js";
import { NextStep } from "../../core/domain/types/game.js";

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
    },
    3: {
      lords: 3,
      maxDominoes: 15,
      dominoesPerTurn: 3,
      maxTurns: 7,
    },
    4: {
      lords: 4,
      maxDominoes: 20,
      dominoesPerTurn: 4,
      maxTurns: 9,
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

    const payload = {
      game: initialGame,
      rules: ["Extra Rule 1", "Extra Rule 2"],
      availablesRules: extraRules,
    };

    // Act
    const result = addExtraRulesUseCase({ ruleRepository })(
      payload.game,
      payload.rules
    );

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

    const payload = {
      game: initialGame,
      rules: ["Extra Rule 1", "Extra Rule 2", "Extra Rule 4"],
      availablesRules: extraRules,
    };

    // Act
    const result = addExtraRulesUseCase({ ruleRepository })(
      payload.game,
      payload.rules
    );

    // Assert
    expect(result).toEqual(err("Rule not found: Extra Rule 4"));
  });
});
