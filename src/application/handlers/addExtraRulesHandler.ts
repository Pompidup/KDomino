import type { Logger } from "@core/portServerside/logger.js";
import type { AddExtraRulesCommand } from "@application/commands/addExtraRulesCommand.js";
import {
  InvalidStepError,
  StepExecutionError,
} from "@core/domain/errors/domainErrors.js";
import {
  isGameWithNextStep,
  type GameWithNextStep,
} from "@core/domain/types/game.js";
import type { AddExtraRulesUseCase } from "@core/useCases/addExtraRules.js";
import { isErr } from "@utils/result.js";

type AddExtraRulesHandler = (command: AddExtraRulesCommand) => GameWithNextStep;

export const addExtraRulesHandler =
  (logger: Logger, useCase: AddExtraRulesUseCase): AddExtraRulesHandler =>
  (command: AddExtraRulesCommand) => {
    const { game, extraRules } = command;
    logger.info(`Adding extra rules to game: ${game.id}`);
    logger.info(`Extra rules: ${extraRules}`);

    if (!isGameWithNextStep(game)) {
      logger.error("Invalid game with nextAction type: 'step'");
      throw new InvalidStepError("Required game with nextAction type: 'step'");
    }

    if (game.nextAction.step !== "options") {
      logger.error(
        `Required game with options step but got: ${game.nextAction.step}`
      );
      throw new InvalidStepError("Required game with options step");
    }

    const result = useCase(game, extraRules);

    if (isErr(result)) {
      logger.error(`Error adding extra rules: ${result.error}`);
      throw new StepExecutionError(result.error);
    }

    logger.info(`Extra rules added to game: ${game.id}`);
    return result.value;
  };
