import type { UseDragonCommand } from "@application/commands/useDragonCommand.js";
import {
  ActionExecutionError,
  ErrorCode,
  type ErrorCodeType,
  InvalidStepError,
} from "@core/domain/errors/domainErrors.js";
import type { GameState } from "@core/domain/types/game.js";
import type { Translator } from "@core/i18n/translations.js";
import { translateErrorCode } from "@core/i18n/translations.js";
import type { Logger } from "@core/portServerside/logger.js";
import type { UseDragonUseCase } from "@core/useCases/useDragon.js";
import { isErr } from "@utils/result.js";

type UseDragonHandler = (command: UseDragonCommand) => GameState;

export const useDragonHandler =
  (
    logger: Logger,
    translator: Translator,
    useCase: UseDragonUseCase,
  ): UseDragonHandler =>
  (command: UseDragonCommand) => {
    const { game, lordId, buildingId } = command;
    logger.info(
      `Using dragon on building: ${buildingId} for lord: ${lordId} in game: ${game.id}`,
    );

    if (game.nextAction.nextAction !== "useDragon") {
      logger.error(
        `Required game with useDragon action but got: ${game.nextAction.nextAction}`,
      );
      throw new InvalidStepError(
        translateErrorCode(translator, ErrorCode.INVALID_STEP),
        {
          expected: "useDragon",
          actual: game.nextAction.nextAction,
          gameId: game.id,
        },
      );
    }

    const result = useCase(game, lordId, buildingId);

    if (isErr(result)) {
      logger.error(`Error using dragon: ${result.error}`);
      const code = result.error as ErrorCodeType;
      throw new ActionExecutionError(
        translateErrorCode(translator, code),
        code,
        {
          gameId: game.id,
          lordId: command.lordId,
          buildingId: command.buildingId,
        },
      );
    }

    logger.info(
      `Dragon used on building: ${buildingId} for lord: ${lordId} in game: ${game.id}`,
    );
    return result.value;
  };
