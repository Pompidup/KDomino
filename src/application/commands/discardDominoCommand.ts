import type { GameWithNextAction } from "@core/domain/types/game.js";

export type DiscardDominoCommand = {
  game: GameWithNextAction;
  lordId: string;
};
