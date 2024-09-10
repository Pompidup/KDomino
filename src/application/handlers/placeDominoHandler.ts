import type { Logger } from "@core/portServerside/logger.js";
import type { PlaceDominoCommand } from "@application/commands/placeDominoCommand.js";
import {
  ActionExecutionError,
  InvalidStepError,
} from "@core/domain/errors/domainErrors.js";
import {
  isGameWithNextAction,
  type GameState,
} from "@core/domain/types/game.js";
import type { PlaceDominoUseCase } from "@core/useCases/placeDomino.js";
import { isErr } from "@utils/result.js";

type PlaceDominoHandler = (command: PlaceDominoCommand) => GameState;

export const placeDominoHandler =
  (logger: Logger, useCase: PlaceDominoUseCase): PlaceDominoHandler =>
  (command: PlaceDominoCommand) => {
    const { game, lordId, position, orientation, rotation } = command;
    logger.info(
      `Placing domino: ${lordId} in position: ${JSON.stringify(
        position
      )} with orientation: ${orientation} and rotation: ${rotation} in game: ${
        game.id
      }`
    );

    if (!isGameWithNextAction(game)) {
      logger.error(
        `Invalid game, required nextAction type: 'action' but got: ${game.nextAction.type}`
      );
      throw new InvalidStepError(
        "Required game with nextAction type: 'action'"
      );
    }

    if (game.nextAction.nextAction !== "placeDomino") {
      logger.error(
        `Required game with placeDomino action but got: ${game.nextAction.nextAction}`
      );
      throw new InvalidStepError("Required game with placeDomino step");
    }

    const result = useCase(game, lordId, position, orientation, rotation);

    if (isErr(result)) {
      logger.error(`Error placing domino: ${result.error}`);
      throw new ActionExecutionError(result.error);
    }

    if (isGameWithNextAction(result.value)) {
      logger.info(
        `Domino placed: ${lordId} in position: ${JSON.stringify(
          position
        )} with orientation: ${orientation} and rotation: ${rotation} in game: ${
          game.id
        }`
      );
      return result.value;
    }

    logger.info(
      `Domino placed: ${lordId} in position: ${JSON.stringify(
        position
      )} with orientation: ${orientation} and rotation: ${rotation} in game: ${
        game.id
      }`
    );
    return result.value;
  };
