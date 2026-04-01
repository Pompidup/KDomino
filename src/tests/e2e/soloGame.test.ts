import { createGameEngine } from "../../index.js";
import {
  isGameWithNextAction,
  isGameWithNextStep,
  type GameState,
  type GameWithNextAction,
  type GameWithNextStep,
} from "@core/domain/types/game.js";
import {
  randomStrategy,
  greedyStrategy,
  advancedStrategy,
  expertStrategy,
  playBotTurn,
  type BotStrategy,
} from "@core/useCases/bot.js";
import type { GameEngine } from "@core/portUserside/engine.js";
import { describe, expect, test } from "vitest";

describe("Solo Game", () => {
  const engine = createGameEngine({});

  test("should add 1 player with solo rules", () => {
    let game: GameState = engine.createGame({ mode: "Classic" });
    game = engine.addPlayers({ game, players: ["Solo Player"] });

    expect(game.players).toHaveLength(1);
    expect(game.players[0]!.name).toBe("Solo Player");
    expect(game.rules.basic).toEqual({
      lords: 1,
      maxDominoes: 48,
      dominoesPerTurn: 4,
      maxTurns: 12,
      maxKingdomSize: 5,
    });
    expect(game.dominoes).toHaveLength(48);
  });

  test("should start a solo game with 1 lord and 4 dominoes revealed", () => {
    let game: GameState = engine.createGame({ mode: "Classic" });
    game = engine.addPlayers({ game, players: ["Solo Player"] });
    game = engine.startGame({ game });

    expect(isGameWithNextAction(game)).toBe(true);
    if (!isGameWithNextAction(game)) return;

    expect(game.lords).toHaveLength(1);
    expect(game.lords[0]!.playerId).toBe(game.players[0]!.id);
    expect(game.currentDominoes).toHaveLength(4);
    expect(game.nextAction.nextAction).toBe("pickDomino");
    expect(game.nextAction.nextLord).toBe(game.lords[0]!.id);
  });

  test("should simulate a complete solo game with seed", () => {
    const seededEngine = createGameEngine({});
    let game: GameState = seededEngine.createGame({
      mode: "Classic",
      seed: "solo-test-seed",
    });
    game = seededEngine.addPlayers({ game, players: ["Solo Player"] });
    game = seededEngine.startGame({ game });

    let turnsPlayed = 0;

    while (isGameWithNextAction(game)) {
      const action = game.nextAction;

      if (action.nextAction === "pickDomino") {
        // Pick the first available domino
        const available = game.currentDominoes.find((d) => !d.picked);
        expect(available).toBeDefined();
        game = seededEngine.chooseDomino({
          game,
          lordId: action.nextLord,
          dominoPick: available!.domino.number,
        });
      } else if (action.nextAction === "placeDomino") {
        const lord = game.lords.find((l) => l.id === action.nextLord)!;
        const player = game.players.find((p) => p.id === lord.playerId)!;
        const domino = lord.dominoPicked!;
        const validPlacements = seededEngine.getValidPlacements({
          kingdom: player.kingdom,
          domino,
        });

        if (validPlacements.length > 0) {
          const placement = validPlacements[0]!;
          game = seededEngine.placeDomino({
            game,
            lordId: action.nextLord,
            position: placement.position,
            rotation: placement.rotation,
          });
        } else {
          game = seededEngine.discardDomino({
            game,
            lordId: action.nextLord,
          });
        }
        turnsPlayed++;
      }
    }

    // Solo game should last 12 turns
    expect(turnsPlayed).toBe(12);

    // Should reach result step
    expect(isGameWithNextStep(game)).toBe(true);
    if (!isGameWithNextStep(game)) return;
    expect((game as GameWithNextStep).nextAction.step).toBe("result");

    // Get results
    const gameResult = seededEngine.getResults({ game });
    expect(gameResult.result).toHaveLength(1);
    expect(gameResult.result[0]!.playerName).toBe("Solo Player");
    expect(gameResult.result[0]!.position).toBe(1);
    expect(gameResult.result[0]!.details.points).toBeGreaterThanOrEqual(0);
  });

  test("should produce deterministic results with same seed", () => {
    const playSoloGame = (seed: string) => {
      const eng = createGameEngine({});
      let game: GameState = eng.createGame({ mode: "Classic", seed });
      game = eng.addPlayers({ game, players: ["Solo Player"] });
      game = eng.startGame({ game });

      while (isGameWithNextAction(game)) {
        const action = game.nextAction;
        if (action.nextAction === "pickDomino") {
          const available = game.currentDominoes.find((d) => !d.picked);
          game = eng.chooseDomino({
            game,
            lordId: action.nextLord,
            dominoPick: available!.domino.number,
          });
        } else if (action.nextAction === "placeDomino") {
          const lord = game.lords.find((l) => l.id === action.nextLord)!;
          const player = game.players.find((p) => p.id === lord.playerId)!;
          const domino = lord.dominoPicked!;
          const valid = eng.getValidPlacements({ kingdom: player.kingdom, domino });
          if (valid.length > 0) {
            game = eng.placeDomino({
              game,
              lordId: action.nextLord,
              position: valid[0]!.position,
              rotation: valid[0]!.rotation,
            });
          } else {
            game = eng.discardDomino({ game, lordId: action.nextLord });
          }
        }
      }

      return eng.getResults({ game });
    };

    const result1 = playSoloGame("deterministic-solo");
    const result2 = playSoloGame("deterministic-solo");

    expect(result1.result[0]!.details.points).toBe(
      result2.result[0]!.details.points,
    );
  });
});

