import { StepExecutionError } from "../../core/domain/errors/domainErrors.js";
import type { GameWithNextStep } from "../../core/domain/types/game.js";
import type { CreateGameUseCase } from "../../core/useCases/createGame.js";
import type { CreateGameCommand } from "../commands/createGameCommand.js";
import { isErr } from "./../../utils/result.js";

type CreateGameHandler = (command: CreateGameCommand) => GameWithNextStep;

export const createGameHandler =
  (useCase: CreateGameUseCase): CreateGameHandler =>
  (command: CreateGameCommand) => {
    const result = useCase(command.mode);

    if (isErr(result)) {
      throw new StepExecutionError(result.error);
    }

    return result.value;
  };
