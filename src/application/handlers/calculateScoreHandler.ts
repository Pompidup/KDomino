import type { CalculateScoreCommand } from "@application/commands/calculateScoreCommand.js";
import type { Score } from "@core/domain/types/game.js";
import type { Logger } from "@core/portServerside/logger.js";
import type { CalculateScoreUseCase } from "@core/useCases/calculateScore.js";
import { isErr } from "@utils/result.js";

type CalculateScoreHandler = (command: CalculateScoreCommand) => Score;

export const calculateScoreHandler =
  (logger: Logger, useCase: CalculateScoreUseCase): CalculateScoreHandler =>
  (command) => {
    const { kingdom } = command;
    logger.info(`Calculating score for kingdom`);
    const result = useCase(kingdom);

    if (isErr(result)) {
      logger.error(`Error calculating score: ${result.error}`);
      throw new Error(result.error);
    }

    logger.info(`Score calculated: ${result.value}`);
    return result.value;
  };
