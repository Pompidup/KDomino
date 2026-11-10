/**
 * Strength of the mode-aware bots (issue #16): in every extension mode, on a
 * set of seeds and both seat orders, the greedy and advanced bots score more
 * on average than the former bot behaviour (territory score only, every
 * optional action skipped, giant on the first free crown).
 */
import { advancedStrategy, greedyStrategy } from "@core/useCases/bot.js";
import { describe, expect, test } from "vitest";
import { legacyStrategy, MODES, playHeadToHead } from "./botGameHelpers.js";

describe("Mode-aware bots strength", () => {
  describe.each(MODES)("%s", (mode) => {
    test("greedy and advanced beat the former bot behaviour on average", {
      timeout: 60_000,
    }, () => {
      const seeds = ["strength-1", "strength-2", "strength-3"];
      for (const strategy of [greedyStrategy, advancedStrategy]) {
        let smart = 0;
        let legacy = 0;
        for (const seed of seeds) {
          // Both seat orders, so that the turn order does not favour a side
          for (const [first, second] of [
            ["Smart", "Legacy"],
            ["Legacy", "Smart"],
          ] as const) {
            const points = playHeadToHead(mode, seed, [
              [first, first === "Smart" ? strategy : legacyStrategy],
              [second, second === "Smart" ? strategy : legacyStrategy],
            ]);
            smart += points.Smart!;
            legacy += points.Legacy!;
          }
        }
        expect(smart).toBeGreaterThan(legacy);
      }
    });
  });
});
