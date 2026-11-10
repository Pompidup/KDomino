import { winstonLogger } from "@adapter/winstonLogger.js";
import { calculatePlayerScoreHandler } from "@application/handlers/calculatePlayerScoreHandler.js";
import { ErrorCode, NotFoundError } from "@core/domain/errors/domainErrors.js";
import type { NextStep } from "@core/domain/types/game.js";
import type { PlayerScore } from "@core/domain/types/score.js";
import { defaultTranslator } from "@core/i18n/translations.js";
import { calculatePlayerScoreUseCase } from "@core/useCases/calculatePlayerScore.js";
import { err, ok } from "@utils/result.js";
import { describe, expect, test } from "vitest";
import { createGameBuilder } from "../../builder/game.js";

describe("calculatePlayerScoreHandler", () => {
  const logger = winstonLogger(false);
  const game = createGameBuilder<NextStep>()
    .withDefaultPlayers()
    .withNextAction({ type: "step", step: "result" })
    .build();

  test("should throw a NotFoundError when the use case fails", () => {
    const handler = calculatePlayerScoreHandler(logger, defaultTranslator, () =>
      err(ErrorCode.PLAYER_NOT_FOUND),
    );

    const act = () => handler({ game, playerId: "unknown" });

    expect(act).toThrowError(NotFoundError);
    expect(act).toThrowError("Player not found");
  });

  test("should return the use case value", () => {
    const score: PlayerScore = {
      playerId: "p1",
      playerName: "Alice",
      points: 0,
      maxPropertiesSize: 0,
      totalCrowns: 0,
      final: true,
      breakdown: {
        territories: [],
        bonuses: [],
        territoryPoints: 0,
        bonusPoints: 0,
        total: 0,
      },
    };
    const handler = calculatePlayerScoreHandler(logger, defaultTranslator, () =>
      ok(score),
    );

    expect(handler({ game, playerId: "p1" })).toBe(score);
  });

  test("the use case scores a finished game as final", () => {
    const player = game.players[0]!;
    const handler = calculatePlayerScoreHandler(
      logger,
      defaultTranslator,
      calculatePlayerScoreUseCase,
    );

    expect(handler({ game, playerId: player.id })).toMatchObject({
      playerId: player.id,
      playerName: player.name,
      final: true,
    });
  });
});
