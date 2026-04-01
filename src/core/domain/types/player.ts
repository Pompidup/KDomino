import type { Kingdom } from "./kingdom.js";
import type { ObjectValues } from "./utils.js";

/**
 * Represents a player in the game.
 */
export type Player = {
  /** Unique identifier for the player */
  id: string;
  /** Display name of the player */
  name: string;
  /** The player's kingdom grid where dominoes are placed */
  kingdom: Kingdom;
  /** If set, this player is controlled by a bot with the named strategy */
  bot?: { strategyName: string };
};

/**
 * Payload for creating a new player.
 */
export type PlayerPayload = {
  /** Display name for the player (minimum 3 characters) */
  name: string;
};

/** Array of player creation payloads */
export type PlayersPayload = PlayerPayload[];

/** Array of players */
export type Players = Player[];

/**
 * Available actions a player can perform during their turn.
 */
export const playerActions = {
  /** Place a previously picked domino on the kingdom */
  placeDomino: "placeDomino",
  /** Pick a domino from the revealed set */
  pickDomino: "pickDomino",
  /** Pass/discard when no valid placement exists */
  pass: "pass",
} as const;

/** Union type of all player actions */
export type PlayerActions = ObjectValues<typeof playerActions>;
