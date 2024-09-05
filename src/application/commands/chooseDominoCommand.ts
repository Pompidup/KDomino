import type { GameWithNextAction } from "@core/domain/types/game.js";

export type ChooseDominoCommand = {
  game: GameWithNextAction;
  dominoPick: number;
  lordId: string;
};
