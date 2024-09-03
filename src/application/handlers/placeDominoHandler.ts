import {
  isGameWithNextAction,
  type Game,
  type GameWithNextAction,
  type GameWithNextStep,
} from "../../core/domain/types/game.js";
import type { PlaceDominoUseCase } from "../../core/useCases/placeDomino.js";
import { isErr } from "../../utils/result.js";
import type { PlaceDominoCommand } from "../commands/placeDominoCommand.js";

type PlaceDominoHandler = (
  command: PlaceDominoCommand
) => GameWithNextAction | GameWithNextStep;

export const placeDominoHandler =
  (useCase: PlaceDominoUseCase): PlaceDominoHandler =>
  (command: PlaceDominoCommand) => {
    const { game, lordId, position, orientation, rotation } = command;

    if (game.nextAction.nextAction !== "placeDomino") {
      throw new Error("Invalid next action");
    }

    const result = useCase(game, lordId, position, orientation, rotation);

    if (isErr(result)) {
      throw new Error(result.error);
    }

    if (isGameWithNextAction(result.value)) {
      return result.value;
    }

    return result.value;
  };
