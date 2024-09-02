import type { GetResultCommand } from "../commands/getResultCommand.js";
import type { GameWithResults } from "../../core/domain/types/game.js";
import { isErr } from "../../utils/result.js";
import type { GetResultUseCase } from "../../core/useCases/getResult.js";

type GetResultHandler = (command: GetResultCommand) => GameWithResults;

export const getResultHandler =
  (useCase: GetResultUseCase): GetResultHandler =>
  (command: GetResultCommand) => {
    const { game } = command;

    if (game.nextAction.step !== "result") {
      throw new Error("Invalid next step");
    }

    const result = useCase(game);

    if (isErr(result)) {
      throw new Error(result.error);
    }

    return result.value;
  };
