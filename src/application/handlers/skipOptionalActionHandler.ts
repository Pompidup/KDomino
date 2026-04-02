import type { SkipOptionalActionCommand } from "@application/commands/skipOptionalActionCommand.js";
import {
  ActionExecutionError,
  type ErrorCodeType,
} from "@core/domain/errors/domainErrors.js";
import type { GameState } from "@core/domain/types/game.js";
import type { Translator } from "@core/i18n/translations.js";
import { translateErrorCode } from "@core/i18n/translations.js";
import type { Logger } from "@core/portServerside/logger.js";
import type { SkipOptionalActionUseCase } from "@core/useCases/skipOptionalAction.js";
import { isErr } from "@utils/result.js";

type SkipOptionalActionHandler = (
  command: SkipOptionalActionCommand,
) => GameState;

export const skipOptionalActionHandler =
  (
    logger: Logger,
    translator: Translator,
    useCase: SkipOptionalActionUseCase,
  ): SkipOptionalActionHandler =>
  (command: SkipOptionalActionCommand) => {
    const { game, lordId } = command;
    logger.info(
      `Skipping optional action for lord: ${lordId} in game: ${game.id}`,
    );

    const result = useCase(game, lordId);

    if (isErr(result)) {
      logger.error(`Error skipping optional action: ${result.error}`);
      const code = result.error as ErrorCodeType;
      throw new ActionExecutionError(
        translateErrorCode(translator, code),
        code,
        { gameId: game.id, lordId: command.lordId },
      );
    }

    logger.info(
      `Optional action skipped for lord: ${lordId} in game: ${game.id}`,
    );
    return result.value;
  };
