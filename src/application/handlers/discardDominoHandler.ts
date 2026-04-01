import type { DiscardDominoCommand } from "@application/commands/discardDominoCommand.js";
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
import type { DiscardDominoUseCase } from "@core/useCases/discardDomino.js";
import { isErr } from "@utils/result.js";

type DiscardDominoHandler = (command: DiscardDominoCommand) => GameState;

export const discardDominoHandler =
  (
    logger: Logger,
    translator: Translator,
    useCase: DiscardDominoUseCase,
  ): DiscardDominoHandler =>
  (command: DiscardDominoCommand) => {
    const { game, lordId } = command;
    logger.info(`Discarding domino for lord: ${lordId} in game: ${game.id}`);

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

    const result = useCase(game, lordId);

    if (isErr(result)) {
      logger.error(`Error discarding domino: ${result.error}`);
      const code = result.error as ErrorCodeType;
      throw new ActionExecutionError(
        translateErrorCode(translator, code),
        code,
        { gameId: game.id, lordId: command.lordId },
      );
    }

    if (isGameWithNextAction(result.value)) {
      logger.info(`Domino discarded: ${lordId} in game: ${game.id}`);
      return result.value;
    }

    logger.info(`Domino discarded: ${lordId} in game: ${game.id}`);
    return result.value;
  };
