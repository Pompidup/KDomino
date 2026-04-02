import {
  type GameState,
  type GameWithNextAction,
  isGameWithNextAction,
} from "@core/domain/types/game.js";
import type { GameEngine } from "@core/portUserside/engine.js";
import {
  advancedStrategy,
  type BotStrategy,
  expertStrategy,
  greedyStrategy,
  playBotTurn,
  randomStrategy,
} from "@core/useCases/bot.js";
import { describe, expect, test } from "vitest";
import { createGameEngine } from "../../index.js";

const playFullGame = (
  engine: GameEngine,
  strategy: BotStrategy,
  seed?: string,
): { scores: number[] } => {
  let game: GameState = engine.createGame({ mode: "Classic", seed });
  game = engine.addPlayers({ game, players: ["Alice", "Bob"] });
  game = engine.startGame({ game });

  while (isGameWithNextAction(game)) {
    game = playBotTurn(engine, game as GameWithNextAction, strategy);
  }

  const results = engine.getResults({ game });
  const scores = results.result.map((r) => r.details.points);
  return { scores };
};

describe("Bot e2e", () => {
  const engine = createGameEngine({});

  test("randomStrategy completes a full game", () => {
    const { scores } = playFullGame(engine, randomStrategy);
    expect(scores).toHaveLength(2);
    for (const score of scores) {
      expect(score).toBeGreaterThanOrEqual(0);
    }
  });

  test("greedyStrategy completes a full game", () => {
    const { scores } = playFullGame(engine, greedyStrategy);
    expect(scores).toHaveLength(2);
    for (const score of scores) {
      expect(score).toBeGreaterThanOrEqual(0);
    }
  });

  test("advancedStrategy completes a full game", () => {
    const { scores } = playFullGame(engine, advancedStrategy);
    expect(scores).toHaveLength(2);
    for (const score of scores) {
      expect(score).toBeGreaterThanOrEqual(0);
    }
  });

  test("expertStrategy completes a full game", () => {
    const { scores } = playFullGame(engine, expertStrategy);
    expect(scores).toHaveLength(2);
    for (const score of scores) {
      expect(score).toBeGreaterThanOrEqual(0);
    }
  }, 30_000);

  test("with fixed seed, greedy scores >= random", () => {
    const seed = "test-seed-compare";
    const deterministicEngine = createGameEngine({
      shuffleMethod: (array) => array,
    });

    const randomResult = playFullGame(
      deterministicEngine,
      randomStrategy,
      seed,
    );
    const greedyResult = playFullGame(
      deterministicEngine,
      greedyStrategy,
      seed,
    );

    const randomTotal = randomResult.scores.reduce((a, b) => a + b, 0);
    const greedyTotal = greedyResult.scores.reduce((a, b) => a + b, 0);

    expect(greedyTotal).toBeGreaterThanOrEqual(randomTotal);
  });

  test("with fixed seed, advanced scores >= greedy", () => {
    const seed = "test-seed-compare";
    const deterministicEngine = createGameEngine({
      shuffleMethod: (array) => array,
    });

    const greedyResult = playFullGame(
      deterministicEngine,
      greedyStrategy,
      seed,
    );
    const advancedResult = playFullGame(
      deterministicEngine,
      advancedStrategy,
      seed,
    );

    const greedyTotal = greedyResult.scores.reduce((a, b) => a + b, 0);
    const advancedTotal = advancedResult.scores.reduce((a, b) => a + b, 0);

    expect(advancedTotal).toBeGreaterThanOrEqual(greedyTotal);
  });

  test("with fixed seed, expert scores >= greedy", () => {
    const seed = "test-seed-compare";
    const deterministicEngine = createGameEngine({
      shuffleMethod: (array) => array,
    });

    const greedyResult = playFullGame(
      deterministicEngine,
      greedyStrategy,
      seed,
    );
    const expertResult = playFullGame(
      deterministicEngine,
      expertStrategy,
      seed,
    );

    const greedyTotal = greedyResult.scores.reduce((a, b) => a + b, 0);
    const expertTotal = expertResult.scores.reduce((a, b) => a + b, 0);

    expect(expertTotal).toBeGreaterThanOrEqual(greedyTotal);
  }, 30_000);
});
