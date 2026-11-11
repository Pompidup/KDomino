import type { NextStep } from "@core/domain/types/game.js";
import type { Kingdom } from "@core/domain/types/kingdom.js";
import type { ExtraRule } from "@core/domain/types/rule.js";
import {
  getResultUseCase,
  rankScoreResults,
} from "@core/useCases/getResult.js";
import { unwrap } from "@utils/result.js";
import { describe, expect, test } from "vitest";
import { createGameBuilder } from "../../builder/game.js";
import { createPlayerBuilder } from "../../builder/player.js";

describe("Get result of a game", () => {
  test("should return player ranking, decide on score (no tie)", async () => {
    // Arrange

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
    const result = rankScoreResults(scoreResult);

    // Assert
    expect(result).toEqual([
      {
        playerId: "player1-id",
        playerName: "player1",
        details: { points: 24, maxPropertiesSize: 5, totalCrowns: 6 },
        position: 1,
        tiebreaker: null,
        tied: false,
      },
      {
        playerId: "player2-id",
        playerName: "player2",
        details: { points: 0, maxPropertiesSize: 0, totalCrowns: 0 },
        position: 2,
        tiebreaker: null,
        tied: false,
      },
    ]);
  });

  test("should return player ranking with tie, decide on maxPropertiesSize", async () => {
    // Arrange

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
    const result = rankScoreResults(scoreResult);

    // Assert
    expect(result).toEqual([
      {
        playerId: "player1-id",
        playerName: "player1",
        details: { points: 24, maxPropertiesSize: 5, totalCrowns: 6 },
        position: 1,
        tiebreaker: "largestTerritory",
        tied: false,
      },
      {
        playerId: "player2-id",
        playerName: "player2",
        details: { points: 24, maxPropertiesSize: 4, totalCrowns: 7 },
        position: 2,
        tiebreaker: "largestTerritory",
        tied: false,
      },
    ]);
  });

  test("should decide on crowns when points and maxPropertiesSize are equal (Kingdomino)", () => {
    const scoreResult = [
      {
        playerId: "player1-id",
        playerName: "player1",
        details: { points: 4, maxPropertiesSize: 2, totalCrowns: 2 },
      },
      {
        playerId: "player2-id",
        playerName: "player2",
        details: { points: 4, maxPropertiesSize: 2, totalCrowns: 3 },
      },
    ];

    const result = rankScoreResults(scoreResult);

    // Official Kingdomino rule: largest territory, then most crowns
    expect(result).toEqual([
      {
        playerId: "player2-id",
        playerName: "player2",
        details: { points: 4, maxPropertiesSize: 2, totalCrowns: 3 },
        position: 1,
        tiebreaker: "crowns",
        tied: false,
      },
      {
        playerId: "player1-id",
        playerName: "player1",
        details: { points: 4, maxPropertiesSize: 2, totalCrowns: 2 },
        position: 2,
        tiebreaker: "crowns",
        tied: false,
      },
    ]);
  });

  test("should share the position when points, maxPropertiesSize and crowns are equal", () => {
    const scoreResult = [
      {
        playerId: "player2-id",
        playerName: "player2",
        details: { points: 4, maxPropertiesSize: 2, totalCrowns: 3 },
      },
      {
        playerId: "player1-id",
        playerName: "player1",
        details: { points: 4, maxPropertiesSize: 2, totalCrowns: 3 },
      },
      {
        playerId: "player3-id",
        playerName: "player3",
        details: { points: 1, maxPropertiesSize: 1, totalCrowns: 1 },
      },
    ];

    const result = rankScoreResults(scoreResult);

    expect(
      result.map(({ playerId, position, tiebreaker, tied }) => ({
        playerId,
        position,
        tiebreaker,
        tied,
      })),
    ).toEqual([
      { playerId: "player2-id", position: 1, tiebreaker: "crowns", tied: true },
      { playerId: "player1-id", position: 1, tiebreaker: "crowns", tied: true },
      { playerId: "player3-id", position: 3, tiebreaker: null, tied: false },
    ]);
  });

  test("should share the position on equal largest territory with the Queendomino criteria", () => {
    const scoreResult = [
      {
        playerId: "player1-id",
        playerName: "player1",
        details: { points: 4, maxPropertiesSize: 2, totalCrowns: 2 },
      },
      {
        playerId: "player2-id",
        playerName: "player2",
        details: { points: 4, maxPropertiesSize: 2, totalCrowns: 3 },
      },
    ];

    // Official Queendomino rule: largest territory, then shared victory
    const result = rankScoreResults(scoreResult, ["largestTerritory"]);

    expect(
      result.map(({ playerId, position, tiebreaker, tied }) => ({
        playerId,
        position,
        tiebreaker,
        tied,
      })),
    ).toEqual([
      {
        playerId: "player1-id",
        position: 1,
        tiebreaker: "largestTerritory",
        tied: true,
      },
      {
        playerId: "player2-id",
        position: 1,
        tiebreaker: "largestTerritory",
        tied: true,
      },
    ]);
  });

  test("should report the deepest criterion compared against every player with the same points", () => {
    const scoreResult = [
      {
        playerId: "a",
        playerName: "a",
        details: { points: 10, maxPropertiesSize: 4, totalCrowns: 1 },
      },
      {
        playerId: "b",
        playerName: "b",
        details: { points: 10, maxPropertiesSize: 3, totalCrowns: 5 },
      },
      {
        playerId: "c",
        playerName: "c",
        details: { points: 10, maxPropertiesSize: 3, totalCrowns: 2 },
      },
    ];

    const result = rankScoreResults(scoreResult);

    expect(result.map((r) => [r.playerId, r.position, r.tiebreaker])).toEqual([
      ["a", 1, "largestTerritory"],
      ["b", 2, "crowns"],
      ["c", 3, "crowns"],
    ]);
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
        .build(),
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

    // Act
    const result = getResultUseCase(initialGame);

    // Assert
    const unwrapResult = unwrap(result);
    expect(unwrapResult).toMatchObject({
      ...initialGame,
      result: [
        {
          playerId: "player1-id",
          playerName: "player1",
          details: { points: 10, maxPropertiesSize: 24, totalCrowns: 0 },
          position: 1,
        },
        {
          playerId: "player2-id",
          playerName: "player2",
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
        .build(),
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

    // Act
    const result = getResultUseCase(initialGame);

    // Assert
    const unwrapResult = unwrap(result);
    expect(unwrapResult).toMatchObject({
      ...initialGame,
      result: [
        {
          playerId: "player1-id",
          playerName: "player1",
          details: { points: 0, maxPropertiesSize: 24, totalCrowns: 0 },
          position: 1,
        },
        {
          playerId: "player2-id",
          playerName: "player2",
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
        .build(),
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

    // Act
    const result = getResultUseCase(initialGame);

    // Assert
    const unwrapResult = unwrap(result);
    expect(unwrapResult).toMatchObject({
      ...initialGame,
      result: [
        {
          playerId: "player1-id",
          playerName: "player1",
          details: { points: 5, maxPropertiesSize: 24, totalCrowns: 0 },
          position: 1,
        },
        {
          playerId: "player2-id",
          playerName: "player2",
          details: { points: 5, maxPropertiesSize: 24, totalCrowns: 0 },
          position: 1,
        },
      ],
    });
  });
});
