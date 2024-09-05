import type { GameState } from "@core/domain/types/game.js";

export type AddPlayersCommand = {
  game: GameState;
  players: string[];
};
