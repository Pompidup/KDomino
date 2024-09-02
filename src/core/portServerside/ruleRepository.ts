import type { ExtraRule, Rules } from "../domain/types/rule.js";

export type RuleRepository = {
  getAll: () => Rules;
  getAllExtra: () => ExtraRule[];
};
