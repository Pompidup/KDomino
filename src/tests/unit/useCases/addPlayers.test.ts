import { addPlayersUseCase } from "../../../core/useCases/addPlayers.js";
import { createGameBuilder } from "../../builder/game.js";
import { describe, test, expect } from "vitest";
import {
  Game,
  NextStep,
  Players,
  Rules,
} from "../../../core/domain/types/index.js";
import {
  createEmptyKingdom,
  placeCastle,
} from "../../../core/domain/entities/kingdom.js";
import { unwrap } from "../../../utils/testHelpers.js";
import { err } from "../../../utils/result.js";

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
      shuffleMethod: (dominoes) => dominoes,
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

  test("should return an error for only 1 player", () => {
    // Arrange
    const initialGame = createGameBuilder<NextStep>()
      .withId("uuid-test")
      .withMode({ name: "Classic", description: "Classic mode" })
      .build();

    const payload = ["Player 1"];
    const dependencies = {
      uuidMethod: () => "uuid-test",
      shuffleMethod: (dominoes) => dominoes,
      ruleRepository: inMemoryRepo,
    };

    // Act
    const result = addPlayersUseCase(dependencies)(initialGame, payload);

    // Assert
    expect(result).toEqual(err("Invalid number of players"));
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
      shuffleMethod: (dominoes) => dominoes,
      ruleRepository: inMemoryRepo,
    };

    // Act
    const result = addPlayersUseCase(dependencies)(initialGame, payload);

    // Assert
    expect(result).toEqual(err("Invalid number of players"));
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
      shuffleMethod: (dominoes) => dominoes,
      ruleRepository: inMemoryRepo,
    };

    // Act
    const result = addPlayersUseCase(dependencies)(initialGame, payload);

    // Assert
    expect(result).toEqual(err("Invalid player name: Pl"));
  });
});
