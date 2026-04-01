import type { GameMode } from "./mode.js";

/**
 * Basic rules that vary based on player count.
 */
export type BasicRules = {
  /** Number of lords per player */
  lords: number;
  /** Maximum number of dominoes in the game */
  maxDominoes: number;
  /** Number of dominoes revealed each turn */
  dominoesPerTurn: number;
  /** Maximum number of turns in the game */
  maxTurns: number;
  /** Maximum kingdom grid size (5 for standard, 7 for Mighty Duel) */
  maxKingdomSize: number;
};

/**
 * Optional extra rules that modify gameplay and scoring.
 */
export type ExtraRule = {
  /** Name of the rule (e.g., "The middle Kingdom", "Harmony") */
  name: string;
  /** Description of what the rule does */
  description: string;
  /** Game modes this rule is compatible with */
  mode: GameMode[];
  /** Maximum number of players for this rule (optional) */
  playersLimit?: number;
};

/**
 * Complete rules configuration loaded from data source.
 */
export type Rules = {
  /** Basic rules indexed by player count (1-4) */
  basic: Record<number, BasicRules>;
  /** Available extra rules */
  extraRules: ExtraRule[];
};

/**
 * Rules selected for a specific game instance.
 */
export type SelectedRules = {
  /** The basic rules for the current player count */
  basic: BasicRules;
  /** Extra rules enabled for this game */
  extra: ExtraRule[];
};
