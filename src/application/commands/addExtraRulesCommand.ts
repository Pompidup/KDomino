import type { Game, NextStep } from "../../core/domain/types/game.js";

export type AddExtraRulesCommand = {
  game: Game & { nextAction: NextStep };
  extraRules: string[];
};
