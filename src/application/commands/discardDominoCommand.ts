import type { GameState } from "@core/domain/types/game.js";

export type DiscardDominoCommand = {
  game: GameState;
  lordId: string;
};
