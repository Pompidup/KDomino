import type { GameMode } from "./mode.js";

export type BasicRules = {
  lords: number;
  maxDominoes: number;
  dominoesPerTurn: number;
  maxTurns: number;
};

export type ExtraRule = {
  name: string;
  description: string;
  mode: GameMode[];
  playersLimit?: number;
};

export type Rules = {
  basic: Record<number, BasicRules>;
  extraRules: ExtraRule[];
};

export type SelectedRules = {
  basic: BasicRules;
  extra: ExtraRule[];
};
