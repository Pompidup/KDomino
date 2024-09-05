import type { AddPlayersCommand } from "@application/commands/addPlayersCommand.js";
import {
  InvalidStepError,
  StepExecutionError,
} from "@core/domain/errors/domainErrors.js";
import type { GameWithNextStep } from "@core/domain/types/game.js";
import type { AddPlayersUseCase } from "@core/useCases/addPlayers.js";
import { isErr } from "@utils/result.js";

type AddPlayersHandler = (command: AddPlayersCommand) => GameWithNextStep;

export const addPlayersHandler =
  (useCase: AddPlayersUseCase): AddPlayersHandler =>
  (command: AddPlayersCommand) => {
    const { game, players } = command;

    if (game.nextAction.step !== "addPlayers") {
      throw new InvalidStepError("Required game with addPlayers step");
    }

    const result = useCase(game, players);

    if (isErr(result)) {
      throw new StepExecutionError(result.error);
    }

    return result.value;
  };
