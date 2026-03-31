import {
  gameSteps,
  type ExtraRule,
  type GameWithNextStep,
  type NextStep,
} from "@core/domain/types/index.js";
import { isErr, ok, type Result } from "@utils/result.js";
import type { RuleRepository } from "@core/portServerside/ruleRepository.js";
import type { DominoesRepository } from "@core/portServerside/dominoesRepository.js";
import type { ShuffleMethod } from "@core/portServerside/shuffleMethod.js";
import { toExtraRule } from "@core/domain/entities/rule.js";
import { createSeededShuffle } from "@utils/seededShuffle.js";

export type AddExtraRulesUseCase = (
  game: GameWithNextStep,
  rules: string[]
) => Result<GameWithNextStep>;

export const addExtraRulesUseCase =
  (deps: {
    ruleRepository: RuleRepository;
    dominoesRepository: DominoesRepository;
    shuffleMethod: ShuffleMethod;
  }): AddExtraRulesUseCase =>
  (game, rules) => {
    const { ruleRepository, dominoesRepository, shuffleMethod } = deps;
    const availableExtraRules = ruleRepository.getAllExtra();

    const newExtraRules: ExtraRule[] = [];

    for (const rule of rules) {
      const result = toExtraRule(rule, availableExtraRules);

      if (isErr(result)) {
        return result;
      }

      newExtraRules.push(result.value);
    }

    // The Mighty Duel overrides basic rules for 2-player games
    let updatedBasic = game.rules.basic;
    let updatedDominoes = game.dominoes;
    const hasMightyDuel = newExtraRules.some((r) => r.name === "The Mighty Duel");
    if (hasMightyDuel) {
      updatedBasic = {
        ...updatedBasic,
        maxDominoes: 48,
        maxTurns: 12,
        maxKingdomSize: 7,
      };
      // Reload and shuffle all 48 dominoes
      const allDominoes = dominoesRepository.getForMode(game.mode);
      if (allDominoes) {
        const shuffle = game.seed
          ? createSeededShuffle(game.seed, "mighty-duel")
          : shuffleMethod;
        updatedDominoes = shuffle(allDominoes);
      }
    }

    const updatedRules = {
      basic: updatedBasic,
      extra: newExtraRules,
    };

    const next: NextStep = {
      type: "step",
      step: gameSteps.start,
    };

    const updatedGame: GameWithNextStep = {
      ...game,
      dominoes: updatedDominoes,
      rules: updatedRules,
      nextAction: next,
    };

    return ok(updatedGame);
  };
