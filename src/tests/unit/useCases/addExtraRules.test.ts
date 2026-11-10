import jsonDominoes from "@adapter/jsonDominoes.js";
import jsonRules from "@adapter/jsonRules.js";
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
import { createPlayerBuilder } from "../../builder/player.js";

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

  const makePlayers = (count: number) =>
    Array.from({ length: count }, (_, i) =>
      createPlayerBuilder()
        .withId(`player${i + 1}-id`)
        .withName(`player${i + 1}`)
        .build(),
    );

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
      .withPlayers(makePlayers(4))
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
      .withPlayers(makePlayers(2))
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
      .withPlayers(makePlayers(4))
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

describe("Add extra rules - validation against the real rules data", () => {
  const ruleRepository = jsonRules();
  const dominoesRepository = jsonDominoes();
  const shuffleMethod = <T>(array: T[]) => array;
  const addExtraRules = addExtraRulesUseCase({
    ruleRepository,
    dominoesRepository,
    shuffleMethod,
  });

  const gameFor = (modeName: string, playerCount: number) => {
    const basic = ruleRepository.getAll().basic[playerCount]!;
    return createGameBuilder<NextStep>()
      .withMode({ name: modeName, description: "" })
      .withDominoes(
        (
          dominoesRepository.getForMode({ name: modeName, description: "" }) ??
          []
        ).slice(0, basic.maxDominoes),
      )
      .withPlayers(
        Array.from({ length: playerCount }, (_, i) =>
          createPlayerBuilder()
            .withId(`player${i + 1}-id`)
            .withName(`player${i + 1}`)
            .build(),
        ),
      )
      .withRules({ basic, extra: [] })
      .withNextAction<NextStep>({ type: "step", step: "options" })
      .build();
  };

  test.each([
    1, 3, 4,
  ])("rejects The Mighty Duel with %i player(s)", (playerCount) => {
    expect(
      addExtraRules(gameFor("Classic", playerCount), ["The Mighty Duel"]),
    ).toEqual(err(ErrorCode.EXTRA_RULE_NOT_AVAILABLE));
  });

  test.each([1, 3, 4])("rejects Neolithic with %i player(s)", (playerCount) => {
    expect(
      addExtraRules(gameFor("KingdominoOrigins-Discovery", playerCount), [
        "Neolithic",
      ]),
    ).toEqual(err(ErrorCode.EXTRA_RULE_NOT_AVAILABLE));
  });

  test("rejects a rule of another mode", () => {
    expect(addExtraRules(gameFor("Classic", 2), ["Empire of Fire"])).toEqual(
      err(ErrorCode.EXTRA_RULE_NOT_AVAILABLE),
    );
    expect(
      addExtraRules(gameFor("KingdominoOrigins-Totem", 2), ["Harmony"]),
    ).toEqual(err(ErrorCode.EXTRA_RULE_NOT_AVAILABLE));
    expect(addExtraRules(gameFor("AgeOfGiants", 2), ["Harmony"])).toEqual(
      err(ErrorCode.EXTRA_RULE_NOT_AVAILABLE),
    );
  });

  test("keeps rejecting unknown rule names with STEP_EXECUTION_FAILED", () => {
    expect(addExtraRules(gameFor("Classic", 2), ["Unknown rule"])).toEqual(
      err(ErrorCode.STEP_EXECUTION_FAILED),
    );
  });

  test("accepts The Mighty Duel with 2 players: 48 dominoes, 12 turns, 7x7", () => {
    const game = unwrap(
      addExtraRules(gameFor("Classic", 2), ["The Mighty Duel"]),
    );
    expect(game.dominoes).toHaveLength(48);
    expect(game.rules.basic).toMatchObject({
      maxDominoes: 48,
      maxTurns: 12,
      maxKingdomSize: 7,
    });
  });

  test.each([
    "KingdominoOrigins-Discovery",
    "KingdominoOrigins-Totem",
    "KingdominoOrigins-Tribe",
  ])("Neolithic activates the 7x7 territory with all 48 dominoes (%s)", (modeName) => {
    const game = unwrap(addExtraRules(gameFor(modeName, 2), ["Neolithic"]));
    expect(game.dominoes).toHaveLength(48);
    expect(new Set(game.dominoes.map((d) => d.number)).size).toBe(48);
    expect(game.rules.basic).toMatchObject({
      lords: 2,
      maxDominoes: 48,
      maxTurns: 12,
      maxKingdomSize: 7,
    });
    expect(game.rules.extra.map((r) => r.name)).toEqual(["Neolithic"]);
  });

  test("stores the Dynasty entry matching the current mode", () => {
    const game = unwrap(
      addExtraRules(gameFor("KingdominoOrigins-Tribe", 3), ["Dynasty"]),
    );
    expect(game.rules.extra).toHaveLength(1);
    expect(game.rules.extra[0]!.mode.map((m) => m.name)).toContain(
      "KingdominoOrigins-Tribe",
    );
  });
});
