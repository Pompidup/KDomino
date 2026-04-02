import { findCrownsNotCoveredByGiants } from "@core/domain/entities/giant.js";
import type { GameState } from "@core/domain/types/game.js";
import { isGameWithNextAction } from "@core/domain/types/game.js";
import { playerActions } from "@core/domain/types/player.js";
import { describe, expect, test } from "vitest";
import { createGameEngine } from "../../index.js";

const playAoGGame = (playerNames: string[], seed: string, mode = "AgeOfGiants") => {
  const engine = createGameEngine({});
  let game: GameState;

  game = engine.createGame({ mode, seed });
  expect(game.mode.name).toBe(mode);
  expect(game.ageOfGiants).toBeDefined();
  expect(game.ageOfGiants?.giantPool).toBe(6);
  expect(game.ageOfGiants?.questTiles).toHaveLength(2);

  game = engine.addPlayers({ game, players: playerNames });
  expect(game.players).toHaveLength(playerNames.length);
  for (const player of game.players) {
    expect(player.giants).toEqual([]);
  }

  // Verify AoG-specific rules
  expect(game.rules.basic.dominoesPerTurn).toBe(5);
  expect(game.rules.basic.dominoesDiscardedPerTurn).toBeDefined();

  game = engine.startGame({ game });
  expect(isGameWithNextAction(game)).toBe(true);

  let iterations = 0;
  const maxIterations = 1000;

  while (isGameWithNextAction(game) && iterations < maxIterations) {
    iterations++;
    const action = game.nextAction.nextAction;
    const lordId = game.nextAction.nextLord;

    if (action === playerActions.pickDomino) {
      const unpicked = game.currentDominoes.find((d) => !d.picked);
      if (!unpicked) break;
      game = engine.chooseDomino({
        game,
        lordId,
        dominoPick: unpicked.domino.number,
      });
    } else if (action === playerActions.placeDomino) {
      const lord = game.lords.find((l) => l.id === lordId);
      const player = game.players.find((p) => p.id === lord?.playerId);
      if (!lord?.dominoPicked || !player) break;

      const placements = engine.getValidPlacements({
        kingdom: player.kingdom,
        domino: lord.dominoPicked,
      });

      if (placements.length > 0) {
        game = engine.placeDomino({
          game,
          lordId,
          position: placements[0]!.position,
          rotation: placements[0]!.rotation,
        });
      } else {
        game = engine.discardDomino({ game, lordId });
      }
    } else if (action === playerActions.pass) {
      game = engine.discardDomino({ game, lordId });
    } else if (action === playerActions.placeGiant) {
      // Place giant on first available crown
      const lord = game.lords.find((l) => l.id === lordId);
      const player = game.players.find((p) => p.id === lord?.playerId);
      if (player) {
        const crowns = findCrownsNotCoveredByGiants(
          player.kingdom,
          player.giants ?? [],
        );
        if (crowns.length > 0) {
          game = engine.placeGiant({ game, lordId, position: crowns[0]! });
        } else {
          game = engine.skipOptionalAction({ game, lordId });
        }
      } else {
        game = engine.skipOptionalAction({ game, lordId });
      }
    } else if (action === playerActions.sendGiant) {
      // Skip sending giant for simplicity
      game = engine.skipOptionalAction({ game, lordId });
    } else if (
      action === playerActions.placeKnight ||
      action === playerActions.constructBuilding ||
      action === playerActions.useDragon
    ) {
      // QueenDomino optional actions (for AoG-QD mode)
      game = engine.skipOptionalAction({ game, lordId });
    }
  }

  expect(iterations).toBeLessThan(maxIterations);
  expect(isGameWithNextAction(game)).toBe(false);

  const results = engine.getResults({ game });
  expect(results.result).toHaveLength(playerNames.length);
  expect(results.result[0]!.position).toBe(1);

  return results;
};