describe("Solo Game - Extra Rules", () => {
  const engine = createGameEngine({});

  test("The Mighty Duel should not be available for solo", () => {
    const extraRules = engine.getExtraRules({ mode: "Classic", players: 1 });
    const mightyDuel = extraRules.find((r) => r.name === "The Mighty Duel");
    expect(mightyDuel).toBeUndefined();
  });

  test("The middle Kingdom and Harmony should be available for solo", () => {
    const extraRules = engine.getExtraRules({ mode: "Classic", players: 1 });
    const names = extraRules.map((r) => r.name);
    expect(names).toContain("The middle Kingdom");
    expect(names).toContain("Harmony");
  });

  test("should complete solo game with The middle Kingdom rule", () => {
    let game: GameState = engine.createGame({
      mode: "Classic",
      seed: "solo-middle-kingdom",
    });
    game = engine.addPlayers({ game, players: ["Solo Player"] });
    game = engine.addExtraRules({ game, extraRules: ["The middle Kingdom"] });
    game = engine.startGame({ game });

    while (isGameWithNextAction(game)) {
      const action = game.nextAction;
      if (action.nextAction === "pickDomino") {
        const available = game.currentDominoes.find((d) => !d.picked);
        game = engine.chooseDomino({
          game,
          lordId: action.nextLord,
          dominoPick: available!.domino.number,
        });
      } else if (action.nextAction === "placeDomino") {
        const lord = game.lords.find((l) => l.id === action.nextLord)!;
        const player = game.players.find((p) => p.id === lord.playerId)!;
        const domino = lord.dominoPicked!;
        const valid = engine.getValidPlacements({ kingdom: player.kingdom, domino });
        if (valid.length > 0) {
          game = engine.placeDomino({
            game,
            lordId: action.nextLord,
            position: valid[0]!.position,
            rotation: valid[0]!.rotation,
          });
        } else {
          game = engine.discardDomino({ game, lordId: action.nextLord });
        }
      }
    }

    const gameResult = engine.getResults({ game });
    expect(gameResult.result).toHaveLength(1);
    expect(gameResult.result[0]!.details.points).toBeGreaterThanOrEqual(0);
  });
});

describe("Solo Game - Bot strategies", () => {
  const playSoloBotGame = (
    engine: GameEngine,
    strategy: BotStrategy,
    seed?: string,
  ): { score: number } => {
    let game: GameState = engine.createGame({ mode: "Classic", seed });
    game = engine.addPlayers({ game, players: ["Bot Solo"] });
    game = engine.startGame({ game });

    while (isGameWithNextAction(game)) {
      game = playBotTurn(engine, game as GameWithNextAction, strategy);
    }

    const results = engine.getResults({ game });
    return { score: results.result[0]!.details.points };
  };

  const engine = createGameEngine({});

  test("randomStrategy completes a solo game", () => {
    const { score } = playSoloBotGame(engine, randomStrategy);
    expect(score).toBeGreaterThanOrEqual(0);
  });

  test("greedyStrategy completes a solo game", () => {
    const { score } = playSoloBotGame(engine, greedyStrategy);
    expect(score).toBeGreaterThanOrEqual(0);
  });

  test("advancedStrategy completes a solo game", () => {
    const { score } = playSoloBotGame(engine, advancedStrategy);
    expect(score).toBeGreaterThanOrEqual(0);
  });

  test("expertStrategy completes a solo game", () => {
    const { score } = playSoloBotGame(engine, expertStrategy);
    expect(score).toBeGreaterThanOrEqual(0);
  }, 30_000);

  test("with fixed seed, greedy scores >= random in solo", () => {
    const seed = "solo-bot-compare";
    const deterministicEngine = createGameEngine({
      shuffleMethod: (array) => array,
    });

    const randomResult = playSoloBotGame(deterministicEngine, randomStrategy, seed);
    const greedyResult = playSoloBotGame(deterministicEngine, greedyStrategy, seed);

    expect(greedyResult.score).toBeGreaterThanOrEqual(randomResult.score);
  });
});
