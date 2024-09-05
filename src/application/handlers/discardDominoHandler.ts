import type { DiscardDominoCommand } from "@application/commands/discardDominoCommand.js";
import {
  ActionExecutionError,
  InvalidStepError,
} from "@core/domain/errors/domainErrors.js";
import {
  isGameWithNextAction,
  type GameWithNextAction,
  type GameWithNextStep,
} from "@core/domain/types/game.js";
import type { DiscardDominoUseCase } from "@core/useCases/discardDomino.js";
import { isErr } from "@utils/result.js";

type DiscardDominoHandler = (
  command: DiscardDominoCommand
) => GameWithNextAction | GameWithNextStep;

export const discardDominoHandler =
  (useCase: DiscardDominoUseCase): DiscardDominoHandler =>
  (command: DiscardDominoCommand) => {
    const { game, lordId } = command;

    if (game.nextAction.nextAction !== "placeDomino") {
      throw new InvalidStepError("Required game with placeDomino action");
    }

    const result = useCase(game, lordId);

    if (isErr(result)) {
      throw new ActionExecutionError(result.error);
    }

    if (isGameWithNextAction(result.value)) {
      return result.value;
    }

    return result.value;
  };
