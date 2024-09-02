import { RuleRepository } from "../../core/portServerside/ruleRepository.js";
import { getExtraRulesUseCase } from "../../core/useCases/getExtraRules.js";
import { describe, test, expect, beforeAll } from "vitest";
import { unwrap } from "../../utils/testHelpers.js";
import type { ExtraRule, Rules } from "../../core/domain/types/rule.js";

describe("Get available extra rules", () => {
  let extraRules: ExtraRule[];
  let inMemoryRepo: RuleRepository;

  beforeAll(() => {
    extraRules = [
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

    inMemoryRepo = {
      getAll: () => {
        const rules: Rules = {
          basic: {
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
          },
          extraRules,
        };

        return rules;
      },
      getAllExtra: () => {
        return extraRules;
      },
    };
  });

  test("should retrieve all extra rules for specific game mode and 4 players", () => {
    // Act
    const extraRules = getExtraRulesUseCase({
      ruleRepository: inMemoryRepo,
    })("Classic", 4);

    // Assert
    const unwrapped = unwrap(extraRules);
    expect(unwrapped.length).toBe(2);
  });

  test("should retrieve all extra rules for specific game mode and 2 players", () => {
    // Act
    const extraRules = getExtraRulesUseCase({
      ruleRepository: inMemoryRepo,
    })("Classic", 2);

    // Assert
    const unwrapped = unwrap(extraRules);
    expect(unwrapped.length).toBe(1);
  });
});
