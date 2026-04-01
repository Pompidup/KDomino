import type { StartGameCommand } from "@application/commands/startGameCommand.js";
import {
  ErrorCode,
  type ErrorCodeType,
  InvalidStepError,
  StepExecutionError,
} from "@core/domain/errors/domainErrors.js";
import {
  type GameWithNextAction,
  isGameWithNextStep,
} from "@core/domain/types/game.js";
import type { Translator } from "@core/i18n/translations.js";
import { translateErrorCode } from "@core/i18n/translations.js";
import type { Logger } from "@core/portServerside/logger.js";
import type { StartGameUseCase } from "@core/useCases/startGame.js";
import { isErr } from "@utils/result.js";

type StartGameHandler = (command: StartGameCommand) => GameWithNextAction;

export const startGameHandler =
  (
    logger: Logger,
    translator: Translator,
    useCase: StartGameUseCase,
  ): StartGameHandler =>
  (command: StartGameCommand) => {
    const { game } = command;
    logger.info(`Starting game: ${game.id}`);

    if (!isGameWithNextStep(game)) {
      logger.error(
        `Invalid game, required nextAction type: 'step' but got: ${game.nextAction.type}`,
      );
      throw new InvalidStepError(
        translateErrorCode(translator, ErrorCode.INVALID_STEP),
        { expected: "step", actual: game.nextAction.type, gameId: game.id },
      );
    }

    if (
      game.nextAction.step !== "start" &&
      game.nextAction.step !== "options"
    ) {
      logger.error(
        `Required game with start step or options step but got: ${game.nextAction.step}`,
      );
      throw new InvalidStepError(
        translateErrorCode(translator, ErrorCode.INVALID_STEP),
        {
          expected: "start|options",
          actual: game.nextAction.step,
          gameId: game.id,
        },
      );
    }

    const result = useCase(game);

    if (isErr(result)) {
      logger.error(`Error starting game: ${result.error}`);
      const code = result.error as ErrorCodeType;
      throw new StepExecutionError(translateErrorCode(translator, code), code, {
        gameId: game.id,
      });
    }

    logger.info(`Game started: ${game.id}`);
    return result.value;
  };
