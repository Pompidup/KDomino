import type { Logger } from "@core/portServerside/logger.js";
import type { DiscardDominoCommand } from "@application/commands/discardDominoCommand.js";
import {
  ActionExecutionError,
  InvalidStepError,
} from "@core/domain/errors/domainErrors.js";
import {
  isGameWithNextAction,
  type GameState,
} from "@core/domain/types/game.js";
import type { DiscardDominoUseCase } from "@core/useCases/discardDomino.js";
import { isErr } from "@utils/result.js";

type DiscardDominoHandler = (command: DiscardDominoCommand) => GameState;

export const discardDominoHandler =
  (logger: Logger, useCase: DiscardDominoUseCase): DiscardDominoHandler =>
  (command: DiscardDominoCommand) => {
    const { game, lordId } = command;
    logger.info(`Discarding domino for lord: ${lordId} in game: ${game.id}`);

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
      throw new InvalidStepError("Required game with placeDomino action");
    }

    const result = useCase(game, lordId);

    if (isErr(result)) {
      logger.error(`Error discarding domino: ${result.error}`);
      throw new ActionExecutionError(result.error);
    }

    if (isGameWithNextAction(result.value)) {
      logger.info(`Domino discarded: ${lordId} in game: ${game.id}`);
      return result.value;
    }

    logger.info(`Domino discarded: ${lordId} in game: ${game.id}`);
    return result.value;
  };
