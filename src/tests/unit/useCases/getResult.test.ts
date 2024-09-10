import { getResultUseCase } from "@core/useCases/getResult.js";
import { describe, test, expect } from "vitest";
import type { Kingdom } from "@core/domain/types/kingdom.js";
import { createPlayerBuilder } from "../../builder/player.js";
import { createGameBuilder } from "../../builder/game.js";
import { unwrap } from "@utils/result.js";
import type { NextStep } from "@core/domain/types/game.js";
import type { ExtraRule } from "@core/domain/types/rule.js";

describe("Get result of a game", () => {
  test("should return player ranking, decide on score (no tie)", async () => {
    // Arrange

    const players = [
      { id: "player1-id", name: "player1" },
      { id: "player2-id", name: "player2" },
    ].map((player, index) =>
      createPlayerBuilder().withId(player.id).withName(player.name).build()
    );

    const initialGame = createGameBuilder<NextStep>()
      .withDefaultDominoes()
      .withPlayers(players)
      .withTurn(6)
      .build();

    const scoreResult = [
      {
        playerId: "player2-id",
        playerName: "player2",
        details: { points: 0, maxPropertiesSize: 0, totalCrowns: 0 },
      },
      {
        playerId: "player1-id",
        playerName: "player1",
        details: { points: 24, maxPropertiesSize: 5, totalCrowns: 6 },
      },
    ];

    // Act
    const result = getResultUseCase(initialGame, scoreResult);

    // Assert
    const unwrapResult = unwrap(result);
    expect(unwrapResult).toEqual({
      ...initialGame,
      result: [
        {
          playerId: "player1-id",
          playerName: "player1",
          details: { points: 24, maxPropertiesSize: 5, totalCrowns: 6 },
          position: 1,
        },
        {
          playerId: "player2-id",
          playerName: "player2",
          details: { points: 0, maxPropertiesSize: 0, totalCrowns: 0 },
          position: 2,
        },
      ],
    });
  });

  test("should return player ranking with tie, decide on maxPropertiesSize", async () => {
    // Arrange
    const players = [
      { id: "player1-id", name: "player1" },
      { id: "player2-id", name: "player2" },
    ].map((player) =>
      createPlayerBuilder().withId(player.id).withName(player.name).build()
    );

    const initialGame = createGameBuilder<NextStep>()
      .withDefaultDominoes()
      .withPlayers(players)
      .withTurn(6)
      .build();

    const scoreResult = [
      {
        playerId: "player2-id",
        playerName: "player2",
        details: { points: 24, maxPropertiesSize: 4, totalCrowns: 7 },
      },
      {
        playerId: "player1-id",
        playerName: "player1",
        details: { points: 24, maxPropertiesSize: 5, totalCrowns: 6 },
      },
    ];

    // Act
    const result = getResultUseCase(initialGame, scoreResult);

    // Assert
    const unwrapResult = unwrap(result);
    expect(unwrapResult).toEqual({
      ...initialGame,
      result: [
        {
          playerId: "player1-id",
          playerName: "player1",
          details: { points: 24, maxPropertiesSize: 5, totalCrowns: 6 },
          position: 1,
        },
        {
          playerId: "player2-id",
          playerName: "player2",
          details: { points: 24, maxPropertiesSize: 4, totalCrowns: 7 },
          position: 2,
        },
      ],
    });
  });

  test("should return player ranking with tie, decide on totalCrowns", async () => {
    // Arrange

    const players = [
      { id: "player1-id", name: "player1" },
      { id: "player2-id", name: "player2" },
    ].map((player, index) =>
      createPlayerBuilder().withId(player.id).withName(player.name).build()
    );

    const initialGame = createGameBuilder<NextStep>()
      .withDefaultDominoes()
      .withPlayers(players)
      .withTurn(6)
      .build();

    const scoreResult = [
      {
        playerId: "player2-id",
        playerName: "player2",
        details: { points: 4, maxPropertiesSize: 2, totalCrowns: 3 },
      },
      {
        playerId: "player1-id",
        playerName: "player1",
        details: { points: 4, maxPropertiesSize: 2, totalCrowns: 2 },
      },
    ];

    // Act
    const result = getResultUseCase(initialGame, scoreResult);

    // Assert
    const unwrapResult = unwrap(result);
    expect(unwrapResult).toEqual({
      ...initialGame,
      result: [
        {
          playerId: "player2-id",
          playerName: "player2",
          details: { points: 4, maxPropertiesSize: 2, totalCrowns: 3 },
          position: 1,
        },
        {
          playerId: "player1-id",
          playerName: "player1",
          details: { points: 4, maxPropertiesSize: 2, totalCrowns: 2 },
          position: 2,
        },
      ],
    });
  });

  test("should apply bonus for rules 'The middle Kingdom'", () => {
    // Arrange
    const initialGrid: Kingdom = [
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "castle", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
    ];

    const players = [
      { id: "player1-id", name: "player1" },
      { id: "player2-id", name: "player2" },
    ].map((player) =>
      createPlayerBuilder()
        .withId(player.id)
        .withName(player.name)
        .withKingdom(initialGrid)
        .build()
    );

    const initialGame = createGameBuilder<NextStep>()
      .withDefaultDominoes()
      .withPlayers(players)
      .withTurn(6)
      .build();

    const extraRules: ExtraRule = {
      name: "The middle Kingdom",
      description:
        "Gain 10 additional points if your castle is in the middle of the kingdom.",
      mode: [{ name: "Classic", description: "King Domino classic mode" }],
    };

    initialGame.rules.extra.push(extraRules);

    const scoreResult = [
      {
        playerId: "player2-id",
        playerName: "player2",
        details: { points: 0, maxPropertiesSize: 24, totalCrowns: 0 },
      },
      {
        playerId: "player1-id",
        playerName: "player1",
        details: { points: 0, maxPropertiesSize: 24, totalCrowns: 0 },
      },
    ];

    // Act
    const result = getResultUseCase(initialGame, scoreResult);

    // Assert
    const unwrapResult = unwrap(result);
    expect(unwrapResult).toEqual({
      ...initialGame,
      result: [
        {
          playerId: "player2-id",
          playerName: "player2",
          details: { points: 10, maxPropertiesSize: 24, totalCrowns: 0 },
          position: 1,
        },
        {
          playerId: "player1-id",
          playerName: "player1",
          details: { points: 10, maxPropertiesSize: 24, totalCrowns: 0 },
          position: 1,
        },
      ],
    });
  });

  test("should not apply bonus for rules 'The middle Kingdom'", () => {
    // Arrange
    const initialGrid: Kingdom = [
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "castle", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
    ];

    const players = [
      { id: "player1-id", name: "player1" },
      { id: "player2-id", name: "player2" },
    ].map((player) =>
      createPlayerBuilder()
        .withId(player.id)
        .withName(player.name)
        .withKingdom(initialGrid)
        .build()
    );

    const initialGame = createGameBuilder<NextStep>()
      .withDefaultDominoes()
      .withPlayers(players)
      .withTurn(6)
      .build();

    const extraRules: ExtraRule = {
      name: "The middle Kingdom",
      description:
        "Gain 10 additional points if your castle is in the middle of the kingdom.",
      mode: [{ name: "Classic", description: "King Domino classic mode" }],
    };

    initialGame.rules.extra.push(extraRules);

    const scoreResult = [
      {
        playerId: "player2-id",
        playerName: "player2",
        details: { points: 0, maxPropertiesSize: 24, totalCrowns: 0 },
      },
      {
        playerId: "player1-id",
        playerName: "player1",
        details: { points: 0, maxPropertiesSize: 24, totalCrowns: 0 },
      },
    ];

    // Act
    const result = getResultUseCase(initialGame, scoreResult);

    // Assert
    const unwrapResult = unwrap(result);
    expect(unwrapResult).toEqual({
      ...initialGame,
      result: [
        {
          playerId: "player2-id",
          playerName: "player2",
          details: { points: 0, maxPropertiesSize: 24, totalCrowns: 0 },
          position: 1,
        },
        {
          playerId: "player1-id",
          playerName: "player1",
          details: { points: 0, maxPropertiesSize: 24, totalCrowns: 0 },
          position: 1,
        },
      ],
    });
  });

  test("should apply bonus for rules 'Harmony'", () => {
    // Arrange
    const initialGrid: Kingdom = [
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "castle", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "wheat", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
      [
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
        { type: "empty", crowns: 0 },
      ],
    ];

    const players = [
      { id: "player1-id", name: "player1" },
      { id: "player2-id", name: "player2" },
    ].map((player) =>
      createPlayerBuilder()
        .withId(player.id)
        .withName(player.name)
        .withKingdom(initialGrid)
        .build()
    );

    const initialGame = createGameBuilder<NextStep>()
      .withDefaultDominoes()
      .withPlayers(players)
      .withTurn(6)
      .build();

    const extraRules: ExtraRule = {
      name: "Harmony",
      description:
        "Gain 5 additional points if your kingdom is complete (no discarded dominoes).",
      mode: [{ name: "Classic", description: "King Domino classic mode" }],
    };

    initialGame.rules.extra.push(extraRules);

    const scoreResult = [
      {
        playerId: "player2-id",
        playerName: "player2",
        details: { points: 0, maxPropertiesSize: 24, totalCrowns: 0 },
      },
      {
        playerId: "player1-id",
        playerName: "player1",
        details: { points: 0, maxPropertiesSize: 24, totalCrowns: 0 },
      },
    ];

    // Act
    const result = getResultUseCase(initialGame, scoreResult);

    // Assert
    const unwrapResult = unwrap(result);
    expect(unwrapResult).toEqual({
      ...initialGame,
      result: [
        {
          playerId: "player2-id",
          playerName: "player2",
          details: { points: 5, maxPropertiesSize: 24, totalCrowns: 0 },
          position: 1,
        },
        {
          playerId: "player1-id",
          playerName: "player1",
          details: { points: 5, maxPropertiesSize: 24, totalCrowns: 0 },
          position: 1,
        },
      ],
    });
  });
});
