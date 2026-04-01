import type { BuildersBoard } from "./building.js";

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
};
