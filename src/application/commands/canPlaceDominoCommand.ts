import type { Kingdom, Domino } from "@core/domain/types/index.js";

/**
 * Command to check if a domino can be placed anywhere on a kingdom.
 */
export type CanPlaceDominoCommand = {
  /** The kingdom grid to check */
  kingdom: Kingdom;
  /** The domino to check placement for */
  domino: Domino;
  /** Maximum kingdom size (default: 5, use 7 for Mighty Duel) */
  maxKingdomSize?: number;
};
