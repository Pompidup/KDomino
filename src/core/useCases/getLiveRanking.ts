import { rankPlayers } from "@core/domain/entities/ranking.js";
import type { FinalResult, Game } from "@core/domain/types/game.js";
import { ok, type Result } from "@utils/result.js";

export type GetLiveRankingUseCase = (game: Game) => Result<FinalResult[]>;

/**
 * Ranking of the players at any stage of the game: the ranking `getResults`
 * would give if the game ended now. Same ranking code as `getResults`
 * (`rankPlayers`), on the live scores of `calculatePlayerScore` (provisional
 * bonuses included) during the game and on the final scores once it is over.
 */
export const getLiveRankingUseCase: GetLiveRankingUseCase = (game) =>
  ok(rankPlayers(game));
