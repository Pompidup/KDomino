import type { GetExtraRulesCommand } from "../commands/getExtraRulesCommand.js";
import { isErr } from "../../utils/result.js";
import type { ExtraRule } from "../../core/domain/types/rule.js";
import type { GetExtraRulesUseCase } from "../../core/useCases/getExtraRules.js";

type GetExtraRulesHandler = (command: GetExtraRulesCommand) => ExtraRule[];

export const getExtraRulesHandler =
  (getExtraRulesUseCase: GetExtraRulesUseCase): GetExtraRulesHandler =>
  (command: GetExtraRulesCommand) => {
    const { mode, players } = command;
    const result = getExtraRulesUseCase(mode, players);

    if (isErr(result)) {
      throw new Error(result.error);
    }

    return result.value;
  };
