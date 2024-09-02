import { isErr } from "./../../utils/result";
import type { Game, NextStep } from "../../core/domain/types/game.js";
import type { CreateGameCommand } from "../commands/createGameCommand.js";
import type { CreateGameUseCase } from "../../core/useCases/createGame.js";

type CreateGameHandler = (
  command: CreateGameCommand
) => Game & { nextAction: NextStep };

export const createGameHandler =
  (useCase: CreateGameUseCase): CreateGameHandler =>
  (command: CreateGameCommand) => {
    const result = useCase(command.mode);

    if (isErr(result)) {
      throw new Error(result.error);
    }

    return result.value;
  };
