import type { SendGiantCommand } from "@application/commands/sendGiantCommand.js";
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
import type { SendGiantUseCase } from "@core/useCases/sendGiant.js";
import { isErr } from "@utils/result.js";

type SendGiantHandler = (command: SendGiantCommand) => GameState;

export const sendGiantHandler =
  (
    logger: Logger,
    translator: Translator,
    useCase: SendGiantUseCase,
  ): SendGiantHandler =>
  (command: SendGiantCommand) => {
    const { game, lordId, giantIndex, targetPlayerId, targetCrownPosition } =
      command;
    logger.info(
      `Sending giant for lord: ${lordId} to player: ${targetPlayerId} in game: ${game.id}`,
    );

    if (game.nextAction.nextAction !== "sendGiant") {
      logger.error(
        `Required game with sendGiant action but got: ${game.nextAction.nextAction}`,
      );
      throw new InvalidStepError(
        translateErrorCode(translator, ErrorCode.INVALID_STEP),
        {
          expected: "sendGiant",
          actual: game.nextAction.nextAction,
          gameId: game.id,
        },
      );
    }

    const result = useCase(
      game,
      lordId,
      giantIndex,
      targetPlayerId,
      targetCrownPosition,
    );

    if (isErr(result)) {
      logger.error(`Error sending giant: ${result.error}`);
      const code = result.error as ErrorCodeType;
      throw new ActionExecutionError(
        translateErrorCode(translator, code),
        code,
        { gameId: game.id, lordId, targetPlayerId, targetCrownPosition },
      );
    }

    logger.info(
      `Giant sent from lord: ${lordId} to player: ${targetPlayerId} in game: ${game.id}`,
    );
    return result.value;
  };
