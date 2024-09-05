import type { ExtraRule } from "@core/domain/types/rule.js";
import { ok, err, type Result } from "@utils/result.js";

export const getAvailablesExtraRules = (
  extraRules: ExtraRule[],
  mode: string,
  numberOfPlayers: number
): Result<ExtraRule[]> => {
  const availableExtraRules = extraRules.filter((rule) => {
    return (
      rule.mode.filter((m) => m.name === mode).length > 0 &&
      (!rule.playersLimit || rule.playersLimit === numberOfPlayers)
    );
  });

  if (availableExtraRules.length === 0) {
    return err("No extra rules found");
  }

  return ok(availableExtraRules);
};

export const toExtraRule = (
  rule: string,
  extraRules: ExtraRule[]
): Result<ExtraRule> => {
  const foundRule = extraRules.find((r) => r.name === rule);

  if (!foundRule) {
    return err(`Rule not found: ${rule}`);
  }

  return ok(foundRule);
};
