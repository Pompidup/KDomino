import {
  gameSteps,
  type ExtraRule,
  type GameWithNextStep,
  type NextStep,
} from "@core/domain/types/index.js";
import { isErr, ok, type Result } from "@utils/result.js";
import type { RuleRepository } from "@core/portServerside/ruleRepository.js";
import { toExtraRule } from "@core/domain/entities/rule.js";

export type AddExtraRulesUseCase = (
  game: GameWithNextStep,
  rules: string[]
) => Result<GameWithNextStep>;

export const addExtraRulesUseCase =
  (deps: { ruleRepository: RuleRepository }): AddExtraRulesUseCase =>
  (game, rules) => {
    const { ruleRepository } = deps;
    const availableExtraRules = ruleRepository.getAllExtra();

    const newExtraRules: ExtraRule[] = [];

    for (const rule of rules) {
      const result = toExtraRule(rule, availableExtraRules);

      if (isErr(result)) {
        return result;
      }

      newExtraRules.push(result.value);
    }

    const updatedRules = {
      basic: game.rules.basic,
      extra: newExtraRules,
    };

    const next: NextStep = {
      type: "step",
      step: gameSteps.start,
    };

    const updatedGame: GameWithNextStep = {
      ...game,
      rules: updatedRules,
      nextAction: next,
    };

    return ok(updatedGame);
  };
