import { isErr } from "../../utils/result.js";
import type { Game, NextStep } from "../../core/domain/types/game.js";
import type { AddExtraRulesCommand } from "../commands/addExtraRulesCommand.js";
import type { AddExtraRulesUseCase } from "../../core/useCases/addExtraRules.js";

type AddExtraRulesHandler = (
  command: AddExtraRulesCommand
) => Game & { nextAction: NextStep };

export const addExtraRulesHandler =
  (useCase: AddExtraRulesUseCase): AddExtraRulesHandler =>
  (command: AddExtraRulesCommand) => {
    const { game, extraRules } = command;

    if (game.nextAction.step !== "options") {
      throw new Error("Invalid next action");
    }

    const result = useCase(game, extraRules);

    if (isErr(result)) {
      throw new Error(result.error);
    }
    return result.value;
  };
