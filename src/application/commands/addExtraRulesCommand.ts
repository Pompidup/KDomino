import type { GameState } from "@core/domain/types/game.js";

export type AddExtraRulesCommand = {
  game: GameState;
  extraRules: string[];
};
