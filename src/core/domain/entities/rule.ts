import type { ExtraRule } from "@core/domain/types/rule.js";
import { ok, type Result } from "@utils/result.js";

/**
 * Extra rules that replace the 2-player setup with all 48 dominoes and a
 * 7x7 kingdom: "The Mighty Duel" (Kingdomino/Queendomino) and its Origins
 * counterpart "Neolithic".
 */
export const LARGE_KINGDOM_EXTRA_RULES: readonly string[] = [
  "The Mighty Duel",
  "Neolithic",
];

export const isLargeKingdomExtraRule = (rule: ExtraRule): boolean =>
  LARGE_KINGDOM_EXTRA_RULES.includes(rule.name);

/**
 * Checks whether an extra rule can be used for a mode and a player count.
 * `playersLimit` is the exact number of players the rule requires.
 */
export const isExtraRuleAvailable = (
  rule: ExtraRule,
  mode: string,
  numberOfPlayers: number,
): boolean =>
  rule.mode.some((m) => m.name === mode) &&
  (!rule.playersLimit || rule.playersLimit === numberOfPlayers);

/**
 * Returns the extra rules available for a mode and a player count.
 * An empty list is a valid answer (e.g. a mode without optional rules).
 */
export const getAvailablesExtraRules = (
  extraRules: ExtraRule[],
  mode: string,
  numberOfPlayers: number,
): Result<ExtraRule[]> =>
  ok(
    extraRules.filter((rule) =>
      isExtraRuleAvailable(rule, mode, numberOfPlayers),
    ),
  );
