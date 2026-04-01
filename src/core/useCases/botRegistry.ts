import type { BotStrategy } from "./bot.js";
import {
  randomStrategy,
  greedyStrategy,
  advancedStrategy,
  expertStrategy,
} from "./bot.js";

/**
 * Built-in strategy names.
 */
export type StrategyName = "random" | "greedy" | "advanced" | "expert";

const defaultStrategies: Record<string, BotStrategy> = {
  random: randomStrategy,
  greedy: greedyStrategy,
  advanced: advancedStrategy,
  expert: expertStrategy,
};

/**
 * Resolves a strategy by name. Checks custom strategies first, then defaults.
 * Returns undefined if the name is not found.
 */
export const getStrategy = (
  name: string,
  custom?: Record<string, BotStrategy>
): BotStrategy | undefined => {
  return custom?.[name] ?? defaultStrategies[name];
};

/**
 * Returns the list of built-in strategy names.
 */
export const getStrategyNames = (): string[] => Object.keys(defaultStrategies);
