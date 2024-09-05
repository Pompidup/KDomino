import {
  gameSteps,
  type ExtraRule,
  type Game,
  type NextStep,
} from "@core/domain/types/index.js";
import { isErr, ok, type Result } from "@utils/result.js";
import type { RuleRepository } from "@core/portServerside/ruleRepository.js";
import { toExtraRule } from "@core/domain/entities/rule.js";

export type AddExtraRulesUseCase = (
  game: Game & { nextAction: NextStep },
  rules: string[]
) => Result<Game & { nextAction: NextStep }>;

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

    const updatedGame: Game & { nextAction: NextStep } = {
      ...game,
      rules: updatedRules,
      nextAction: next,
    };

    return ok(updatedGame);
  };
