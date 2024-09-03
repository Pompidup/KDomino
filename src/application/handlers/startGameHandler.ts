import type { Game, NextAction } from "../../core/domain/types/game.js";
import type { StartGameUseCase } from "../../core/useCases/startGame.js";
import { isErr } from "../../utils/result.js";
import type { StartGameCommand } from "../commands/startGameCommand.js";

type StartGameHandler = (
  command: StartGameCommand
) => Game & { nextAction: NextAction };

export const startGameHandler =
  (useCase: StartGameUseCase): StartGameHandler =>
  (command: StartGameCommand) => {
    const { game } = command;

    if (game.nextAction.step !== "start") {
      throw new Error("Invalid next action");
    }

    const result = useCase(game);

    if (isErr(result)) {
      throw new Error(result.error);
    }

    return result.value;
  };
