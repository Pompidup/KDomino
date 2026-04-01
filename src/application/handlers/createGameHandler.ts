import type { CreateGameCommand } from "@application/commands/createGameCommand.js";
import {
  type ErrorCodeType,
  StepExecutionError,
} from "@core/domain/errors/domainErrors.js";
import type { GameWithNextStep } from "@core/domain/types/game.js";
import type { Translator } from "@core/i18n/translations.js";
import { translateErrorCode } from "@core/i18n/translations.js";
import type { Logger } from "@core/portServerside/logger.js";
import type { CreateGameUseCase } from "@core/useCases/createGame.js";
import { isErr } from "@utils/result.js";

type CreateGameHandler = (command: CreateGameCommand) => GameWithNextStep;

export const createGameHandler =
  (
    logger: Logger,
    translator: Translator,
    useCase: CreateGameUseCase,
  ): CreateGameHandler =>
  (command: CreateGameCommand) => {
    logger.info(`Creating game with mode: ${command.mode}`);
    const result = useCase(command.mode, command.seed);

    if (isErr(result)) {
      logger.error(`Error creating game: ${result.error}`);
      const code = result.error as ErrorCodeType;
      throw new StepExecutionError(translateErrorCode(translator, code), code, {
        mode: command.mode,
      });
    }

    logger.info(`Game created: ${result.value.id}`);
    return result.value;
  };
