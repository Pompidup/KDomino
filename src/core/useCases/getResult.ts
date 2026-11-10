import { computePlayerScore } from "@core/domain/entities/scoreBreakdown.js";
import type {
  FinalResult,
  GameWithNextStep,
  GameWithResults,
  ScoreResult,
} from "@core/domain/types/index.js";
import { ok, type Result } from "@utils/result.js";

export type GetResultUseCase = (
  game: GameWithNextStep,
) => Result<GameWithResults>;

/**
 * Ranks scored players: by points, then by largest territory (per official
 * rules, no further tiebreaker). Players equal on both share the position.
 */
export const rankScoreResults = (scoreResult: ScoreResult[]): FinalResult[] => {
  const sorted = [...scoreResult].sort((a, b) => {
    if (a.details.points !== b.details.points) {
      return b.details.points - a.details.points;
    }
    return b.details.maxPropertiesSize - a.details.maxPropertiesSize;
  });

  const result: FinalResult[] = [];
  if (sorted.length === 0) return result;

  result.push({ ...sorted[0]!, position: 1 });

  for (let i = 1; i < sorted.length; i++) {
    const currentScore = sorted[i]!;
    const previousScore = sorted[i - 1]!;
    const isTie =
      currentScore.details.points === previousScore.details.points &&
      currentScore.details.maxPropertiesSize ===
        previousScore.details.maxPropertiesSize;

    result.push({
      ...currentScore,
      position: isTie ? result[i - 1]!.position : i + 1,
    });
  }

  return result;
};

/**
 * Final results: every player is scored with the mode-aware score breakdown
 * (the same computation as `calculatePlayerScore`), then ranked.
 */
export const getResultUseCase: GetResultUseCase = (game) => {
  const scoreResult = game.players.map((player): ScoreResult => {
    const score = computePlayerScore(game, player, true);
    return {
      playerId: score.playerId,
      playerName: score.playerName,
      details: {
        points: score.points,
        maxPropertiesSize: score.maxPropertiesSize,
        totalCrowns: score.totalCrowns,
      },
      breakdown: score.breakdown,
    };
  });

  return ok({
    ...game,
    result: rankScoreResults(scoreResult),
  });
};
