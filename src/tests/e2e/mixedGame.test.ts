import {
  type GameState,
  type GameWithNextAction,
  isGameWithNextAction,
} from "@core/domain/types/game.js";
import type { GameEngine } from "@core/portUserside/engine.js";
import { isBotTurn, playBotTurns } from "@core/useCases/bot.js";
import {
  deserializeGame,
  serializeGame,
} from "@core/useCases/serialization.js";
import { unwrap } from "@utils/result.js";
import { describe, expect, test } from "vitest";
import { createGameEngine } from "../../index.js";

/**
 * Helper: play a human turn (pick first available domino, place at first valid position).
 */
const playHumanTurn = (
  engine: GameEngine,
  game: GameWithNextAction,
): GameState => {
  const action = game.nextAction;

  if (action.nextAction === "pickDomino") {
    const available = game.currentDominoes.find((d) => !d.picked);
    return engine.chooseDomino({
      game,
      lordId: action.nextLord,
      dominoPick: available!.domino.number,
    });
  }

  if (action.nextAction === "placeDomino") {
    const lord = game.lords.find((l) => l.id === action.nextLord)!;
    const player = game.players.find((p) => p.id === lord.playerId)!;
    const domino = lord.dominoPicked!;
    const valid = engine.getValidPlacements({
      kingdom: player.kingdom,
      domino,
    });

    if (valid.length > 0) {
      return engine.placeDomino({
        game,
        lordId: action.nextLord,
        position: valid[0]!.position,
        rotation: valid[0]!.rotation,
      });
    }
    return engine.discardDomino({ game, lordId: action.nextLord });
  }

  return engine.discardDomino({ game, lordId: action.nextLord });
};

