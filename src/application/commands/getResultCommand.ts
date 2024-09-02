import type { GameWithNextStep } from "../../core/domain/types/game.js";

export type GetResultCommand = {
  game: GameWithNextStep;
};
