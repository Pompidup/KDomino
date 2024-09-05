import type { AddExtraRulesCommand } from "@application/commands/addExtraRulesCommand.js";
import {
  InvalidStepError,
  StepExecutionError,
} from "@core/domain/errors/domainErrors.js";
import {
  isGameWithNextStep,
  type GameWithNextStep,
} from "@core/domain/types/game.js";
import type { AddExtraRulesUseCase } from "@core/useCases/addExtraRules.js";
import { isErr } from "@utils/result.js";

type AddExtraRulesHandler = (command: AddExtraRulesCommand) => GameWithNextStep;

export const addExtraRulesHandler =
  (useCase: AddExtraRulesUseCase): AddExtraRulesHandler =>
  (command: AddExtraRulesCommand) => {
    const { game, extraRules } = command;

    if (!isGameWithNextStep(game)) {
      throw new InvalidStepError("Required game with nextAction type: 'step'");
    }

    if (game.nextAction.step !== "options") {
      throw new InvalidStepError("Required game with options step");
    }

    const result = useCase(game, extraRules);

    if (isErr(result)) {
      throw new StepExecutionError(result.error);
    }
    return result.value;
  };
