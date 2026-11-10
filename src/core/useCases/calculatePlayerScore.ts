import { computePlayerScore } from "@core/domain/entities/scoreBreakdown.js";
import { ErrorCode } from "@core/domain/errors/domainErrors.js";
import type { Game } from "@core/domain/types/game.js";
import type { PlayerScore } from "@core/domain/types/score.js";
import { err, ok, type Result } from "@utils/result.js";

export type CalculatePlayerScoreUseCase = (
  game: Game,
  playerId: string,
) => Result<PlayerScore>;

/**
 * Mode-aware score of one player, with its breakdown. Live during the game,
 * final (identical to `getResults`) once the game is over.
 */
export const calculatePlayerScoreUseCase: CalculatePlayerScoreUseCase = (
  game,
  playerId,
) => {
  const player = game.players.find((p) => p.id === playerId);
  if (!player) {
    return err(ErrorCode.PLAYER_NOT_FOUND);
  }

  return ok(computePlayerScore(game, player));
};
