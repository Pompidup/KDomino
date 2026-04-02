import type { ConstructBuildingCommand } from "@application/commands/constructBuildingCommand.js";
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
import type { ConstructBuildingUseCase } from "@core/useCases/constructBuilding.js";
import { isErr } from "@utils/result.js";

type ConstructBuildingHandler = (
  command: ConstructBuildingCommand,
) => GameState;

export const constructBuildingHandler =
  (
    logger: Logger,
    translator: Translator,
    useCase: ConstructBuildingUseCase,
  ): ConstructBuildingHandler =>
  (command: ConstructBuildingCommand) => {
    const { game, lordId, buildingId, position } = command;
    logger.info(
      `Constructing building: ${buildingId} for lord: ${lordId} at position: ${JSON.stringify(
        position,
      )} in game: ${game.id}`,
    );

    if (game.nextAction.nextAction !== "constructBuilding") {
      logger.error(
        `Required game with constructBuilding action but got: ${game.nextAction.nextAction}`,
      );
      throw new InvalidStepError(
        translateErrorCode(translator, ErrorCode.INVALID_STEP),
        {
          expected: "constructBuilding",
          actual: game.nextAction.nextAction,
          gameId: game.id,
        },
      );
    }

    const result = useCase(game, lordId, buildingId, position);

    if (isErr(result)) {
      logger.error(`Error constructing building: ${result.error}`);
      const code = result.error as ErrorCodeType;
      throw new ActionExecutionError(
        translateErrorCode(translator, code),
        code,
        {
          gameId: game.id,
          lordId: command.lordId,
          buildingId: command.buildingId,
          position: command.position,
        },
      );
    }

    logger.info(
      `Building constructed: ${buildingId} for lord: ${lordId} at position: ${JSON.stringify(
        position,
      )} in game: ${game.id}`,
    );
    return result.value;
  };
