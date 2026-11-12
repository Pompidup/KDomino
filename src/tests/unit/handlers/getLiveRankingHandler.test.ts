import { winstonLogger } from "@adapter/winstonLogger.js";
import { getLiveRankingHandler } from "@application/handlers/getLiveRankingHandler.js";
import { ErrorCode, NotFoundError } from "@core/domain/errors/domainErrors.js";
import type { FinalResult, NextStep } from "@core/domain/types/game.js";
import { defaultTranslator } from "@core/i18n/translations.js";
import { getLiveRankingUseCase } from "@core/useCases/getLiveRanking.js";
import { getResultUseCase } from "@core/useCases/getResult.js";
import { err, ok, unwrap } from "@utils/result.js";
import { describe, expect, test } from "vitest";
import { createGameBuilder } from "../../builder/game.js";

describe("getLiveRankingHandler", () => {
  const logger = winstonLogger(false);
  const game = createGameBuilder<NextStep>()
    .withDefaultPlayers()
    .withNextAction({ type: "step", step: "result" })
    .build();

  test("should throw a NotFoundError when the use case fails", () => {
    const handler = getLiveRankingHandler(logger, defaultTranslator, () =>
      err(ErrorCode.PLAYER_NOT_FOUND),
    );

    const act = () => handler({ game });

    expect(act).toThrowError(NotFoundError);
    expect(act).toThrowError("Player not found");
  });

  test("should return the use case value", () => {
    const ranking: FinalResult[] = [];
    const handler = getLiveRankingHandler(logger, defaultTranslator, () =>
      ok(ranking),
    );

    expect(handler({ game })).toBe(ranking);
  });

  test("the use case ranks a finished game like getResults", () => {
    const handler = getLiveRankingHandler(
      logger,
      defaultTranslator,
      getLiveRankingUseCase,
    );

    expect(handler({ game })).toEqual(unwrap(getResultUseCase(game)).result);
  });
});
