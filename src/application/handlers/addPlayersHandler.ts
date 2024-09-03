import type { Game, NextStep } from "../../core/domain/types/game.js";
import type { AddPlayersUseCase } from "../../core/useCases/addPlayers.js";
import { isErr } from "../../utils/result.js";
import type { AddPlayersCommand } from "../commands/addPlayersCommand.js";

type AddPlayersHandler = (
  command: AddPlayersCommand
) => Game & { nextAction: NextStep };

export const addPlayersHandler =
  (useCase: AddPlayersUseCase): AddPlayersHandler =>
  (command: AddPlayersCommand) => {
    const { game, players } = command;

    if (game.nextAction.step !== "addPlayers") {
      throw new Error("Invalid next action");
    }

    const result = useCase(game, players);

    if (isErr(result)) {
      throw new Error(result.error);
    }

    return result.value;
  };
