import type { GetResultCommand } from "@application/commands/getResultCommand.js";
import {
  ErrorCode,
  type ErrorCodeType,
  InvalidStepError,
  NotFoundError,
} from "@core/domain/errors/domainErrors.js";
import {
  type GameWithResults,
  isGameWithNextStep,
} from "@core/domain/types/game.js";
import type { Translator } from "@core/i18n/translations.js";
import { translateErrorCode } from "@core/i18n/translations.js";
import type { Logger } from "@core/portServerside/logger.js";
import type { GetResultUseCase } from "@core/useCases/getResult.js";
import { isErr } from "@utils/result.js";

type GetResultHandler = (command: GetResultCommand) => GameWithResults;

export const getResultHandler =
  (
    logger: Logger,
    translator: Translator,
    useCases: {
      getResultUseCase: GetResultUseCase;
    },
  ): GetResultHandler =>
  (command: GetResultCommand) => {
    const { getResultUseCase } = useCases;
    const { game } = command;
    logger.info(`Getting result for game: ${game.id}`);

    if (!isGameWithNextStep(game)) {
      logger.error(
        `Invalid game, required nextAction type: 'step' but got: ${game.nextAction.type}`,
      );
      throw new InvalidStepError(
        translateErrorCode(translator, ErrorCode.INVALID_STEP),
        { expected: "step", actual: game.nextAction.type, gameId: game.id },
      );
    }

    if (game.nextAction.step !== "result") {
      logger.error(
        `Required game with result step but got: ${game.nextAction.step}`,
      );
      throw new InvalidStepError(
        translateErrorCode(translator, ErrorCode.INVALID_STEP),
        { expected: "result", actual: game.nextAction.step, gameId: game.id },
      );
    }

    // Every player is scored by the mode-aware score breakdown (same
    // computation as calculatePlayerScore), then ranked.
    const result = getResultUseCase(game);

    if (isErr(result)) {
      logger.error(`Error getting result: ${result.error}`);
      const code = result.error as ErrorCodeType;
      throw new NotFoundError(translateErrorCode(translator, code), code, {
        gameId: game.id,
      });
    }

    logger.info(`Result retrieved for game: ${game.id}`);
    return result.value;
  };
