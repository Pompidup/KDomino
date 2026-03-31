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
        maxKingdomSize: 5,
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
      {
        name: "The Mighty Duel",
        description:
          "Use all 48 dominoes and build a 7x7 kingdom. For 2 players only.",
        mode: [{ name: "Classic", description: "King Domino classic mode" }],
        playersLimit: 2,
      },
      {
        name: "Dynasty",
        description:
          "Play 3 games in a row. The player with the highest total points wins.",
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
        maxKingdomSize: 5,
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

  test("should be able to discard a domino when no valid placement exists", () => {
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

    // Fill the current player's kingdom 5×5 so no placement is possible
    const currentLord = gameWithChosenDomino.lords.find(
      (l) => l.id === gameWithChosenDomino.nextAction.nextLord
    )!;
    const currentPlayer = gameWithChosenDomino.players.find(
      (p) => p.id === currentLord.playerId
    )!;
    // Fill all cells in the 5×5 area (2,2)-(6,6) with wheat, except castle at (4,4)
    for (let y = 2; y <= 6; y++) {
      for (let x = 2; x <= 6; x++) {
        if (x === 4 && y === 4) continue; // keep castle
        currentPlayer.kingdom[y]![x] = { type: "wheat", crowns: 0 };
      }
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

  test("should not be able to discard a domino when valid placement exists", () => {
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

    // Act & Assert — kingdom is nearly empty so placement exists
    expect(() =>
      engine.discardDomino({
        game: gameWithChosenDomino,
        lordId: gameWithChosenDomino.nextAction.nextLord,
      })
    ).toThrowError("Cannot discard: valid placement exists");
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

  test("should support The Mighty Duel variant", () => {
    // Arrange
    const newGame = engine.createGame({ mode: "Classic" });
    const gameWithPlayers = engine.addPlayers({
      game: newGame,
      players: ["player1", "player2"],
    });

    // Act — add Mighty Duel
    const gameWithExtraRules = engine.addExtraRules({
      game: gameWithPlayers,
      extraRules: ["The Mighty Duel"],
    });

    // Assert — basic rules overridden
    expect(gameWithExtraRules.rules.basic.maxDominoes).toBe(48);
    expect(gameWithExtraRules.rules.basic.maxTurns).toBe(12);
    expect(gameWithExtraRules.rules.basic.maxKingdomSize).toBe(7);
    expect(gameWithExtraRules.dominoes).toHaveLength(48);
  });

  test("should allow placements beyond 5x5 with Mighty Duel", async () => {
    // Build a kingdom where positions would exceed 5x5 but fit in 7x7
    // Castle at (4,4). Place wheat tiles spanning x: 1..5 (5 wide)
    const { createEmptyKingdom, placeCastle, placeTile } = await import("@core/domain/entities/kingdom.js");
    let kingdom = placeCastle(createEmptyKingdom());
    kingdom = placeTile(kingdom, { x: 3, y: 4 }, { type: "wheat", crowns: 0 });
    kingdom = placeTile(kingdom, { x: 2, y: 4 }, { type: "wheat", crowns: 0 });
    kingdom = placeTile(kingdom, { x: 1, y: 4 }, { type: "wheat", crowns: 0 });
    kingdom = placeTile(kingdom, { x: 5, y: 4 }, { type: "wheat", crowns: 0 });
    kingdom = placeTile(kingdom, { x: 6, y: 4 }, { type: "wheat", crowns: 0 });
    // bbox x: 1..6 = 6 wide — exceeds 5x5 but fits in 7x7

    const domino = { left: { type: "wheat" as const, crowns: 0 }, right: { type: "wheat" as const, crowns: 0 }, number: 99 };

    // With maxKingdomSize=5, placement at (7,4) should fail
    const placementsStandard = engine.getValidPlacements({ kingdom, domino, maxKingdomSize: 5 });
    const hasX7Standard = placementsStandard.some((p: any) => p.position.x === 7);
    expect(hasX7Standard).toBe(false);

    // With maxKingdomSize=7, placement at (7,4) should succeed
    const placementsMighty = engine.getValidPlacements({ kingdom, domino, maxKingdomSize: 7 });
    const hasX7Mighty = placementsMighty.some((p: any) => p.position.x === 7);
    expect(hasX7Mighty).toBe(true);
  });
});