describe("Mixed Human/Bot Game", () => {
  const engine = createGameEngine({});

  test("1 human + 1 bot: bot turns are auto-played", () => {
    let game: GameState = engine.createGame({
      mode: "Classic",
      seed: "mixed-2p",
    });
    game = engine.addPlayers({
      game,
      players: [
        "Human",
        { name: "Bot Greedy", bot: { strategyName: "greedy" } },
      ],
    });
    game = engine.startGame({ game });

    // Verify bot player has bot flag
    const botPlayer = game.players.find((p) => p.name === "Bot Greedy");
    expect(botPlayer?.bot).toEqual({ strategyName: "greedy" });

    const humanPlayer = game.players.find((p) => p.name === "Human");
    expect(humanPlayer?.bot).toBeUndefined();

    // Play game: auto-play bot turns, manually play human turns
    let humanTurnCount = 0;
    game = playBotTurns(engine, game);

    while (isGameWithNextAction(game)) {
      // Should be a human turn now
      expect(isBotTurn(game)).toBe(false);
      game = playHumanTurn(engine, game);
      humanTurnCount++;
      // Auto-play any bot turns
      game = playBotTurns(engine, game);
    }

    expect(humanTurnCount).toBeGreaterThan(0);

    const results = engine.getResults({ game });
    expect(results.result).toHaveLength(2);
  });

  test("2 humans + 1 bot: 3 player mixed game", () => {
    let game: GameState = engine.createGame({
      mode: "Classic",
      seed: "mixed-3p",
    });
    game = engine.addPlayers({
      game,
      players: [
        "Alice",
        "Bob",
        { name: "Bot Random", bot: { strategyName: "random" } },
      ],
    });
    game = engine.startGame({ game });

    expect(game.players).toHaveLength(3);

    game = playBotTurns(engine, game);

    while (isGameWithNextAction(game)) {
      expect(isBotTurn(game)).toBe(false);
      game = playHumanTurn(engine, game);
      game = playBotTurns(engine, game);
    }

    const results = engine.getResults({ game });
    expect(results.result).toHaveLength(3);
  });

  test("all bots: 4 bots complete a full game automatically", () => {
    let game: GameState = engine.createGame({
      mode: "Classic",
      seed: "all-bots",
    });
    game = engine.addPlayers({
      game,
      players: [
        { name: "Bot Random", bot: { strategyName: "random" } },
        { name: "Bot Greedy", bot: { strategyName: "greedy" } },
        { name: "Bot Advanced", bot: { strategyName: "advanced" } },
        { name: "Bot Expert", bot: { strategyName: "expert" } },
      ],
    });
    game = engine.startGame({ game });

    // All turns are bot turns, so playBotTurns should complete the entire game
    game = playBotTurns(engine, game);

    expect(isGameWithNextAction(game)).toBe(false);

    const results = engine.getResults({ game });
    expect(results.result).toHaveLength(4);
    for (const r of results.result) {
      expect(r.details.points).toBeGreaterThanOrEqual(0);
    }
  });

  test("solo bot: 1 bot plays alone", () => {
    let game: GameState = engine.createGame({
      mode: "Classic",
      seed: "solo-bot",
    });
    game = engine.addPlayers({
      game,
      players: [{ name: "Solo Bot", bot: { strategyName: "greedy" } }],
    });
    game = engine.startGame({ game });

    game = playBotTurns(engine, game);

    expect(isGameWithNextAction(game)).toBe(false);

    const results = engine.getResults({ game });
    expect(results.result).toHaveLength(1);
    expect(results.result[0]!.details.points).toBeGreaterThanOrEqual(0);
  });

  test("backward compatibility: string-only players still work", () => {
    let game: GameState = engine.createGame({
      mode: "Classic",
      seed: "compat",
    });
    game = engine.addPlayers({
      game,
      players: ["Alice", "Bob"],
    });

    expect(game.players[0]!.bot).toBeUndefined();
    expect(game.players[1]!.bot).toBeUndefined();
  });

  test("serialization preserves bot config", () => {
    let game: GameState = engine.createGame({
      mode: "Classic",
      seed: "serial-bot",
    });
    game = engine.addPlayers({
      game,
      players: ["Human", { name: "Bot", bot: { strategyName: "greedy" } }],
    });
    game = engine.startGame({ game });

    // Serialize mid-game
    const json = serializeGame(game);
    const restored = unwrap(deserializeGame(json));

    // Verify bot config is preserved
    const botPlayer = restored.players.find((p) => p.name === "Bot");
    expect(botPlayer?.bot).toEqual({ strategyName: "greedy" });

    const humanPlayer = restored.players.find((p) => p.name === "Human");
    expect(humanPlayer?.bot).toBeUndefined();

    // Continue playing from restored state
    let current: GameState = restored;
    current = playBotTurns(engine, current);

    while (isGameWithNextAction(current)) {
      current = playHumanTurn(engine, current as GameWithNextAction);
      current = playBotTurns(engine, current);
    }

    const results = engine.getResults({ game: current });
    expect(results.result).toHaveLength(2);
  });

  test("custom strategy via playBotTurns", () => {
    const pickedDominoes: number[] = [];
    const customStrategy: BotStrategy = {
      chooseDomino: (ctx) => {
        // Always pick the last available domino
        const available = ctx.availableDominoes;
        const pick = available[available.length - 1]!.domino.number;
        pickedDominoes.push(pick);
        return pick;
      },
      choosePlacement: (ctx) => {
        return ctx.validPlacements.length > 0 ? ctx.validPlacements[0]! : null;
      },
    };

    let game: GameState = engine.createGame({
      mode: "Classic",
      seed: "custom-strat",
    });
    game = engine.addPlayers({
      game,
      players: [{ name: "Custom Bot", bot: { strategyName: "my-custom" } }],
    });
    game = engine.startGame({ game });

    game = playBotTurns(engine, game, { "my-custom": customStrategy });

    expect(isGameWithNextAction(game)).toBe(false);
    expect(pickedDominoes.length).toBe(12);

    const results = engine.getResults({ game });
    expect(results.result).toHaveLength(1);
  });
});
