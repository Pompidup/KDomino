import {
  checkCastleIsInMiddle,
  countDominoes,
} from "@core/domain/entities/kingdom.js";
import { calculateTribeCavemanScore } from "@core/domain/entities/caveman.js";
import {
  isOriginsMode,
  isTotemMode,
  isTribeMode,
} from "@core/domain/entities/originsHelpers.js";
import { calculateOriginsFireBonus } from "@core/domain/entities/originsScore.js";
import { calculateTotemScore } from "@core/domain/entities/totem.js";
import type {
  FinalResult,
  GameWithNextStep,
  GameWithResults,
  ScoreResult,
} from "@core/domain/types/index.js";
import { err, ok, type Result } from "@utils/result.js";

export type GetResultUseCase = (
  game: GameWithNextStep,
  scoreResult: ScoreResult[]
) => Result<GameWithResults>;

export const getResultUseCase: GetResultUseCase = (game, scoreResult) => {
  const { rules } = game;
  const { basic, extra } = rules;

  const finalScoreResult = scoreResult.map((score): ScoreResult => {
    let finalScore = score.details.points;

    const player = game.players.find((p) => p.id === score.playerId);
    if (!player) {
      return score;
    }

    const { kingdom } = player;

    // Origins fire token scoring bonus
    if (isOriginsMode(game.mode.name) && player.fireTokens && player.fireTokens.length > 0) {
      finalScore += calculateOriginsFireBonus(kingdom, player.fireTokens);
    }

    // Totem mode: resource points + totem bonuses
    if (isTotemMode(game.mode.name) && game.origins?.totems) {
      finalScore += calculateTotemScore(player, game.origins.totems);
    }

    // Tribe mode: caveman bonuses (no resource points, no totems)
    if (isTribeMode(game.mode.name) && player.cavemen && player.cavemen.length > 0) {
      finalScore += calculateTribeCavemanScore(
        player.cavemen,
        kingdom,
        player.resources ?? [],
        player.fireTokens ?? [],
      );
    }

    if (extra.length > 0) {
      extra.forEach((extraRule) => {
        // Castle in middle: "The middle Kingdom" (Classic/QD) or "Empire of Fire" (Origins)
        if (
          extraRule.name === "The middle Kingdom" ||
          extraRule.name === "Empire of Fire"
        ) {
          const castleIsInMiddle = checkCastleIsInMiddle(kingdom);
          if (castleIsInMiddle) {
            finalScore += 10;
          }
        }

        // Complete kingdom: "Harmony" (Classic/QD) or "Homo Habilis" (Origins)
        if (extraRule.name === "Harmony" || extraRule.name === "Homo Habilis") {
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

  // Order players by score, then by maxPropertiesSize (per official rules, no further tiebreaker)
  finalScoreResult.sort((a, b) => {
    if (a.details.points !== b.details.points) {
      return b.details.points - a.details.points;
    }
    return b.details.maxPropertiesSize - a.details.maxPropertiesSize;
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
        previousScore.details.maxPropertiesSize
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
