/**
 * Mode-aware bots (issue #16): in every extension mode, a complete game played
 * by 4 bots (one per built-in strategy) reaches the result step, and the
 * mode-aware bots really play the extension actions of the mode.
 */
import { isGameWithNextAction } from "@core/domain/types/game.js";
import { playBotTurns } from "@core/useCases/bot.js";
import { describe, expect, test } from "vitest";
import {
  type Counts,
  countingEngine,
  type ExtensionMethod,
  finalPoints,
  MODES,
  type Mode,
  startGame,
} from "./botGameHelpers.js";

/** Actions the mode-aware bots must have played at least once in each mode. */
const EXPECTED_ACTIONS: Record<Mode, ExtensionMethod[]> = {
  QueenDomino: ["placeKnight", "constructBuilding"],
  "KingdominoOrigins-Discovery": ["placeFireToken"],
  "KingdominoOrigins-Totem": ["placeFireToken"],
  "KingdominoOrigins-Tribe": ["recruitCaveman"],
  AgeOfGiants: ["placeGiant", "sendGiant"],
  "AgeOfGiants-QueenDomino": [
    "placeGiant",
    "sendGiant",
    "placeKnight",
    "constructBuilding",
  ],
};

describe("Mode-aware bots games", () => {
  describe.each(MODES)("%s", (mode) => {
    test("4 bots (one per built-in strategy) play a complete game and its extension actions", {
      timeout: 60_000,
    }, () => {
      const counts: Counts = {};
      const engine = countingEngine(counts);
      let game = startGame(engine, mode, `mode-aware-${mode}`, [
        { name: "Random", bot: { strategyName: "random" } },
        { name: "Greedy", bot: { strategyName: "greedy" } },
        { name: "Advanced", bot: { strategyName: "advanced" } },
        { name: "Expert", bot: { strategyName: "expert" } },
      ]);

      game = playBotTurns(engine, game);

      // The game reached its end through bot turns only
      expect(isGameWithNextAction(game)).toBe(false);
      expect(game.nextAction).toEqual({ type: "step", step: "result" });
      const points = finalPoints(engine, game);
      expect(Object.keys(points)).toHaveLength(4);

      // The mode-aware bots really play the extension actions of the mode
      for (const action of EXPECTED_ACTIONS[mode]) {
        const played = ["Greedy", "Advanced", "Expert"].reduce(
          (total, name) => total + (counts[name]?.[action] ?? 0),
          0,
        );
        expect(
          played,
          `${action} played by the mode-aware bots`,
        ).toBeGreaterThan(0);
      }
    });
  });
});
