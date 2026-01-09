import type { Kingdom, Domino } from "@core/domain/types/index.js";

/**
 * Command to get all valid placements for a domino on a kingdom.
 */
export type GetValidPlacementsCommand = {
  /** The kingdom grid to check placements on */
  kingdom: Kingdom;
  /** The domino to find placements for */
  domino: Domino;
};
