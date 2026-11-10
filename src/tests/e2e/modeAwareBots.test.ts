/**
 * Mode-aware bots (issue #16): complete games played by bots only in every
 * extension mode, the extension actions they really play, their choices
 * against the mode-aware score, determinism and backward compatibility of
 * custom strategies.
 */
import { computePlayerScore } from "@core/domain/entities/scoreBreakdown.js";
import {
  type GameState,
  type GameWithNextAction,
  isGameWithNextAction,
} from "@core/domain/types/game.js";
import type { Position } from "@core/domain/types/kingdom.js";
import {
  type BotStrategy,
  greedyStrategy,
  playBotTurn,
  playBotTurns,
} from "@core/useCases/bot.js";
import {
  fireTokenContext,
  giantPositionContext,
} from "@core/useCases/botExtensions.js";
import { placeFireTokenUseCase } from "@core/useCases/placeFireToken.js";
import { placeGiantUseCase } from "@core/useCases/placeGiant.js";
import { isOk } from "@utils/result.js";
import { describe, expect, test } from "vitest";
import { createGameEngine } from "../../index.js";
import {
  type Counts,
  counterUuid,
  countingEngine,
  legacyStrategy,
  MODES,
  startGame,
} from "./botGameHelpers.js";

describe("Mode-aware bots", () => {
  describe.each(MODES)("%s", (mode) => {
    test("bot decisions are deterministic for a given seed", () => {
      const play = () => {
        const engine = createGameEngine({ uuidMethod: counterUuid() });
        const game = startGame(engine, mode, `determinism-${mode}`, [
          { name: "Random", bot: { strategyName: "random" } },
          { name: "Greedy", bot: { strategyName: "greedy" } },
        ]);
        return playBotTurns(engine, game);
      };
      expect(play()).toEqual(play());
    });
  });

  test("greedy covers the crown that costs it the least and places fire tokens where they score the most", {
    timeout: 60_000,
  }, () => {
    let giantDecisions = 0;
    let sentGiantDecisions = 0;
    let fireDecisions = 0;
    const scoreOf = (state: GameState, playerId: string) => {
      const player = state.players.find((p) => p.id === playerId)!;
      return computePlayerScore(state, player, false).points;
    };

    for (const mode of [
      "AgeOfGiants",
      "AgeOfGiants-QueenDomino",
      "KingdominoOrigins-Discovery",
    ]) {
      const engine = createGameEngine({});
      let game = startGame(engine, mode, `choices-${mode}`, [
        "Alice",
        "Bobby",
        "Carol",
      ]);
      while (isGameWithNextAction(game)) {
        const lordId = game.nextAction.nextLord;
        const action = game.nextAction.nextAction;
        if (action === "placeGiant") {
          const context = giantPositionContext(game, lordId);
          const chosen = greedyStrategy.chooseGiantPosition(context)!;
          const scores = context.validPositions.map((position: Position) => {
            const result = placeGiantUseCase(
              game as GameWithNextAction,
              lordId,
              position,
            );
            return isOk(result) ? scoreOf(result.value, context.playerId) : -1;
          });
          const chosenIndex = context.validPositions.findIndex(
            (p) => p.x === chosen.x && p.y === chosen.y,
          );
          expect(scores[chosenIndex]).toBe(Math.max(...scores));
          giantDecisions++;
          if (context.sentByOpponent) sentGiantDecisions++;
        }
        if (action === "placeFireToken") {
          const context = fireTokenContext(game, lordId);
          const chosen = greedyStrategy.chooseFireTokenPosition(context);
          if (context.validPositions.length > 0) {
            expect(chosen).not.toBeNull();
            const scores = context.validPositions.map((position) => {
              const result = placeFireTokenUseCase(
                game as GameWithNextAction,
                lordId,
                position,
              );
              return isOk(result)
                ? scoreOf(result.value, context.playerId)
                : -1;
            });
            const chosenIndex = context.validPositions.findIndex(
              (p) => p.x === chosen!.x && p.y === chosen!.y,
            );
            expect(scores[chosenIndex]).toBe(Math.max(...scores));
            fireDecisions++;
          }
        }
        game = playBotTurn(engine, game, greedyStrategy);
      }
    }

    expect(giantDecisions).toBeGreaterThan(0);
    expect(sentGiantDecisions).toBeGreaterThan(0);
    expect(fireDecisions).toBeGreaterThan(0);
  });

  test("a custom strategy without extension methods still plays (greedy extension choices)", () => {
    const custom: BotStrategy = {
      chooseDomino: (ctx) => ctx.availableDominoes[0]!.domino.number,
      choosePlacement: (ctx) => ctx.validPlacements[0] ?? null,
    };
    const counts: Counts = {};
    const engine = countingEngine(counts);
    let game = startGame(engine, "QueenDomino", "custom-default", [
      { name: "Custom", bot: { strategyName: "custom" } },
      { name: "Other", bot: { strategyName: "custom" } },
    ]);
    game = playBotTurns(engine, game, { custom });
    expect(isGameWithNextAction(game)).toBe(false);
    expect(counts.Custom?.constructBuilding ?? 0).toBeGreaterThan(0);
  });

  test("extension methods returning null skip every optional action", () => {
    const passive: BotStrategy = { ...legacyStrategy };
    const counts: Counts = {};
    const engine = countingEngine(counts);
    let game = startGame(engine, "AgeOfGiants-QueenDomino", "passive", [
      { name: "Passive", bot: { strategyName: "passive" } },
      { name: "Passive2", bot: { strategyName: "passive" } },
    ]);
    game = playBotTurns(engine, game, { passive });
    expect(isGameWithNextAction(game)).toBe(false);
    for (const name of ["Passive", "Passive2"]) {
      const played = counts[name] ?? {};
      // Only the mandatory placeGiant is played
      expect(Object.keys(played).filter((m) => m !== "placeGiant")).toEqual([]);
    }
  });

  test("the seeded random strategy is reproducible", () => {
    const play = (seed: string) => {
      const engine = createGameEngine({ uuidMethod: counterUuid() });
      const game = startGame(engine, "Classic", seed, [
        { name: "Random1", bot: { strategyName: "random" } },
        { name: "Random2", bot: { strategyName: "random" } },
      ]);
      return playBotTurns(engine, game);
    };
    expect(play("random-a")).toEqual(play("random-a"));

    // Every random decision comes from the seed, not from Math.random
    const original = Math.random;
    Math.random = () => {
      throw new Error("Math.random must not be used by the bots");
    };
    try {
      expect(play("random-b")).toEqual(play("random-b"));
    } finally {
      Math.random = original;
    }
  });
});
