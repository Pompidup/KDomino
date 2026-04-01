import type { PlaceFireTokenCommand } from "@application/commands/placeFireTokenCommand.js";
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
import type { PlaceFireTokenUseCase } from "@core/useCases/placeFireToken.js";
import { isErr } from "@utils/result.js";

type PlaceFireTokenHandler = (command: PlaceFireTokenCommand) => GameState;

export const placeFireTokenHandler =
  (
    logger: Logger,
    translator: Translator,
    useCase: PlaceFireTokenUseCase,
  ): PlaceFireTokenHandler =>
  (command: PlaceFireTokenCommand) => {
    const { game, lordId, position } = command;
    logger.info(
      `Placing fire token for lord: ${lordId} at position: ${JSON.stringify(
        position,
      )} in game: ${game.id}`,
    );

    if (game.nextAction.nextAction !== "placeFireToken") {
      logger.error(
        `Required game with placeFireToken action but got: ${game.nextAction.nextAction}`,
      );
      throw new InvalidStepError(
        translateErrorCode(translator, ErrorCode.INVALID_STEP),
        {
          expected: "placeFireToken",
          actual: game.nextAction.nextAction,
          gameId: game.id,
        },
      );
    }

    const result = useCase(game, lordId, position);

    if (isErr(result)) {
      logger.error(`Error placing fire token: ${result.error}`);
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
      `Fire token placed for lord: ${lordId} at position: ${JSON.stringify(
        position,
      )} in game: ${game.id}`,
    );
    return result.value;
  };
