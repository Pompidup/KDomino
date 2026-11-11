/**
 * End-of-game ranking: points first, then the tie-break criteria of the game
 * mode's official rules, then a shared position.
 *
 * - Kingdomino (Classic, Mighty Duel, solo) and Age of Giants: "In case of a
 *   tie, the player with the most extended property (whether he owns any
 *   crowns or not) wins the game. If it is still a tie, the player who has
 *   the most crowns wins the game. If there is still a tie anyway, the
 *   players share the victory." The Age of Giants rulebook keeps the scoring
 *   of the base game; crowns covered by a giant do not count.
 * - Kingdomino Origins (every mode): "the player who has the biggest region,
 *   whether it contains fires or not, wins. If there is still a tie, the
 *   player with the most Fire symbols wins. If there is still a tie after
 *   this, the players who are tied share the victory."
 * - Queendomino and Age of Giants + Queendomino: "In the event of a tie, the
 *   player with the largest territory [...] wins. If there is still a tie,
 *   the players share the victory." (no crowns criterion).
 */
import type { Score } from "@core/domain/types/game.js";
import {
  type TiebreakCriterion,
  tiebreakCriteria,
} from "@core/domain/types/score.js";

/** Kingdomino, Age of Giants and Origins: largest territory, then crowns */
export const KINGDOMINO_TIEBREAK_CRITERIA: readonly TiebreakCriterion[] = [
  tiebreakCriteria.largestTerritory,
  tiebreakCriteria.crowns,
];

/** Queendomino (with or without Age of Giants): largest territory only */
export const QUEENDOMINO_TIEBREAK_CRITERIA: readonly TiebreakCriterion[] = [
  tiebreakCriteria.largestTerritory,
];

const QUEENDOMINO_MODES: ReadonlySet<string> = new Set([
  "QueenDomino",
  "AgeOfGiants-QueenDomino",
]);

/**
 * Tie-break criteria of a game mode, in the order they are compared.
 */
export const getTiebreakCriteria = (
  modeName: string,
): readonly TiebreakCriterion[] =>
  QUEENDOMINO_MODES.has(modeName)
    ? QUEENDOMINO_TIEBREAK_CRITERIA
    : KINGDOMINO_TIEBREAK_CRITERIA;

/**
 * Value of a score for one tie-break criterion (higher is better). The crowns
 * criterion reads the fire symbols in Kingdomino Origins (tiles and fire
 * tokens, `fireSymbols`), the crowns counted for scoring otherwise.
 */
export const tiebreakValue = (
  details: Score,
  criterion: TiebreakCriterion,
): number =>
  criterion === tiebreakCriteria.crowns
    ? (details.fireSymbols ?? details.totalCrowns)
    : details.maxPropertiesSize;

/**
 * Index of the first criterion that separates two scores with the same
 * points, or -1 when they are equal on every criterion.
 */
export const firstDifferingCriterion = (
  a: Score,
  b: Score,
  criteria: readonly TiebreakCriterion[],
): number =>
  criteria.findIndex(
    (criterion) => tiebreakValue(a, criterion) !== tiebreakValue(b, criterion),
  );

/**
 * Orders two scores: negative when `a` ranks before `b`, 0 when they share
 * the position.
 */
export const compareScores = (
  a: Score,
  b: Score,
  criteria: readonly TiebreakCriterion[],
): number => {
  if (a.points !== b.points) return b.points - a.points;
  const index = firstDifferingCriterion(a, b, criteria);
  if (index === -1) return 0;
  const criterion = criteria[index]!;
  return tiebreakValue(b, criterion) - tiebreakValue(a, criterion);
};
