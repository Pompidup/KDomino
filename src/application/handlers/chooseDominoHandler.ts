import type { GameWithNextAction } from "../../core/domain/types/game.js";
import type { ChooseDominoUseCase } from "../../core/useCases/chooseDomino.js";
import { isErr } from "../../utils/result.js";
import type { ChooseDominoCommand } from "../commands/chooseDominoCommand.js";

type ChooseDominoHandler = (command: ChooseDominoCommand) => GameWithNextAction;

export const chooseDominoHandler =
  (useCase: ChooseDominoUseCase): ChooseDominoHandler =>
  (command: ChooseDominoCommand) => {
    const { game, lordId, dominoPick } = command;

    if (game.nextAction.nextAction !== "pickDomino") {
      throw new Error("Invalid next action");
    }

    const result = useCase(game, lordId, dominoPick);

    if (isErr(result)) {
      throw new Error(result.error);
    }
    return result.value;
  };
