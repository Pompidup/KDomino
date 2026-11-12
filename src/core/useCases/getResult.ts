import { rankPlayers } from "@core/domain/entities/ranking.js";
import type {
  GameWithNextStep,
  GameWithResults,
} from "@core/domain/types/index.js";
import { ok, type Result } from "@utils/result.js";

export { rankScoreResults } from "@core/domain/entities/ranking.js";

export type GetResultUseCase = (
  game: GameWithNextStep,
) => Result<GameWithResults>;

/**
 * Final results: every player is scored with the mode-aware score breakdown
 * (the same computation as `calculatePlayerScore`), then ranked by the
 * ranking shared with `getLiveRanking` (`rankPlayers`).
 */
export const getResultUseCase: GetResultUseCase = (game) =>
  ok({ ...game, result: rankPlayers(game, true) });
