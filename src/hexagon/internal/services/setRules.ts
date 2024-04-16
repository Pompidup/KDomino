import type { Game } from "../entities/game.js";
import { type Rule, rulesSet } from "../entities/rule.js";

const setRules = (payload: { state: Game; rules: string[] }): Game => {
  const { state, rules } = payload;
  const rulesToSet = rules
    .map((rule) => rulesSet.find((r) => r.name === rule))
    .filter((rule): rule is Rule => rule !== undefined);

  return {
    ...state,
    rules: rulesToSet,
  };
};

export { setRules };
