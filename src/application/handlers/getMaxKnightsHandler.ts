import type { GetMaxKnightsCommand } from "@application/commands/getMaxKnightsCommand.js";
import {
  type ErrorCodeType,
  NotFoundError,
} from "@core/domain/errors/domainErrors.js";
import type { Translator } from "@core/i18n/translations.js";
import { translateErrorCode } from "@core/i18n/translations.js";
import type { Logger } from "@core/portServerside/logger.js";
import type { GetMaxKnightsUseCase } from "@core/useCases/getMaxKnights.js";
import { isErr } from "@utils/result.js";

type GetMaxKnightsHandler = (command: GetMaxKnightsCommand) => number;

export const getMaxKnightsHandler =
  (
    logger: Logger,
    translator: Translator,
    useCase: GetMaxKnightsUseCase,
  ): GetMaxKnightsHandler =>
  (command) => {
    const { game, playerId } = command;
    logger.info(`getMaxKnights for player ${playerId} in game: ${game.id}`);

    const result = useCase(game, playerId);

    if (isErr(result)) {
      logger.error(`Error reading the knight limit: ${result.error}`);
      const code = result.error as ErrorCodeType;
      throw new NotFoundError(translateErrorCode(translator, code), code, {
        gameId: game.id,
        playerId,
      });
    }

    logger.info(`getMaxKnights: ${result.value} knights`);
    return result.value;
  };
