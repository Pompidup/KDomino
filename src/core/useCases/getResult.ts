import {
  compareScores,
  firstDifferingCriterion,
  getTiebreakCriteria,
  KINGDOMINO_TIEBREAK_CRITERIA,
} from "@core/domain/entities/ranking.js";
import { computePlayerScore } from "@core/domain/entities/scoreBreakdown.js";
import type {
  FinalResult,
  GameWithNextStep,
  GameWithResults,
  ScoreResult,
  TiebreakCriterion,
} from "@core/domain/types/index.js";
import { ok, type Result } from "@utils/result.js";

export type GetResultUseCase = (
  game: GameWithNextStep,
) => Result<GameWithResults>;

/**
 * Ranks scored players: by points, then by the tie-break criteria of the game
 * mode (`getTiebreakCriteria`; default: Kingdomino, largest territory then
 * crowns). Players equal on points and on every criterion share the
 * position. Each result tells which criterion ranked it among the players
 * with the same points (`tiebreaker`) and whether it shares its position
 * (`tied`).
 */
export const rankScoreResults = (
  scoreResult: ScoreResult[],
  criteria: readonly TiebreakCriterion[] = KINGDOMINO_TIEBREAK_CRITERIA,
): FinalResult[] => {
  const sorted = [...scoreResult].sort((a, b) =>
    compareScores(a.details, b.details, criteria),
  );

  const lastCriterion = criteria.length - 1;
  const result: FinalResult[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i]!;
    const previous = result[i - 1];
    const position =
      previous &&
      compareScores(previous.details, current.details, criteria) === 0
        ? previous.position
        : i + 1;

    // Deepest criterion compared against the players with the same points
    let deepest = -1;
    let tied = false;
    for (const other of sorted) {
      if (
        other === current ||
        other.details.points !== current.details.points
      ) {
        continue;
      }
      const index = firstDifferingCriterion(
        current.details,
        other.details,
        criteria,
      );
      if (index === -1) tied = true;
      deepest = Math.max(deepest, index === -1 ? lastCriterion : index);
    }

    result.push({
      ...current,
      position,
      tiebreaker: criteria[deepest] ?? null,
      tied,
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
        ...(score.fireSymbols !== undefined && {
          fireSymbols: score.fireSymbols,
        }),
      },
      breakdown: score.breakdown,
    };
  });

  return ok({
    ...game,
    result: rankScoreResults(scoreResult, getTiebreakCriteria(game.mode.name)),
  });
};
