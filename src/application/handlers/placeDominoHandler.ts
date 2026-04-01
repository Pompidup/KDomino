import type { PlaceDominoCommand } from "@application/commands/placeDominoCommand.js";
import {
  ActionExecutionError,
  ErrorCode,
  type ErrorCodeType,
  InvalidStepError,
} from "@core/domain/errors/domainErrors.js";
import {
  type GameState,
  isGameWithNextAction,
} from "@core/domain/types/game.js";
import type { Translator } from "@core/i18n/translations.js";
import { translateErrorCode } from "@core/i18n/translations.js";
import type { Logger } from "@core/portServerside/logger.js";
import type { PlaceDominoUseCase } from "@core/useCases/placeDomino.js";
import { isErr } from "@utils/result.js";

type PlaceDominoHandler = (command: PlaceDominoCommand) => GameState;

export const placeDominoHandler =
  (
    logger: Logger,
    translator: Translator,
    useCase: PlaceDominoUseCase,
  ): PlaceDominoHandler =>
  (command: PlaceDominoCommand) => {
    const { game, lordId, position, rotation } = command;
    logger.info(
      `Placing domino: ${lordId} in position: ${JSON.stringify(
        position,
      )} with rotation: ${rotation} in game: ${game.id}`,
    );

    if (!isGameWithNextAction(game)) {
      logger.error(
        `Invalid game, required nextAction type: 'action' but got: ${game.nextAction.type}`,
      );
      throw new InvalidStepError(
        translateErrorCode(translator, ErrorCode.INVALID_STEP),
        { expected: "action", actual: game.nextAction.type, gameId: game.id },
      );
    }

    if (game.nextAction.nextAction !== "placeDomino") {
      logger.error(
        `Required game with placeDomino action but got: ${game.nextAction.nextAction}`,
      );
      throw new InvalidStepError(
        translateErrorCode(translator, ErrorCode.INVALID_STEP),
        {
          expected: "placeDomino",
          actual: game.nextAction.nextAction,
          gameId: game.id,
        },
      );
    }

    const result = useCase(game, lordId, position, rotation);

    if (isErr(result)) {
      logger.error(`Error placing domino: ${result.error}`);
      const code = result.error as ErrorCodeType;
      throw new ActionExecutionError(
        translateErrorCode(translator, code),
        code,
        {
          gameId: game.id,
          lordId: command.lordId,
          position: command.position,
          rotation: command.rotation,
        },
      );
    }

    if (isGameWithNextAction(result.value)) {
      logger.info(
        `Domino placed: ${lordId} in position: ${JSON.stringify(
          position,
        )} with rotation: ${rotation} in game: ${game.id}`,
      );
      return result.value;
    }

    logger.info(
      `Domino placed: ${lordId} in position: ${JSON.stringify(
        position,
      )} with rotation: ${rotation} in game: ${game.id}`,
    );
    return result.value;
  };
