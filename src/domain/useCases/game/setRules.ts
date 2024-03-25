import type { Game, Rule } from "../../entities/game.js";
import { rulesSet } from "./availableRules.js";

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
