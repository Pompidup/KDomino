/**
 * Ranking of the players: points first, then the tie-break criteria of the
 * game mode's official rules, then a shared position. The single ranking code
 * of the engine: `getResults` ranks the final scores, `getLiveRanking` the
 * live scores (provisional during the game, final once it is over).
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
import type {
  FinalResult,
  Game,
  Score,
  ScoreResult,
} from "@core/domain/types/game.js";
import {
  type PlayerScore,
  type TiebreakCriterion,
  tiebreakCriteria,
} from "@core/domain/types/score.js";
import { computePlayerScore, isGameOver } from "./scoreBreakdown.js";

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

/**
 * Ranks scored players: by points, then by the tie-break criteria of the game
 * mode (`getTiebreakCriteria`; default: Kingdomino, largest territory then
 * crowns). Players equal on points and on every criterion share the
 * position. Each result tells which criterion ranked it among the players
 * with the same points (`tiebreaker`) and whether it shares its position
 * (`tied`).
 */
export const rankScoreResults = (
  scoreResult: ScoreResult[],
  criteria: readonly TiebreakCriterion[] = KINGDOMINO_TIEBREAK_CRITERIA,
): FinalResult[] => {
  const sorted = [...scoreResult].sort((a, b) =>
    compareScores(a.details, b.details, criteria),
  );

  const lastCriterion = criteria.length - 1;
  const result: FinalResult[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i]!;
    const previous = result[i - 1];
    const position =
      previous &&
      compareScores(previous.details, current.details, criteria) === 0
        ? previous.position
        : i + 1;

    // Deepest criterion compared against the players with the same points
    let deepest = -1;
    let tied = false;
    for (const other of sorted) {
      if (
        other === current ||
        other.details.points !== current.details.points
      ) {
        continue;
      }
      const index = firstDifferingCriterion(
        current.details,
        other.details,
        criteria,
      );
      if (index === -1) tied = true;
      deepest = Math.max(deepest, index === -1 ? lastCriterion : index);
    }

    result.push({
      ...current,
      position,
      tiebreaker: criteria[deepest] ?? null,
      tied,
    });
  }

  return result;
};

/**
 * Ranking entry of a scored player: the tie-break values of its score
 * (`details`) and its breakdown.
 */
export const toScoreResult = (score: PlayerScore): ScoreResult => ({
  playerId: score.playerId,
  playerName: score.playerName,
  details: {
    points: score.points,
    maxPropertiesSize: score.maxPropertiesSize,
    totalCrowns: score.totalCrowns,
    ...(score.fireSymbols !== undefined && {
      fireSymbols: score.fireSymbols,
    }),
  },
  breakdown: score.breakdown,
});

/**
 * Ranks every player of a game: each player is scored with the mode-aware
 * score breakdown (`computePlayerScore`, the computation of
 * `calculatePlayerScore`), then ranked by `rankScoreResults` with the
 * tie-break criteria of the mode.
 *
 * @param final - `true` to rank the final scores (end of the game), `false`
 * for the live scores; default: final once the game is over (`isGameOver`),
 * like `calculatePlayerScore`.
 */
export const rankPlayers = (
  game: Game,
  final: boolean = isGameOver(game),
): FinalResult[] =>
  rankScoreResults(
    game.players.map((player) =>
      toScoreResult(computePlayerScore(game, player, final)),
    ),
    getTiebreakCriteria(game.mode.name),
  );
