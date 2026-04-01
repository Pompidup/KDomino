import type { PlaceKnightCommand } from "@application/commands/placeKnightCommand.js";
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
import type { PlaceKnightUseCase } from "@core/useCases/placeKnight.js";
import { isErr } from "@utils/result.js";

type PlaceKnightHandler = (command: PlaceKnightCommand) => GameState;

export const placeKnightHandler =
  (
    logger: Logger,
    translator: Translator,
    useCase: PlaceKnightUseCase,
  ): PlaceKnightHandler =>
  (command: PlaceKnightCommand) => {
    const { game, lordId, position } = command;
    logger.info(
      `Placing knight for lord: ${lordId} at position: ${JSON.stringify(
        position,
      )} in game: ${game.id}`,
    );

    if (game.nextAction.nextAction !== "placeKnight") {
      logger.error(
        `Required game with placeKnight action but got: ${game.nextAction.nextAction}`,
      );
      throw new InvalidStepError(
        translateErrorCode(translator, ErrorCode.INVALID_STEP),
        {
          expected: "placeKnight",
          actual: game.nextAction.nextAction,
          gameId: game.id,
        },
      );
    }

    const result = useCase(game, lordId, position);

    if (isErr(result)) {
      logger.error(`Error placing knight: ${result.error}`);
      const code = result.error as ErrorCodeType;
      throw new ActionExecutionError(
        translateErrorCode(translator, code),
        code,
        {
          gameId: game.id,
          lordId: command.lordId,
          position: command.position,
        },
      );
    }

    logger.info(
      `Knight placed for lord: ${lordId} at position: ${JSON.stringify(
        position,
      )} in game: ${game.id}`,
    );
    return result.value;
  };
