import {createGameEngine} from "../../index";
import type {GameEngine} from "@core/portUserside/engine.js";
import {beforeAll, describe, expect, test} from "vitest";

describe("Engine", () => {
  let engine: GameEngine;
  beforeAll(() => {
    engine = createGameEngine({});
  });

  test("should be able to get modes", () => {
    // Act
    const modes = engine.getModes({});

    // Assert
    expect(modes).toEqual([
      { name: "Classic", description: "Original KingDomino rules" },
    ]);
  });

  test("should be able to create a game", () => {
    // Act
    const newGame = engine.createGame({ mode: "Classic" });

    // Assert
    expect(newGame.id).toBeDefined();
    expect(newGame.mode).toEqual({
      name: "Classic",
      description: "Original KingDomino rules",
    });
    expect(newGame.dominoes).toHaveLength(48);
    expect(newGame.turn).toEqual(0);
    expect(newGame.nextAction).toEqual({ type: "step", step: "addPlayers" });
  });

  test("should be able to add players", () => {
    // Arrange
    const newGame = engine.createGame({ mode: "Classic" });

    // Act
    const gameWithPlayers = engine.addPlayers({
      game: newGame,
      players: ["player1", "player2"],
    });

    // Assert
    expect(gameWithPlayers.rules).toEqual({
      basic: {
        lords: 2,
        maxDominoes: 24,
        dominoesPerTurn: 4,
        maxTurns: 6,
      },
      extra: [],
    });
    expect(gameWithPlayers.dominoes).toHaveLength(24);
    expect(gameWithPlayers.players).toHaveLength(2);
    expect(gameWithPlayers.nextAction).toEqual({
      type: "step",
      step: "options",
    });
  });

  test("should be able to get extra rules", () => {
    // Arrange
    engine.createGame({ mode: "Classic" });
// Act
    const extraRules = engine.getExtraRules({ mode: "Classic", players: 2 });

    // Assert
    expect(extraRules).toEqual([
      {
        name: "The middle Kingdom",
        description:
          "Gain 10 additional points if your castle is in the middle of the kingdom.",
        mode: [{ name: "Classic", description: "King Domino classic mode" }],
      },
      {
        name: "Harmony",
        description:
          "Gain 5 additional points if your kingdom is complete (no discarded dominoes).",
        mode: [{ name: "Classic", description: "King Domino classic mode" }],
      },
    ]);
  });

  test("should be able to add extra rules", () => {
    // Arrange
    const newGame = engine.createGame({ mode: "Classic" });
    const gameWithPlayers = engine.addPlayers({
      game: newGame,
      players: ["player1", "player2"],
    });

    // Act
    const gameWithExtraRules = engine.addExtraRules({
      game: gameWithPlayers,
      extraRules: ["The middle Kingdom"],
    });

    // Assert
    expect(gameWithExtraRules.rules).toEqual({
      basic: {
        lords: 2,
        maxDominoes: 24,
        dominoesPerTurn: 4,
        maxTurns: 6,
      },
      extra: [
        {
          name: "The middle Kingdom",
          description:
            "Gain 10 additional points if your castle is in the middle of the kingdom.",
          mode: [{ name: "Classic", description: "King Domino classic mode" }],
        },
      ],
    });
    expect(gameWithExtraRules.nextAction).toEqual({
      type: "step",
      step: "start",
    });
  });

  test("should be able to start a game", () => {
    // Arrange
    const newGame = engine.createGame({ mode: "Classic" });
    const gameWithPlayers = engine.addPlayers({
      game: newGame,
      players: ["player1", "player2"],
    });

    // Act
    const startedGame = engine.startGame({ game: gameWithPlayers });

    // Assert
    expect(startedGame.nextAction).toEqual({
      type: "action",
      nextLord: expect.any(String),
      nextAction: "pickDomino",
    });
    expect(startedGame.currentDominoes).toHaveLength(4);
    expect(startedGame.dominoes).toHaveLength(20);
    expect(startedGame.lords).toHaveLength(4);
    expect(startedGame.nextAction).toEqual({
      type: "action",
      nextLord: startedGame.lords[0]!.id,
      nextAction: "pickDomino",
    });
    expect(startedGame.turn).toEqual(0);
  });

  test("should be able to choose a domino", () => {
    // Arrange
    const newGame = engine.createGame({ mode: "Classic" });
    const gameWithPlayers = engine.addPlayers({
      game: newGame,
      players: ["player1", "player2"],
    });
    const startedGame = engine.startGame({ game: gameWithPlayers });

    const firstLordId = startedGame.nextAction.nextLord;
    const firstDomino = startedGame.currentDominoes[0]!.domino;

    // Act
    const gameWithChosenDomino = engine.chooseDomino({
      game: startedGame,
      lordId: firstLordId,
      dominoPick: firstDomino.number,
    });

    // Assert
    expect(gameWithChosenDomino.currentDominoes[0]!.picked).toBeTruthy();
    expect(gameWithChosenDomino.currentDominoes[0]!.lordId).toEqual(
      firstLordId
    );
    expect(gameWithChosenDomino.nextAction).toEqual({
      type: "action",
      nextLord: startedGame.lords[1]!.id,
      nextAction: "pickDomino",
    });
  });

  test("should be able to discard a domino", () => {
    // Arrange
    const newGame = engine.createGame({ mode: "Classic" });
    const gameWithPlayers = engine.addPlayers({
      game: newGame,
      players: ["player1", "player2"],
    });
    let gameWithChosenDomino = engine.startGame({game: gameWithPlayers});
    for (let i = 0; i < 4; i++) {
      const lordId = gameWithChosenDomino.nextAction.nextLord;
      const domino = gameWithChosenDomino.currentDominoes[i]!.domino;
      gameWithChosenDomino = engine.chooseDomino({
        game: gameWithChosenDomino,
        lordId: lordId,
        dominoPick: domino.number,
      });
    }

    // Act
    const gameWithDiscardedDomino = engine.discardDomino({
      game: gameWithChosenDomino,
      lordId: gameWithChosenDomino.nextAction.nextLord,
    });

    // Assert
    expect(gameWithDiscardedDomino.nextAction).toEqual({
      type: "action",
      nextLord: gameWithChosenDomino.lords[0]!.id,
      nextAction: "pickDomino",
    });
  });

  test("should be able to place a domino", () => {
    // Arrange
    const newGame = engine.createGame({ mode: "Classic" });
    const gameWithPlayers = engine.addPlayers({
      game: newGame,
      players: ["player1", "player2"],
    });
    let gameWithChosenDomino = engine.startGame({game: gameWithPlayers});
    for (let i = 0; i < 4; i++) {
      const lordId = gameWithChosenDomino.nextAction.nextLord;
      const domino = gameWithChosenDomino.currentDominoes[i]!.domino;
      gameWithChosenDomino = engine.chooseDomino({
        game: gameWithChosenDomino,
        lordId: lordId,
        dominoPick: domino.number,
      });
    }

    const lordId = gameWithChosenDomino.nextAction.nextLord;

    // Act
    const gameWithPlacedDomino = engine.placeDomino({
      game: gameWithChosenDomino,
      lordId: lordId,
      position: { x: 5, y: 4 },
      rotation: 270,
    });

    const lordIndex = gameWithPlacedDomino.lords.findIndex(
      (lord) => lord.id === lordId
    );
    const playerIndex = gameWithPlacedDomino.players.findIndex(
      (player) => player.id === gameWithPlacedDomino.lords[lordIndex]!.playerId
    );
    const player = gameWithPlacedDomino.players[playerIndex];
    const domino = gameWithPlacedDomino.lords[lordIndex]!.dominoPicked;

    // Assert
    expect(gameWithPlacedDomino.nextAction).toEqual({
      type: "action",
      nextLord: lordId,
      nextAction: "pickDomino",
    });
    expect(gameWithPlacedDomino.lords[0]!.hasPlace).toBeTruthy();
    expect(player!.kingdom[4]![5]).toEqual(domino!.right);
    expect(player!.kingdom[5]![5]).toEqual(domino!.left);
  });

  test("should be able to calculate score", () => {
    // Arrange
    const newGame = engine.createGame({ mode: "Classic" });
    const gameWithPlayers = engine.addPlayers({
      game: newGame,
      players: ["player1", "player2"],
    });
    const startedGame = engine.startGame({ game: gameWithPlayers });

    // Act
    const score = engine.calculateScore({
      kingdom: startedGame.players[0]!.kingdom,
    });

    // Assert
    expect(score).toEqual({
      points: 0,
      maxPropertiesSize: 0,
      totalCrowns: 0,
    });
  });
});
