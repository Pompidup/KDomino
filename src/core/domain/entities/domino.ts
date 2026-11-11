import {
  type Crown,
  type EmptyGround,
  type EmptyTile,
  GROUND,
  type Ground,
  type Tile,
} from "@core/domain/types/domino.js";

const isGround = (ground: unknown): ground is Ground => {
  return GROUND.includes(ground as Ground);
};

export const createTile = (
  ground: Ground | EmptyGround,
  crowns: Crown = 0,
): Tile | EmptyTile => {
  if (isGround(ground)) {
    return { type: ground, crowns } as Tile;
  }
  return { type: ground, crowns: 0 } as EmptyTile;
};

/**
 * Age of Giants letter dominoes (A-F) and their fractional numbers: they sort
 * before every numbered domino (A=0.01 ... F=0.06).
 */
export const LETTER_DOMINO_NUMBERS: ReadonlyMap<number, string> = new Map([
  [0.01, "A"],
  [0.02, "B"],
  [0.03, "C"],
  [0.04, "D"],
  [0.05, "E"],
  [0.06, "F"],
]);

/**
 * Whether a domino number is valid: a positive integer, or exactly one of the
 * fractional numbers of the letter dominoes (any other float is invalid).
 */
export const isValidDominoNumber = (value: unknown): value is number =>
  typeof value === "number" &&
  ((Number.isInteger(value) && value > 0) || LETTER_DOMINO_NUMBERS.has(value));

/**
 * Whether a domino's letter matches its number: a letter domino carries the
 * letter of its fractional number, a numbered domino carries no letter.
 */
export const hasConsistentDominoLetter = (domino: {
  number: number;
  letter?: string;
}): boolean => LETTER_DOMINO_NUMBERS.get(domino.number) === domino.letter;
