import type { DiscardDominoCommand } from "../commands/discardDominoCommand.js";
import type { DiscardDominoUseCase } from "../../core/useCases/discardDomino.js";
import { isErr } from "../../utils/result.js";
import {
  isGameWithNextAction,
  type GameWithNextAction,
  type GameWithNextStep,
} from "../../core/domain/types/game.js";

type DiscardDominoHandler = (
  command: DiscardDominoCommand
) => GameWithNextAction | GameWithNextStep;

export const discardDominoHandler =
  (useCase: DiscardDominoUseCase): DiscardDominoHandler =>
  (command: DiscardDominoCommand) => {
    const { game, lordId } = command;

    if (game.nextAction.nextAction !== "placeDomino") {
      throw new Error("Invalid next action");
    }

    const result = useCase(game, lordId);

    if (isErr(result)) {
      throw new Error(result.error);
    }

    if (isGameWithNextAction(result.value)) {
      return result.value;
    }

    return result.value;
  };
