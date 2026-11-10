import type { Game } from "@core/domain/types/game.js";

export type CalculatePlayerScoreCommand = {
  /**
   * Game state, at any stage: in progress (live score) or over (final
   * score, also accepts the state returned by `getResults`).
   */
  game: Game;
  /** Id of the player to score */
  playerId: string;
};
