import { StepExecutionError } from "@core/domain/errors/domainErrors.js";
import type { GameWithNextStep } from "@core/domain/types/game.js";
import type { CreateGameUseCase } from "@core/useCases/createGame.js";
import type { CreateGameCommand } from "@application/commands/createGameCommand.js";
import { isErr } from "@utils/result.js";
import type { Logger } from "@core/portServerside/logger.js";

type CreateGameHandler = (command: CreateGameCommand) => GameWithNextStep;

export const createGameHandler =
  (logger: Logger, useCase: CreateGameUseCase): CreateGameHandler =>
  (command: CreateGameCommand) => {
    logger.info(`Creating game with mode: ${command.mode}`);
    const result = useCase(command.mode);

    if (isErr(result)) {
      logger.error(`Error creating game: ${result.error}`);
      throw new StepExecutionError(result.error);
    }

    logger.info(`Game created: ${result.value.id}`);
    return result.value;
  };
