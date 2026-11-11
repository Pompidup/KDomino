import { winstonLogger } from "@adapter/winstonLogger.js";
import { getMaxKnightsHandler } from "@application/handlers/getMaxKnightsHandler.js";
import { ErrorCode, NotFoundError } from "@core/domain/errors/domainErrors.js";
import type { NextStep } from "@core/domain/types/game.js";
import { defaultTranslator } from "@core/i18n/translations.js";
import { getMaxKnightsUseCase } from "@core/useCases/getMaxKnights.js";
import { err, ok } from "@utils/result.js";
import { describe, expect, test } from "vitest";
import { createGameBuilder } from "../../builder/game.js";

describe("getMaxKnightsHandler", () => {
  const logger = winstonLogger(false);
  const game = createGameBuilder<NextStep>().withDefaultPlayers().build();

  test("should throw a NotFoundError when the use case fails", () => {
    const handler = getMaxKnightsHandler(logger, defaultTranslator, () =>
      err(ErrorCode.PLAYER_NOT_FOUND),
    );

    const act = () => handler({ game, playerId: "unknown" });

    expect(act).toThrowError(NotFoundError);
    expect(act).toThrowError("Player not found");
  });

  test("should return the use case value", () => {
    const handler = getMaxKnightsHandler(logger, defaultTranslator, () =>
      ok(3),
    );

    expect(handler({ game, playerId: "p1" })).toBe(3);
  });

  test("answers 0 outside Queendomino and the limit in Queendomino", () => {
    const handler = getMaxKnightsHandler(
      logger,
      defaultTranslator,
      getMaxKnightsUseCase,
    );
    const player = game.players[0]!;

    expect(handler({ game, playerId: player.id })).toBe(0);

    const queendomino = {
      ...game,
      queendomino: {} as NonNullable<typeof game.queendomino>,
      players: game.players.map((p) =>
        p.id === player.id ? { ...p, bonusKnights: 1 } : p,
      ),
    };
    expect(handler({ game: queendomino, playerId: player.id })).toBe(2);
  });
});
