import type { Game } from "@core/domain/types/game.js";

/**
 * Command for `getLiveRanking`: the ranking of the players at any stage of
 * the game.
 */
export type GetLiveRankingCommand = {
  /**
   * Game state, at any stage: not started, in progress (live ranking) or
   * over (final ranking, also accepts the state returned by `getResults`).
   */
  game: Game;
};
