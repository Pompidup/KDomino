import type { GameState } from "@core/domain/types/game.js";

export type ChooseDominoCommand = {
  game: GameState;
  dominoPick: number;
  lordId: string;
};
