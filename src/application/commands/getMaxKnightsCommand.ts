import type { Game } from "@core/domain/types/game.js";

/**
 * Command for `getMaxKnights` (Queendomino): the knight limit of one player.
 */
export type GetMaxKnightsCommand = {
  /** Game state, at any stage */
  game: Game;
  /** Id of the player whose knight limit is read */
  playerId: string;
};
