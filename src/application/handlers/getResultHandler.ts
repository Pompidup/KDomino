import type { GetResultCommand } from "@application/commands/getResultCommand.js";
import {
  InvalidStepError,
  NotFoundError,
  StepExecutionError,
} from "@core/domain/errors/domainErrors.js";
import {
  isGameWithNextStep,
  type GameWithResults,
  type ScoreResult,
} from "@core/domain/types/game.js";
import type { Logger } from "@core/portServerside/logger.js";
import type { CalculateScoreUseCase } from "@core/useCases/calculateScore.js";
import type { GetResultUseCase } from "@core/useCases/getResult.js";
import { isErr } from "@utils/result.js";

type GetResultHandler = (command: GetResultCommand) => GameWithResults;

export const getResultHandler =
  (
    logger: Logger,
    useCases: {
      getResultUseCase: GetResultUseCase;
      calculateScoreUseCase: CalculateScoreUseCase;
    }
  ): GetResultHandler =>
  (command: GetResultCommand) => {
    const { getResultUseCase, calculateScoreUseCase } = useCases;
    const { game } = command;
    logger.info(`Getting result for game: ${game.id}`);

    if (!isGameWithNextStep(game)) {
      logger.error(
        `Invalid game, required nextAction type: 'step' but got: ${game.nextAction.type}`
      );
      throw new InvalidStepError("Required game with nextAction type: 'step'");
    }

    if (game.nextAction.step !== "result") {
      logger.error(
        `Required game with result step but got: ${game.nextAction.step}`
      );
      throw new InvalidStepError("Required game with result step");
    }

    let scoreResult: ScoreResult[];
    const { players } = game;

    scoreResult = players.map((player) => {
      const { kingdom } = player;
      const result = calculateScoreUseCase(kingdom);

      if (isErr(result)) {
        logger.error(`Error when calculating score: ${result.error}`);
        throw new StepExecutionError(result.error);
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
      throw new NotFoundError(result.error);
    }

    logger.info(`Result retrieved for game: ${game.id}`);
    return result.value;
  };