describe("Age of Giants Full Game Simulation", () => {
  test("should simulate a complete 2-player AoG game", () => {
    const results = playAoGGame(["Alice", "Bob"], "aog-2p-test");
    expect(results.result).toHaveLength(2);
    // 2 players: 2 lords each, 6 turns, discard 1 per turn
    expect(results.result.every((r) => r.details.points >= 0)).toBe(true);
  });

  test("should simulate a complete 3-player AoG game", () => {
    const results = playAoGGame(["Alice", "Bob", "Charlie"], "aog-3p-test");
    expect(results.result).toHaveLength(3);
  });

  test("should simulate a complete 4-player AoG game", () => {
    const results = playAoGGame(
      ["Alice", "Bob", "Charlie", "Diana"],
      "aog-4p-test",
    );
    expect(results.result).toHaveLength(4);
  });

  test("should simulate a complete 5-player AoG game", () => {
    const results = playAoGGame(
      ["Alice", "Bob", "Charlie", "Diana", "Eve"],
      "aog-5p-test",
    );
    expect(results.result).toHaveLength(5);
  });

  test("should verify AoG game setup properties", () => {
    const engine = createGameEngine({});
    let game: GameState;

    game = engine.createGame({ mode: "AgeOfGiants", seed: "setup-test" });
    expect(game.dominoes).toHaveLength(60);
    expect(game.ageOfGiants?.giantPool).toBe(6);
    expect(game.ageOfGiants?.questTiles).toHaveLength(2);

    // Check that quest tiles have valid types
    for (const quest of game.ageOfGiants!.questTiles) {
      expect(quest.id).toBeTypeOf("number");
      expect(quest.type).toBeTypeOf("string");
      expect(quest.points).toBeGreaterThan(0);
    }
  });

  test("should support 5 players in AoG mode", () => {
    const engine = createGameEngine({});
    let game: GameState;

    game = engine.createGame({ mode: "AgeOfGiants", seed: "5p-test" });
    game = engine.addPlayers({
      game,
      players: ["A", "B", "C", "D", "E"].map((n) => `Player${n}`),
    });

    expect(game.players).toHaveLength(5);
    expect(game.rules.basic.lords).toBe(1);
    expect(game.rules.basic.dominoesPerTurn).toBe(5);
    expect(game.rules.basic.dominoesDiscardedPerTurn).toBe(0);
  });

  test("should correctly discard dominos for 3 players", () => {
    const engine = createGameEngine({});
    let game: GameState;

    game = engine.createGame({ mode: "AgeOfGiants", seed: "discard-test" });
    game = engine.addPlayers({ game, players: ["Alice", "Bob", "Charlie"] });
    game = engine.startGame({ game });

    // 3 players: 5 drawn, 2 discarded = 3 presented
    expect(isGameWithNextAction(game)).toBe(true);
    if (isGameWithNextAction(game)) {
      expect(game.currentDominoes).toHaveLength(3);
    }
  });

  test("should correctly discard dominos for 4 players", () => {
    const engine = createGameEngine({});
    let game: GameState;

    game = engine.createGame({ mode: "AgeOfGiants", seed: "discard-4p-test" });
    game = engine.addPlayers({
      game,
      players: ["Alice", "Bob", "Charlie", "Diana"],
    });
    game = engine.startGame({ game });

    // 4 players: 5 drawn, 1 discarded = 4 presented
    if (isGameWithNextAction(game)) {
      expect(game.currentDominoes).toHaveLength(4);
    }
  });

  test("should present all 5 dominos for 5 players", () => {
    const engine = createGameEngine({});
    let game: GameState;

    game = engine.createGame({ mode: "AgeOfGiants", seed: "5p-draw-test" });
    game = engine.addPlayers({
      game,
      players: ["Alice", "Bob", "Charlie", "Diana", "Eve"],
    });
    game = engine.startGame({ game });

    // 5 players: 5 drawn, 0 discarded = 5 presented
    if (isGameWithNextAction(game)) {
      expect(game.currentDominoes).toHaveLength(5);
    }
  });
});

describe("Age of Giants + QueenDomino Mode", () => {
  test("should simulate a complete AoG-QueenDomino game", () => {
    const results = playAoGGame(
      ["Alice", "Bob", "Charlie", "Diana"],
      "aog-qd-test",
      "AgeOfGiants-QueenDomino",
    );
    expect(results.result).toHaveLength(4);
  });
});
