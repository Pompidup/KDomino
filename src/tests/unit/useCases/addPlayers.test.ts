import {
  createEmptyKingdom,
  placeCastle,
} from "@core/domain/entities/kingdom.js";
import { ErrorCode } from "@core/domain/errors/domainErrors.js";
import type { NextStep, Players, Rules } from "@core/domain/types/index.js";
import { addPlayersUseCase } from "@core/useCases/addPlayers.js";
import { err, unwrap } from "@utils/result.js";
import { describe, expect, test } from "vitest";
import { createGameBuilder } from "../../builder/game.js";

describe("Add players", () => {
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

  const inMemoryRepo = {
    getAll: () => {
      const rules: Rules = {
        basic: {
          1: {
            lords: 1,
            maxDominoes: 48,
            dominoesPerTurn: 4,
            maxTurns: 12,
            maxKingdomSize: 5,
          },
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
        },
        extraRules,
      };

      return rules;
    },
    getAllExtra: () => {
      return extraRules;
    },
  };

  test("should add players to the game", () => {
    // Arrange
    const initialGame = createGameBuilder<NextStep>()
      .withId("uuid-test")
      .withMode({ name: "Classic", description: "Classic mode" })
      .build();

    const payload = ["Player 1", "Player 2"];
    const newKingdom = createEmptyKingdom();

    const expectedPlayers: Players = [
      {
        id: "uuid-test",
        name: "Player 1",
        kingdom: placeCastle(newKingdom),
      },
      {
        id: "uuid-test",
        name: "Player 2",
        kingdom: placeCastle(newKingdom),
      },
    ];
    const dependencies = {
      uuidMethod: () => "uuid-test",
      // biome-ignore lint/suspicious/noExplicitAny: test mock
      shuffleMethod: (dominoes: any[]) => dominoes,
      ruleRepository: inMemoryRepo,
    };

    // Act
    const result = addPlayersUseCase(dependencies)(initialGame, payload);

    // Assert
    const unwrapResult = unwrap(result);
    expect(unwrapResult.players).toEqual(expectedPlayers);
    expect(unwrapResult.nextAction.type).toEqual("step");
    expect((unwrapResult.nextAction as NextStep).step).toEqual("options");
  });

  test("should add a single player for solo mode", () => {
    // Arrange
    const initialGame = createGameBuilder<NextStep>()
      .withId("uuid-test")
      .withMode({ name: "Classic", description: "Classic mode" })
      .build();

    const payload = ["Solo Player"];
    const newKingdom = createEmptyKingdom();

    const expectedPlayers: Players = [
      {
        id: "uuid-test",
        name: "Solo Player",
        kingdom: placeCastle(newKingdom),
      },
    ];
    const dependencies = {
      uuidMethod: () => "uuid-test",
      // biome-ignore lint/suspicious/noExplicitAny: test mock
      shuffleMethod: (dominoes: any[]) => dominoes,
      ruleRepository: inMemoryRepo,
    };

    // Act
    const result = addPlayersUseCase(dependencies)(initialGame, payload);

    // Assert
    const unwrapResult = unwrap(result);
    expect(unwrapResult.players).toEqual(expectedPlayers);
    expect(unwrapResult.rules.basic).toEqual({
      lords: 1,
      maxDominoes: 48,
      dominoesPerTurn: 4,
      maxTurns: 12,
      maxKingdomSize: 5,
    });
    expect(unwrapResult.nextAction.type).toEqual("step");
    expect((unwrapResult.nextAction as NextStep).step).toEqual("options");
  });

  test("should return an error for 0 players", () => {
    // Arrange
    const initialGame = createGameBuilder<NextStep>()
      .withId("uuid-test")
      .withMode({ name: "Classic", description: "Classic mode" })
      .build();

    const payload: string[] = [];
    const dependencies = {
      uuidMethod: () => "uuid-test",
      // biome-ignore lint/suspicious/noExplicitAny: test mock
      shuffleMethod: (dominoes: any[]) => dominoes,
      ruleRepository: inMemoryRepo,
    };

    // Act
    const result = addPlayersUseCase(dependencies)(initialGame, payload);

    // Assert
    expect(result).toEqual(err(ErrorCode.INVALID_PLAYER_COUNT));
  });

  test("should return an error for 5 players", () => {
    // Arrange
    const initialGame = createGameBuilder<NextStep>()
      .withId("uuid-test")
      .withMode({ name: "Classic", description: "Classic mode" })
      .build();

    const payload = [
      "Player 1",
      "Player 2",
      "Player 3",
      "Player 4",
      "Player 5",
    ];
    const dependencies = {
      uuidMethod: () => "uuid-test",
      // biome-ignore lint/suspicious/noExplicitAny: test mock
      shuffleMethod: (dominoes: any[]) => dominoes,
      ruleRepository: inMemoryRepo,
    };

    // Act
    const result = addPlayersUseCase(dependencies)(initialGame, payload);

    // Assert
    expect(result).toEqual(err(ErrorCode.INVALID_PLAYER_COUNT));
  });

  test("should use seeded shuffle when game has a seed", () => {
    // Arrange
    const initialGame = createGameBuilder<NextStep>()
      .withId("uuid-test")
      .withMode({ name: "Classic", description: "Classic mode" })
      .withDominoes(
        Array.from({ length: 10 }, (_, i) => ({
          number: i + 1,
          left: { type: "wheat" as const, crowns: 0 },
          right: { type: "forest" as const, crowns: 0 },
        })),
      )
      .withSeed("test-seed")
      .build();

    const dependencies = {
      uuidMethod: () => "uuid-test",
      // biome-ignore lint/suspicious/noExplicitAny: test mock
      shuffleMethod: (dominoes: any[]) => dominoes,
      ruleRepository: inMemoryRepo,
    };

    // Act
    const result1 = addPlayersUseCase(dependencies)(initialGame, [
      "Player 1",
      "Player 2",
    ]);
    const result2 = addPlayersUseCase(dependencies)(initialGame, [
      "Player 1",
      "Player 2",
    ]);

    // Assert - same seed produces same domino order
    const dominoes1 = unwrap(result1).dominoes;
    const dominoes2 = unwrap(result2).dominoes;
    expect(dominoes1).toEqual(dominoes2);
  });

  test("should return an error if player name is invalid", () => {
    // Arrange
    const initialGame = createGameBuilder<NextStep>()
      .withId("uuid-test")
      .withMode({ name: "Classic", description: "Classic mode" })
      .build();

    const payload = ["Pl", "Player 2"];
    const dependencies = {
      uuidMethod: () => "uuid-test",
      // biome-ignore lint/suspicious/noExplicitAny: test mock
      shuffleMethod: (dominoes: any[]) => dominoes,
      ruleRepository: inMemoryRepo,
    };

    // Act
    const result = addPlayersUseCase(dependencies)(initialGame, payload);

    // Assert
    expect(result).toEqual(err(ErrorCode.INVALID_PLAYER_NAME));
  });

  test("should add players with bot config using PlayerInput objects", () => {
    // Arrange
    const initialGame = createGameBuilder<NextStep>()
      .withId("uuid-test")
      .withMode({ name: "Classic", description: "Classic mode" })
      .build();

    const payload = [
      "Human Player",
      { name: "Bot Player", bot: { strategyName: "greedy" } },
    ];
    const dependencies = {
      uuidMethod: () => "uuid-test",
      // biome-ignore lint/suspicious/noExplicitAny: test mock
      shuffleMethod: (dominoes: any[]) => dominoes,
      ruleRepository: inMemoryRepo,
    };

    // Act
    const result = addPlayersUseCase(dependencies)(initialGame, payload);

    // Assert
    const unwrapResult = unwrap(result);
    expect(unwrapResult.players).toHaveLength(2);
    expect(unwrapResult.players[0]!.name).toBe("Human Player");
    expect(unwrapResult.players[0]!.bot).toBeUndefined();
    expect(unwrapResult.players[1]!.name).toBe("Bot Player");
    expect(unwrapResult.players[1]!.bot).toEqual({ strategyName: "greedy" });
  });

  test("should add player with PlayerInput object without bot (human)", () => {
    // Arrange
    const initialGame = createGameBuilder<NextStep>()
      .withId("uuid-test")
      .withMode({ name: "Classic", description: "Classic mode" })
      .build();

    const payload = [{ name: "Player 1" }, { name: "Player 2" }];
    const dependencies = {
      uuidMethod: () => "uuid-test",
      // biome-ignore lint/suspicious/noExplicitAny: test mock
      shuffleMethod: (dominoes: any[]) => dominoes,
      ruleRepository: inMemoryRepo,
    };

    // Act
    const result = addPlayersUseCase(dependencies)(initialGame, payload);

    // Assert
    const unwrapResult = unwrap(result);
    expect(unwrapResult.players).toHaveLength(2);
    expect(unwrapResult.players[0]!.name).toBe("Player 1");
    expect(unwrapResult.players[0]!.bot).toBeUndefined();
    expect(unwrapResult.players[1]!.name).toBe("Player 2");
    expect(unwrapResult.players[1]!.bot).toBeUndefined();
  });

  describe("stable player ids", () => {
    const makeGame = () =>
      createGameBuilder<NextStep>()
        .withId("game")
        .withMode({ name: "Classic", description: "Classic mode" })
        .build();
    let counter = 0;
    const dependencies = {
      uuidMethod: () => `generated-${++counter}`,
      // biome-ignore lint/suspicious/noExplicitAny: test mock
      shuffleMethod: (dominoes: any[]) => dominoes,
      ruleRepository: inMemoryRepo,
    };

    test("should keep the ids provided by the caller", () => {
      const result = addPlayersUseCase(dependencies)(makeGame(), [
        { id: "user-1", name: "Alice" },
        { id: "user-2", name: "Bob", bot: { strategyName: "greedy" } },
      ]);

      const game = unwrap(result);
      expect(game.players.map((p) => p.id)).toEqual(["user-1", "user-2"]);
      expect(game.players[1]?.bot).toEqual({ strategyName: "greedy" });
    });

    test("should generate ids for players without one (mixed forms)", () => {
      counter = 0;
      const result = addPlayersUseCase(dependencies)(makeGame(), [
        "Alice",
        { id: "user-2", name: "Bob" },
        { name: "Carol" },
      ]);

      expect(unwrap(result).players.map((p) => p.id)).toEqual([
        "generated-1",
        "user-2",
        "generated-2",
      ]);
    });

    test("should reject duplicated ids", () => {
      const result = addPlayersUseCase(dependencies)(makeGame(), [
        { id: "same", name: "Alice" },
        { id: "same", name: "Bob" },
      ]);

      expect(result).toEqual(err(ErrorCode.INVALID_PLAYER_ID));
    });

    test("should reject empty ids", () => {
      const result = addPlayersUseCase(dependencies)(makeGame(), [
        { id: "  ", name: "Alice" },
        { name: "Bob" },
      ]);

      expect(result).toEqual(err(ErrorCode.INVALID_PLAYER_ID));
    });
  });
});
