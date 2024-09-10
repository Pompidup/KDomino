import {
  checkCastleIsInMiddle,
  countDominoes,
} from "@core/domain/entities/kingdom.js";
import type {
  FinalResult,
  GameWithNextStep,
  GameWithResults,
  ScoreResult,
} from "@core/domain/types/index.js";
import { ok, type Result } from "@utils/result.js";

export type GetResultUseCase = (
  game: GameWithNextStep,
  scoreResult: ScoreResult[]
) => Result<GameWithResults>;

export const getResultUseCase: GetResultUseCase = (game, scoreResult) => {
  const { rules } = game;
  const { basic, extra } = rules;

  const finalScoreResult = scoreResult.map((score): ScoreResult => {
    let finalScore = score.details.points;

    const kingdom = game.players.find((player) => {
      if (player.id === score.playerId) {
        return player;
      }
    })?.kingdom!;

    if (extra.length > 0) {
      extra.forEach((extraRule) => {
        if (extraRule.name === "The middle Kingdom") {
          const castleIsInMiddle = checkCastleIsInMiddle(kingdom);
          if (castleIsInMiddle) {
            finalScore += 10;
          }
        }

        if (extraRule.name === "Harmony") {
          const totalDominoes = countDominoes(kingdom);
          const dominoLimit = basic.maxDominoes;
          const totalPlayers = game.players.length;
          const dominoesPerPlayer = dominoLimit / totalPlayers;
          if (totalDominoes === dominoesPerPlayer) {
            finalScore += 5;
          }
        }
      });
    }

    return {
      ...score,
      details: {
        ...score.details,
        points: finalScore,
      },
    };
  });

  // 1 order players by score, then by maxPropertiesSize, then by totalCrowns all descending
  finalScoreResult.sort((a, b) => {
    if (a.details.points !== b.details.points) {
      return b.details.points - a.details.points;
    }
    if (a.details.maxPropertiesSize !== b.details.maxPropertiesSize) {
      return b.details.maxPropertiesSize - a.details.maxPropertiesSize;
    }
    return b.details.totalCrowns - a.details.totalCrowns;
  });

  const result: FinalResult[] = [];

  let isTie = false;
  result.push({
    playerId: finalScoreResult[0]!.playerId,
    playerName: finalScoreResult[0]!.playerName,
    details: finalScoreResult[0]!.details,
    position: 1,
  });

  for (let i = 1; i < finalScoreResult.length; i++) {
    const currentScore = finalScoreResult[i];
    const previousScore = finalScoreResult[i - 1];
    if (
      previousScore &&
      currentScore &&
      currentScore.details.points === previousScore.details.points &&
      currentScore.details.maxPropertiesSize ===
        previousScore.details.maxPropertiesSize &&
      currentScore.details.totalCrowns === previousScore.details.totalCrowns
    ) {
      isTie = true;
    }

    if (isTie) {
      result.push({
        ...currentScore!,
        position: result[i - 1]!.position,
      });
    } else {
      result.push({
        ...currentScore!,
        position: i + 1,
      });
    }

    isTie = false;
  }

  return ok({
    ...game,
    result: result,
  });
};
