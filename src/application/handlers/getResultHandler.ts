import {
  InvalidStepError,
  NotFoundError,
} from "../../core/domain/errors/domainErrors.js";
import type { GameWithResults } from "../../core/domain/types/game.js";
import type { GetResultUseCase } from "../../core/useCases/getResult.js";
import { isErr } from "../../utils/result.js";
import type { GetResultCommand } from "../commands/getResultCommand.js";

type GetResultHandler = (command: GetResultCommand) => GameWithResults;

export const getResultHandler =
  (useCase: GetResultUseCase): GetResultHandler =>
  (command: GetResultCommand) => {
    const { game } = command;

    if (game.nextAction.step !== "result") {
      throw new InvalidStepError("Required game with result step");
    }

    const result = useCase(game);

    if (isErr(result)) {
      throw new NotFoundError(result.error);
    }

    return result.value;
  };
