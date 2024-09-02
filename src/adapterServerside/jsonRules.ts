import type { Rules } from "../core/domain/types/rule.js";
import rulesJson from "../datasources/rules.json" assert { type: "json" };
import type { RuleRepository } from "../core/portServerside/ruleRepository.js";

const jsonRules = (): RuleRepository => {
  const rules: Rules = {
    basic: {},
    extraRules: [],
  };

  const commonRules = rulesJson.commun;
  const extraRules = rulesJson.extra;

  commonRules.forEach((rule) => {
    rules.basic[rule.playersLimit] = {
      lords: rule.lordsPerPlayer,
      maxDominoes: rule.maxDominoes,
      dominoesPerTurn: rule.dominoesPerTurn,
      maxTurns: rule.maxTurns,
    };
  });

  extraRules.forEach((rule) => {
    rules.extraRules.push({
      name: rule.name,
      description: rule.description,
      mode: rule.mode,
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
