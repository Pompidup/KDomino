import type { GetResultCommand } from "@application/commands/getResultCommand.js";
import {
  ErrorCode,
  type ErrorCodeType,
  InvalidStepError,
  NotFoundError,
  StepExecutionError,
} from "@core/domain/errors/domainErrors.js";
import {
  type GameWithResults,
  isGameWithNextStep,
  type ScoreResult,
} from "@core/domain/types/game.js";
import type { Translator } from "@core/i18n/translations.js";
import { translateErrorCode } from "@core/i18n/translations.js";
import type { Logger } from "@core/portServerside/logger.js";
import type { CalculateScoreUseCase } from "@core/useCases/calculateScore.js";
import type { GetResultUseCase } from "@core/useCases/getResult.js";
import { isErr } from "@utils/result.js";

type GetResultHandler = (command: GetResultCommand) => GameWithResults;

export const getResultHandler =
  (
    logger: Logger,
    translator: Translator,
    useCases: {
      getResultUseCase: GetResultUseCase;
      calculateScoreUseCase: CalculateScoreUseCase;
    },
  ): GetResultHandler =>
  (command: GetResultCommand) => {
    const { getResultUseCase, calculateScoreUseCase } = useCases;
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

    const { players } = game;

    const scoreResult: ScoreResult[] = players.map((player) => {
      const { kingdom } = player;
      const result = calculateScoreUseCase(kingdom);

      if (isErr(result)) {
        logger.error(`Error when calculating score: ${result.error}`);
        const code = result.error as ErrorCodeType;
        throw new StepExecutionError(
          translateErrorCode(translator, code),
          code,
          {
            gameId: game.id,
          },
        );
      }

      return {
        playerId: player.id,
        playerName: player.name,
        details: {
          ...result.value,
        },
      };
    });

    const result = getResultUseCase(game, scoreResult);

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
