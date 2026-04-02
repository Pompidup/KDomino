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
 * Checks whether a domino is a "footprint domino" (has footprint icons on one of its tiles).
 * Footprint dominos trigger the optional sendGiant action.
 */
export const isFootprintDomino = (domino: Domino): boolean =>
  (domino.left.hasFootprint ?? false) || (domino.right.hasFootprint ?? false);
