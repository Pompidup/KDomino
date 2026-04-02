import type { BotStrategy } from "./bot.js";
import {
  advancedStrategy,
  expertStrategy,
  greedyStrategy,
  randomStrategy,
} from "./bot.js";

/**
 * Built-in strategy names.
 */
export type StrategyName = "random" | "greedy" | "advanced" | "expert";

// Use a getter function to avoid circular dependency issues with bot.ts.
// When biome sorts imports, bot.ts may not be fully initialized when this
// module-level code runs. Deferring access to the strategies ensures they
// are resolved at call time, not at module evaluation time.
const getDefaultStrategies = (): Record<string, BotStrategy> => ({
  random: randomStrategy,
  greedy: greedyStrategy,
  advanced: advancedStrategy,
  expert: expertStrategy,
});

/**
 * Resolves a strategy by name. Checks custom strategies first, then defaults.
 * Returns undefined if the name is not found.
 */
export const getStrategy = (
  name: string,
  custom?: Record<string, BotStrategy>,
): BotStrategy | undefined => {
  return custom?.[name] ?? getDefaultStrategies()[name];
};

/**
 * Returns the list of built-in strategy names.
 */
export const getStrategyNames = (): string[] =>
  Object.keys(getDefaultStrategies());
