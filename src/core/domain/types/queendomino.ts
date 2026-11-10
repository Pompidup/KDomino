import type { BuildersBoard } from "./building.js";
import type { Position } from "./kingdom.js";

/**
 * Complete Queendomino-specific game state.
 * This is stored as an optional field on Game and only present in QueenDomino mode.
 */
export type QueenDominoState = {
  /** The Builders Board with available building tiles */
  buildersBoard: BuildersBoard;
  /** ID of the player currently hosting the Queen, or null */
  queenHolderId: string | null;
  /** Whether the Dragon is available for use this round */
  dragonAvailable: boolean;
  /** Whether the Dragon has been used this round (resets each round) */
  dragonUsedThisRound: boolean;
  /**
   * Kingdom positions of the two squares of the domino the current lord has
   * just placed. Knights may only be placed on these squares. Empty when the
   * lord discarded their domino.
   */
  lastPlacedPositions?: Position[];
};
