import type { ChooseDominoCommand } from "@application/commands/chooseDominoCommand.js";
import {
  ActionExecutionError,
  ErrorCode,
  type ErrorCodeType,
  InvalidStepError,
} from "@core/domain/errors/domainErrors.js";
import {
  type GameWithNextAction,
  isGameWithNextAction,
} from "@core/domain/types/game.js";
import type { Translator } from "@core/i18n/translations.js";
import { translateErrorCode } from "@core/i18n/translations.js";
import type { Logger } from "@core/portServerside/logger.js";
import type { ChooseDominoUseCase } from "@core/useCases/chooseDomino.js";
import { isErr } from "@utils/result.js";

type ChooseDominoHandler = (command: ChooseDominoCommand) => GameWithNextAction;

export const chooseDominoHandler =
  (
    logger: Logger,
    translator: Translator,
    useCase: ChooseDominoUseCase,
  ): ChooseDominoHandler =>
  (command: ChooseDominoCommand) => {
    const { game, lordId, dominoPick } = command;
    logger.info(
      `Choosing domino: ${dominoPick} for lord: ${lordId} in game: ${game.id}`,
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

    if (game.nextAction.nextAction !== "pickDomino") {
      logger.error(
        `Required game with pickDomino action but got: ${game.nextAction.nextAction}`,
      );
      throw new InvalidStepError(
        translateErrorCode(translator, ErrorCode.INVALID_STEP),
        {
          expected: "pickDomino",
          actual: game.nextAction.nextAction,
          gameId: game.id,
        },
      );
    }

    const result = useCase(game, lordId, dominoPick);

    if (isErr(result)) {
      logger.error(`Error choosing domino: ${result.error}`);
      const code = result.error as ErrorCodeType;
      throw new ActionExecutionError(
        translateErrorCode(translator, code),
        code,
        {
          gameId: game.id,
          lordId: command.lordId,
          dominoPick: command.dominoPick,
        },
      );
    }

    logger.info(
      `Domino chosen: ${dominoPick} for lord: ${lordId} in game: ${game.id}`,
    );
    return result.value;
  };
