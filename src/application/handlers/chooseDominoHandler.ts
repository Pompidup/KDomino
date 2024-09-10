import type { Logger } from "@core/portServerside/logger.js";
import type { ChooseDominoCommand } from "@application/commands/chooseDominoCommand.js";
import {
  ActionExecutionError,
  InvalidStepError,
} from "@core/domain/errors/domainErrors.js";
import {
  isGameWithNextAction,
  type GameWithNextAction,
} from "@core/domain/types/game.js";
import type { ChooseDominoUseCase } from "@core/useCases/chooseDomino.js";
import { isErr } from "@utils/result.js";

type ChooseDominoHandler = (command: ChooseDominoCommand) => GameWithNextAction;

export const chooseDominoHandler =
  (logger: Logger, useCase: ChooseDominoUseCase): ChooseDominoHandler =>
  (command: ChooseDominoCommand) => {
    const { game, lordId, dominoPick } = command;
    logger.info(
      `Choosing domino: ${dominoPick} for lord: ${lordId} in game: ${game.id}`
    );

    if (!isGameWithNextAction(game)) {
      logger.error(
        `Invalid game, required nextAction type: 'action' but got: ${game.nextAction.type}`
      );
      throw new InvalidStepError(
        "Required game with nextAction type: 'action'"
      );
    }

    if (game.nextAction.nextAction !== "pickDomino") {
      logger.error(
        `Required game with pickDomino action but got: ${game.nextAction.nextAction}`
      );
      throw new InvalidStepError("Required game with pickDomino action");
    }

    const result = useCase(game, lordId, dominoPick);

    if (isErr(result)) {
      logger.error(`Error choosing domino: ${result.error}`);
      throw new ActionExecutionError(result.error);
    }

    logger.info(
      `Domino chosen: ${dominoPick} for lord: ${lordId} in game: ${game.id}`
    );
    return result.value;
  };
