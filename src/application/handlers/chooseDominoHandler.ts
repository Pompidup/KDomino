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
  (useCase: ChooseDominoUseCase): ChooseDominoHandler =>
  (command: ChooseDominoCommand) => {
    const { game, lordId, dominoPick } = command;

    if (!isGameWithNextAction(game)) {
      throw new InvalidStepError(
        "Required game with nextAction type: 'action'"
      );
    }

    if (game.nextAction.nextAction !== "pickDomino") {
      throw new InvalidStepError("Required game with pickDomino action");
    }

    const result = useCase(game, lordId, dominoPick);

    if (isErr(result)) {
      throw new ActionExecutionError(result.error);
    }
    return result.value;
  };
