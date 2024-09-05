import type { GameState } from "@core/domain/types/game.js";

export type GetResultCommand = {
  game: GameState;
};
