import {
  InvalidStepError,
  StepExecutionError,
} from "../../core/domain/errors/domainErrors.js";
import type { Game, NextStep } from "../../core/domain/types/game.js";
import type { AddExtraRulesUseCase } from "../../core/useCases/addExtraRules.js";
import { isErr } from "../../utils/result.js";
import type { AddExtraRulesCommand } from "../commands/addExtraRulesCommand.js";

type AddExtraRulesHandler = (
  command: AddExtraRulesCommand
) => Game & { nextAction: NextStep };

export const addExtraRulesHandler =
  (useCase: AddExtraRulesUseCase): AddExtraRulesHandler =>
  (command: AddExtraRulesCommand) => {
    const { game, extraRules } = command;

    if (game.nextAction.step !== "options") {
      throw new InvalidStepError("Required game with options step");
    }

    const result = useCase(game, extraRules);

    if (isErr(result)) {
      throw new StepExecutionError(result.error);
    }
    return result.value;
  };
