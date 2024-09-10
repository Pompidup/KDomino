import type { GetResultCommand } from "@application/commands/getResultCommand.js";
import {
  InvalidStepError,
  NotFoundError,
} from "@core/domain/errors/domainErrors.js";
import {
  isGameWithNextStep,
  type GameWithResults,
} from "@core/domain/types/game.js";
import type { Logger } from "@core/portServerside/logger.js";
import type { GetResultUseCase } from "@core/useCases/getResult.js";
import { isErr } from "@utils/result.js";

type GetResultHandler = (command: GetResultCommand) => GameWithResults;

export const getResultHandler =
  (logger: Logger, useCase: GetResultUseCase): GetResultHandler =>
  (command: GetResultCommand) => {
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

    const result = useCase(game);

    if (isErr(result)) {
      logger.error(`Error getting result: ${result.error}`);
      throw new NotFoundError(result.error);
    }

    logger.info(`Result retrieved for game: ${game.id}`);
    return result.value;
  };
