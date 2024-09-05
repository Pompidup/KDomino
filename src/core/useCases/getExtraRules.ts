import { getAvailablesExtraRules } from "@core/domain/entities/rule.js";
import type { GameMode } from "@core/domain/types/mode.js";
import type { ExtraRule } from "@core/domain/types/rule.js";
import type { RuleRepository } from "@core/portServerside/ruleRepository.js";
import { err, type Result } from "@utils/result.js";

export type GetExtraRulesUseCase = (
  mode: GameMode["name"],
  players: number
) => Result<ExtraRule[]>;

export const getExtraRulesUseCase =
  (deps: { ruleRepository: RuleRepository }): GetExtraRulesUseCase =>
  (mode: GameMode["name"], players: number): Result<ExtraRule[]> => {
    const { ruleRepository } = deps;

    const allExtraRules = ruleRepository.getAllExtra();

    if (!allExtraRules) {
      return err("No rules found");
    }

    return getAvailablesExtraRules(allExtraRules, mode, players);
  };
