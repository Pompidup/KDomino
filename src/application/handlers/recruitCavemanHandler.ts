import type { RecruitCavemanCommand } from "@application/commands/recruitCavemanCommand.js";
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
import type { RecruitCavemanUseCase } from "@core/useCases/recruitCaveman.js";
import { isErr } from "@utils/result.js";

type RecruitCavemanHandler = (command: RecruitCavemanCommand) => GameState;

export const recruitCavemanHandler =
  (
    logger: Logger,
    translator: Translator,
    useCase: RecruitCavemanUseCase,
  ): RecruitCavemanHandler =>
  (command: RecruitCavemanCommand) => {
    const { game, lordId, cavemanId, position, resourcePositions } = command;
    logger.info(
      `Recruiting caveman ${cavemanId} for lord: ${lordId} in game: ${game.id}`,
    );

    if (game.nextAction.nextAction !== "recruitCaveman") {
      logger.error(
        `Required game with recruitCaveman action but got: ${game.nextAction.nextAction}`,
      );
      throw new InvalidStepError(
        translateErrorCode(translator, ErrorCode.INVALID_STEP),
        {
          expected: "recruitCaveman",
          actual: game.nextAction.nextAction,
          gameId: game.id,
        },
      );
    }

    const result = useCase(
      game,
      lordId,
      cavemanId,
      position,
      resourcePositions,
    );

    if (isErr(result)) {
      logger.error(`Error recruiting caveman: ${result.error}`);
      const code = result.error as ErrorCodeType;
      throw new ActionExecutionError(
        translateErrorCode(translator, code),
        code,
        {
          gameId: game.id,
          lordId,
          cavemanId,
          position,
        },
      );
    }

    logger.info(
      `Caveman ${cavemanId} recruited for lord: ${lordId} in game: ${game.id}`,
    );
    return result.value;
  };
