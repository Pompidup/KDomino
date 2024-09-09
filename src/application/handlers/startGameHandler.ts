import type { Logger } from "@core/portServerside/logger.js";
import type { StartGameCommand } from "@application/commands/startGameCommand.js";
import {
  InvalidStepError,
  StepExecutionError,
} from "@core/domain/errors/domainErrors.js";
import {
  isGameWithNextStep,
  type GameWithNextAction,
} from "@core/domain/types/game.js";
import type { StartGameUseCase } from "@core/useCases/startGame.js";
import { isErr } from "@utils/result.js";

type StartGameHandler = (command: StartGameCommand) => GameWithNextAction;

export const startGameHandler =
  (logger: Logger, useCase: StartGameUseCase): StartGameHandler =>
  (command: StartGameCommand) => {
    const { game } = command;
    logger.info(`Starting game: ${game.id}`);

    if (!isGameWithNextStep(game)) {
      logger.error("Invalid game with nextAction type: 'step'");
      throw new InvalidStepError("Required game with nextAction type: 'step'");
    }

    if (
      game.nextAction.step !== "start" &&
      game.nextAction.step !== "options"
    ) {
      logger.error(
        `Required game with start step or options step but got: ${game.nextAction.step}`
      );
      throw new InvalidStepError(
        "Required game with start step or options step"
      );
    }

    const result = useCase(game);

    if (isErr(result)) {
      logger.error(`Error starting game: ${result.error}`);
      throw new StepExecutionError(result.error);
    }

    logger.info(`Game started: ${game.id}`);
    return result.value;
  };
