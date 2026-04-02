import type { PlaceGiantCommand } from "@application/commands/placeGiantCommand.js";
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
import type { PlaceGiantUseCase } from "@core/useCases/placeGiant.js";
import { isErr } from "@utils/result.js";

type PlaceGiantHandler = (command: PlaceGiantCommand) => GameState;

export const placeGiantHandler =
  (
    logger: Logger,
    translator: Translator,
    useCase: PlaceGiantUseCase,
  ): PlaceGiantHandler =>
  (command: PlaceGiantCommand) => {
    const { game, lordId, position } = command;
    logger.info(
      `Placing giant for lord: ${lordId} at position: ${JSON.stringify(position)} in game: ${game.id}`,
    );

    if (game.nextAction.nextAction !== "placeGiant") {
      logger.error(
        `Required game with placeGiant action but got: ${game.nextAction.nextAction}`,
      );
      throw new InvalidStepError(
        translateErrorCode(translator, ErrorCode.INVALID_STEP),
        {
          expected: "placeGiant",
          actual: game.nextAction.nextAction,
          gameId: game.id,
        },
      );
    }

    const result = useCase(game, lordId, position);

    if (isErr(result)) {
      logger.error(`Error placing giant: ${result.error}`);
      const code = result.error as ErrorCodeType;
      throw new ActionExecutionError(
        translateErrorCode(translator, code),
        code,
        { gameId: game.id, lordId, position },
      );
    }

    logger.info(`Giant placed for lord: ${lordId} in game: ${game.id}`);
    return result.value;
  };
