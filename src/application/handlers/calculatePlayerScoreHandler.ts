import type { CalculatePlayerScoreCommand } from "@application/commands/calculatePlayerScoreCommand.js";
import {
  type ErrorCodeType,
  NotFoundError,
} from "@core/domain/errors/domainErrors.js";
import type { PlayerScore } from "@core/domain/types/score.js";
import type { Translator } from "@core/i18n/translations.js";
import { translateErrorCode } from "@core/i18n/translations.js";
import type { Logger } from "@core/portServerside/logger.js";
import type { CalculatePlayerScoreUseCase } from "@core/useCases/calculatePlayerScore.js";
import { isErr } from "@utils/result.js";

type CalculatePlayerScoreHandler = (
  command: CalculatePlayerScoreCommand,
) => PlayerScore;

export const calculatePlayerScoreHandler =
  (
    logger: Logger,
    translator: Translator,
    useCase: CalculatePlayerScoreUseCase,
  ): CalculatePlayerScoreHandler =>
  (command) => {
    const { game, playerId } = command;
    logger.info(`Calculating score of player ${playerId} in game: ${game.id}`);

    const result = useCase(game, playerId);

    if (isErr(result)) {
      logger.error(`Error calculating player score: ${result.error}`);
      const code = result.error as ErrorCodeType;
      throw new NotFoundError(translateErrorCode(translator, code), code, {
        gameId: game.id,
        playerId,
      });
    }

    logger.info(
      `Player score calculated: ${result.value.points} (${result.value.final ? "final" : "live"})`,
    );
    return result.value;
  };
