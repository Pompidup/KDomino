import type { AddExtraRulesCommand } from "@application/commands/addExtraRulesCommand.js";
import {
  ErrorCode,
  type ErrorCodeType,
  InvalidStepError,
  StepExecutionError,
} from "@core/domain/errors/domainErrors.js";
import {
  type GameWithNextStep,
  isGameWithNextStep,
} from "@core/domain/types/game.js";
import type { Translator } from "@core/i18n/translations.js";
import { translateErrorCode } from "@core/i18n/translations.js";
import type { Logger } from "@core/portServerside/logger.js";
import type { AddExtraRulesUseCase } from "@core/useCases/addExtraRules.js";
import { isErr } from "@utils/result.js";

type AddExtraRulesHandler = (command: AddExtraRulesCommand) => GameWithNextStep;

export const addExtraRulesHandler =
  (
    logger: Logger,
    translator: Translator,
    useCase: AddExtraRulesUseCase,
  ): AddExtraRulesHandler =>
  (command: AddExtraRulesCommand) => {
    const { game, extraRules } = command;
    logger.info(`Adding extra rules to game: ${game.id}`);
    logger.info(`Extra rules: ${extraRules}`);

    if (!isGameWithNextStep(game)) {
      logger.error(
        `Invalid game, required nextAction type: 'step' but got: ${game.nextAction.type}`,
      );
      throw new InvalidStepError(
        translateErrorCode(translator, ErrorCode.INVALID_STEP),
        { expected: "step", actual: game.nextAction.type, gameId: game.id },
      );
    }

    if (game.nextAction.step !== "options") {
      logger.error(
        `Required game with options step but got: ${game.nextAction.step}`,
      );
      throw new InvalidStepError(
        translateErrorCode(translator, ErrorCode.INVALID_STEP),
        { expected: "options", actual: game.nextAction.step, gameId: game.id },
      );
    }

    const result = useCase(game, extraRules);

    if (isErr(result)) {
      logger.error(`Error adding extra rules: ${result.error}`);
      const code = result.error as ErrorCodeType;
      throw new StepExecutionError(translateErrorCode(translator, code), code, {
        gameId: game.id,
        extraRules: command.extraRules,
      });
    }

    logger.info(`Extra rules added to game: ${game.id}`);
    return result.value;
  };
