import type { RevealsDomino } from "@core/domain/types/domino.js";
import type { Game } from "@core/domain/types/game.js";
import type { Lord } from "@core/domain/types/lord.js";

/*
 * Kingdomino Origins — "Neolithic" (special two player rules).
 *
 * Official rulebook (Blue Orange, 2021, "Special two player rules -
 * Neolithic", During Turns): "the player whose chief was drawn first chooses
 * to take dominos 1 and 4 OR 2 and 3 (in the column, from the top). The other
 * player takes the 2 remaining dominoes. Each player carries out the actions
 * Place your domino and Choose a new domino, twice, once for each of their
 * tribe chiefs."
 *
 * The engine applies it to every line of 4 dominoes: the first lord to pick
 * in the line chooses the pair through its own pick (picking the domino at
 * position 1 or 4 takes the pair 1 & 4, position 2 or 3 the pair 2 & 3). The
 * pair is reserved for that lord's player (`reservedFor`), the two remaining
 * dominoes for the opponent. Every lord then picks, in the usual order, one
 * of the dominoes reserved for its player.
 */

/** Name of the Origins extra rule. */
export const NEOLITHIC_RULE_NAME = "Neolithic";

/** The two pairs of positions (1-based, in the sorted line) of the rule. */
export const NEOLITHIC_PAIRS: readonly (readonly [number, number])[] = [
  [1, 4],
  [2, 3],
];

/** Number of dominoes of a line the pair rule applies to. */
const NEOLITHIC_LINE_SIZE = 4;

/** Whether the Neolithic optional rule is active in a 2-player game. */
export const isNeolithicGame = (game: Game): boolean =>
  game.players.length === 2 &&
  game.rules.extra.some((rule) => rule.name === NEOLITHIC_RULE_NAME);

/** The pair of positions that contains `position`, if any. */
export const neolithicPairOf = (
  position: number,
): readonly [number, number] | undefined =>
  NEOLITHIC_PAIRS.find((pair) => pair.includes(position));

/**
 * Whether the next pick of the line chooses the pair: Neolithic game, a full
 * line of 4 dominoes, none picked nor reserved yet.
 */
export const isNeolithicPairChoice = (
  game: Game,
  line: RevealsDomino[],
): boolean =>
  isNeolithicGame(game) &&
  line.length === NEOLITHIC_LINE_SIZE &&
  line.every((domino) => !domino.picked && domino.reservedFor === undefined);

/**
 * Whether `lord` may pick `domino`: not picked yet and, in Neolithic, not
 * reserved for the other player.
 */
export const canLordPickRevealed = (
  lord: Lord,
  domino: RevealsDomino,
): boolean =>
  !domino.picked &&
  (domino.reservedFor === undefined || domino.reservedFor === lord.playerId);

/**
 * Reserves the dominoes of the line when `pickedNumber` is the pair choice of
 * a Neolithic line: the pair of the picked domino for the lord's player, the
 * other pair for the opponent. Returns the line unchanged otherwise.
 */
export const reserveNeolithicPairs = (
  game: Game,
  line: RevealsDomino[],
  lord: Lord,
  pickedNumber: number,
): RevealsDomino[] => {
  if (!isNeolithicPairChoice(game, line)) return line;

  const picked = line.find((domino) => domino.domino.number === pickedNumber);
  const pair = picked && neolithicPairOf(picked.position);
  const opponent = game.players.find((player) => player.id !== lord.playerId);
  if (!pair || !opponent) return line;

  return line.map((domino) => ({
    ...domino,
    reservedFor: pair.includes(domino.position) ? lord.playerId : opponent.id,
  }));
};

/**
 * Numbers of the dominoes of the current line `lord` may pick (Neolithic
 * reservations included), in line order.
 */
export const pickableDominoNumbers = (
  line: RevealsDomino[],
  lord: Lord,
): number[] =>
  line
    .filter((domino) => canLordPickRevealed(lord, domino))
    .map((domino) => domino.domino.number);
