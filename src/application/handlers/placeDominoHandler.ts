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
  (useCase: PlaceDominoUseCase): PlaceDominoHandler =>
  (command: PlaceDominoCommand) => {
    const { game, lordId, position, orientation, rotation } = command;

    if (!isGameWithNextAction(game)) {
      throw new InvalidStepError(
        "Required game with nextAction type: 'action'"
      );
    }

    if (game.nextAction.nextAction !== "placeDomino") {
      throw new InvalidStepError("Required game with placeDomino step");
    }

    const result = useCase(game, lordId, position, orientation, rotation);

    if (isErr(result)) {
      throw new ActionExecutionError(result.error);
    }

    if (isGameWithNextAction(result.value)) {
      return result.value;
    }

    return result.value;
  };
