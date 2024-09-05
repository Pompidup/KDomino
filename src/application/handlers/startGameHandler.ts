import type { StartGameCommand } from "@application/commands/startGameCommand.js";
import {
  InvalidStepError,
  StepExecutionError,
} from "@core/domain/errors/domainErrors.js";
import {
  isGameWithNextStep,
  type GameWithNextAction,
} from "@core/domain/types/game.js";
import type { StartGameUseCase } from "@core/useCases/startGame.js";
import { isErr } from "@utils/result.js";

type StartGameHandler = (command: StartGameCommand) => GameWithNextAction;

export const startGameHandler =
  (useCase: StartGameUseCase): StartGameHandler =>
  (command: StartGameCommand) => {
    const { game } = command;

    if (!isGameWithNextStep(game)) {
      throw new InvalidStepError("Required game with nextAction type: 'step'");
    }

    if (
      game.nextAction.step !== "start" &&
      game.nextAction.step !== "options"
    ) {
      throw new InvalidStepError(
        "Required game with start step or options step"
      );
    }

    const result = useCase(game);

    if (isErr(result)) {
      throw new StepExecutionError(result.error);
    }

    return result.value;
  };
