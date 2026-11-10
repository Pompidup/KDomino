import {
  isExtraRuleAvailable,
  isLargeKingdomExtraRule,
} from "@core/domain/entities/rule.js";
import { ErrorCode } from "@core/domain/errors/domainErrors.js";
import {
  type ExtraRule,
  type GameWithNextStep,
  gameSteps,
  type NextStep,
} from "@core/domain/types/index.js";
import type { DominoesRepository } from "@core/portServerside/dominoesRepository.js";
import type { RuleRepository } from "@core/portServerside/ruleRepository.js";
import type { ShuffleMethod } from "@core/portServerside/shuffleMethod.js";
import { err, ok, type Result } from "@utils/result.js";
import { createSeededShuffle } from "@utils/seededShuffle.js";

export type AddExtraRulesUseCase = (
  game: GameWithNextStep,
  rules: string[],
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
    const numberOfPlayers = game.players.length;

    for (const rule of rules) {
      const candidates = availableExtraRules.filter((r) => r.name === rule);

      if (candidates.length === 0) {
        return err(ErrorCode.STEP_EXECUTION_FAILED);
      }

      // A rule name may be declared several times (one entry per mode family,
      // e.g. Dynasty): keep the entry matching this mode and player count.
      const extraRule = candidates.find((r) =>
        isExtraRuleAvailable(r, game.mode.name, numberOfPlayers),
      );

      if (!extraRule) {
        return err(ErrorCode.EXTRA_RULE_NOT_AVAILABLE);
      }

      newExtraRules.push(extraRule);
    }

    // The Mighty Duel (Classic/QueenDomino) and Neolithic (Origins) override
    // the 2-player setup: all 48 dominoes, 12 turns and a 7x7 kingdom.
    let updatedBasic = game.rules.basic;
    let updatedDominoes = game.dominoes;
    const hasLargeKingdomRule = newExtraRules.some(isLargeKingdomExtraRule);
    if (hasLargeKingdomRule) {
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
