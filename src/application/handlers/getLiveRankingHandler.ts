import type { GetLiveRankingCommand } from "@application/commands/getLiveRankingCommand.js";
import {
  type ErrorCodeType,
  NotFoundError,
} from "@core/domain/errors/domainErrors.js";
import type { FinalResult } from "@core/domain/types/game.js";
import type { Translator } from "@core/i18n/translations.js";
import { translateErrorCode } from "@core/i18n/translations.js";
import type { Logger } from "@core/portServerside/logger.js";
import type { GetLiveRankingUseCase } from "@core/useCases/getLiveRanking.js";
import { isErr } from "@utils/result.js";

type GetLiveRankingHandler = (command: GetLiveRankingCommand) => FinalResult[];

export const getLiveRankingHandler =
  (
    logger: Logger,
    translator: Translator,
    useCase: GetLiveRankingUseCase,
  ): GetLiveRankingHandler =>
  (command) => {
    const { game } = command;
    logger.info(`Getting live ranking for game: ${game.id}`);

    const result = useCase(game);

    if (isErr(result)) {
      logger.error(`Error getting live ranking: ${result.error}`);
      const code = result.error as ErrorCodeType;
      throw new NotFoundError(translateErrorCode(translator, code), code, {
        gameId: game.id,
      });
    }

    logger.info(`Live ranking retrieved for game: ${game.id}`);
    return result.value;
  };
