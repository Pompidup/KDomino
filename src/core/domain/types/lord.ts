import type { Domino } from "./domino.js";

/**
 * Represents a lord (player token) used for turn order and domino selection.
 * In games with 2 players, each player has 2 lords.
 * In games with 3-4 players, each player has 1 lord.
 */
export type Lord = {
  /** Unique identifier for this lord */
  id: string;
  /** ID of the player who owns this lord */
  playerId: string;
  /** Whether this lord has finished their turn */
  turnEnded: boolean;
  /** Whether this lord has picked a domino this round */
  hasPick: boolean;
  /** Whether this lord has placed/discarded a domino this round */
  hasPlace: boolean;
  /** The domino this lord picked (if any) */
  dominoPicked?: Domino;
};
