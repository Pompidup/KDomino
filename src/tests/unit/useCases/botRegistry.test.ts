import { describe, expect, test } from "vitest";
import {
  getStrategy,
  getStrategyNames,
} from "@core/useCases/botRegistry.js";
import {
  randomStrategy,
  greedyStrategy,
  advancedStrategy,
  expertStrategy,
  type BotStrategy,
} from "@core/useCases/bot.js";

describe("Bot Registry", () => {
  test("should return all built-in strategy names", () => {
    const names = getStrategyNames();
    expect(names).toEqual(["random", "greedy", "advanced", "expert"]);
  });

  test("should resolve built-in strategies by name", () => {
    expect(getStrategy("random")).toBe(randomStrategy);
    expect(getStrategy("greedy")).toBe(greedyStrategy);
    expect(getStrategy("advanced")).toBe(advancedStrategy);
    expect(getStrategy("expert")).toBe(expertStrategy);
  });

  test("should return undefined for unknown strategy name", () => {
    expect(getStrategy("nonexistent")).toBeUndefined();
  });

  test("should prefer custom strategy over default", () => {
    const customGreedy: BotStrategy = {
      chooseDomino: () => 1,
      choosePlacement: () => null,
    };

    const result = getStrategy("greedy", { greedy: customGreedy });
    expect(result).toBe(customGreedy);
    expect(result).not.toBe(greedyStrategy);
  });

  test("should fall back to default if custom map does not have the name", () => {
    const result = getStrategy("random", { greedy: greedyStrategy });
    expect(result).toBe(randomStrategy);
  });
});
