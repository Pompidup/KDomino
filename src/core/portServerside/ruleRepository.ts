import type { ExtraRule, Rules } from "@core/domain/types/rule.js";

export type RuleRepository = {
  getAll: () => Rules;
  getAllExtra: () => ExtraRule[];
};
