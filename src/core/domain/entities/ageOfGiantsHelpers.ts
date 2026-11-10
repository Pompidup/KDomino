import type { Domino } from "@core/domain/types/domino.js";

const AOG_MODE_PREFIX = "AgeOfGiants";

/**
 * Checks whether the given mode name is an Age of Giants mode.
 */
export const isAgeOfGiantsMode = (modeName: string): boolean =>
  modeName.startsWith(AOG_MODE_PREFIX);

/**
 * Checks whether the mode is Age of Giants combined with QueenDomino.
 */
export const isAgeOfGiantsQueenDominoMode = (modeName: string): boolean =>
  modeName === "AgeOfGiants-QueenDomino";

/**
 * Checks whether a domino is a "giant domino" (has a giant icon on one of its tiles).
 * Giant dominos trigger the mandatory placeGiant action.
 */
export const isGiantDomino = (domino: Domino): boolean =>
  (domino.left.hasGiant ?? false) || (domino.right.hasGiant ?? false);

/**
 * Positions (0-based, in the sorted 5-domino line) discarded before selection,
 * per the official Age of Giants rulebook illustration ("Setting up lines of
 * dominoes"): with 2 or 4 players the middle domino (3rd) is discarded, with
 * 3 players the 2nd and 4th. With 5 players nothing is discarded.
 */
const AOG_DISCARD_POSITIONS: Readonly<Record<number, readonly number[]>> = {
  1: [2],
  2: [1, 3],
};

/**
 * Removes the dominoes discarded from a sorted Age of Giants line before the
 * players choose. The line must already be sorted (letter dominoes A-F first,
 * then by number), so giant dominoes can be revealed at any player count.
 */
export const discardFromAgeOfGiantsLine = <T>(
  sortedLine: T[],
  discardCount: number,
): T[] => {
  if (discardCount <= 0) {
    return sortedLine;
  }
  const positions = AOG_DISCARD_POSITIONS[discardCount] ?? [];
  return sortedLine.filter((_, index) => !positions.includes(index));
};

/**
 * Checks whether a domino is a "footprint domino" (has footprint icons on one of its tiles).
 * Footprint dominos trigger the optional sendGiant action.
 */
export const isFootprintDomino = (domino: Domino): boolean =>
  (domino.left.hasFootprint ?? false) || (domino.right.hasFootprint ?? false);
