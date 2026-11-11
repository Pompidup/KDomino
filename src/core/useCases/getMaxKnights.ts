import { getMaxKnights } from "@core/domain/entities/economy.js";
import { ErrorCode } from "@core/domain/errors/domainErrors.js";
import type { Game } from "@core/domain/types/game.js";
import { err, ok, type Result } from "@utils/result.js";

export type GetMaxKnightsUseCase = (
  game: Game,
  playerId: string,
) => Result<number>;

/**
 * Knight limit of one player (Queendomino, Age of Giants + Queendomino): the
 * starting knight plus the knights granted by building bonuses
 * (`player.bonusKnights`). It is the number of knights the player owns,
 * placed or not; `placeKnight` refuses a knight once `player.knights` reaches
 * it. 0 in the modes without knights.
 */
export const getMaxKnightsUseCase: GetMaxKnightsUseCase = (game, playerId) => {
  const player = game.players.find((p) => p.id === playerId);
  if (!player) {
    return err(ErrorCode.PLAYER_NOT_FOUND);
  }

  return ok(game.queendomino ? getMaxKnights(player) : 0);
};
