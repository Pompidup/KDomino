import type { BasicRules, Rules } from "@core/domain/types/rule.js";
import type { RuleRepository } from "@core/portServerside/ruleRepository.js";
import rulesJson from "../datasources/rules.json" with { type: "json" };

const jsonRules = (): RuleRepository => {
  const rules: Rules = {
    basic: {},
    extraRules: [],
  };

  const commonRules = rulesJson.commun;
  const aogRules = rulesJson.aog;
  const extraRules = rulesJson.extra;

  commonRules.forEach((rule) => {
    rules.basic[rule.playersLimit] = {
      lords: rule.lordsPerPlayer,
      maxDominoes: rule.maxDominoes,
      dominoesPerTurn: rule.dominoesPerTurn,
      maxTurns: rule.maxTurns,
      maxKingdomSize: rule.maxKingdomSize,
    };
  });

  if (aogRules) {
    rules.aogBasic = {};
    aogRules.forEach((rule) => {
      rules.aogBasic![rule.playersLimit] = {
        lords: rule.lordsPerPlayer,
        maxDominoes: rule.maxDominoes,
        dominoesPerTurn: rule.dominoesPerTurn,
        maxTurns: rule.maxTurns,
        maxKingdomSize: rule.maxKingdomSize,
        dominoesDiscardedPerTurn: rule.dominoesDiscardedPerTurn,
      };
    });
  }

  type ModeRuleJson = {
    playersLimit: number;
    lordsPerPlayer: number;
    maxDominoes: number;
    dominoesPerTurn: number;
    maxTurns: number;
    maxKingdomSize: number;
    dominoesDiscardedPerTurn?: number;
  };
  const modeRules: Record<string, ModeRuleJson[]> = rulesJson.modes ?? {};
  for (const [modeName, modeEntries] of Object.entries(modeRules)) {
    rules.modeBasic ??= {};
    const byPlayers: Record<number, BasicRules> = {};
    modeEntries.forEach((rule) => {
      byPlayers[rule.playersLimit] = {
        lords: rule.lordsPerPlayer,
        maxDominoes: rule.maxDominoes,
        dominoesPerTurn: rule.dominoesPerTurn,
        maxTurns: rule.maxTurns,
        maxKingdomSize: rule.maxKingdomSize,
        ...(rule.dominoesDiscardedPerTurn !== undefined && {
          dominoesDiscardedPerTurn: rule.dominoesDiscardedPerTurn,
        }),
      };
    });
    rules.modeBasic[modeName] = byPlayers;
  }

  extraRules.forEach((rule) => {
    rules.extraRules.push({
      name: rule.name,
      description: rule.description,
      mode: rule.mode,
      ...("playersLimit" in rule && { playersLimit: rule.playersLimit }),
    });
  });

  return {
    getAll: () => {
      return rules;
    },
    getAllExtra: () => {
      return rules.extraRules;
    },
  };
};

export default jsonRules;
