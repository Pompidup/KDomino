import { err, type Result } from "../../utils/result.js";
import type { ExtraRule } from "../domain/types/rule.js";
import { getAvailablesExtraRules } from "../domain/entities/rule.js";
import type { GameMode } from "../domain/types/mode.js";
import type { RuleRepository } from "../portServerside/ruleRepository.js";

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
