import type { PlacedBuilding } from "./building.js";
import type { Kingdom, Position } from "./kingdom.js";
import type { ObjectValues } from "./utils.js";

/**
 * Represents a knight placed on a player's kingdom (Queendomino).
 */
export type Knight = {
  /** ID of the player who owns this knight */
  playerId: string;
  /** Position on the kingdom grid where the knight is placed */
  position: Position;
};

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
  /** Number of coins the player has (Queendomino) */
  coins?: number;
  /** Number of towers the player has (Queendomino) */
  towers?: number;
  /** Knights placed on the kingdom (Queendomino) */
  knights?: Knight[];
  /** Buildings placed on the kingdom (Queendomino) */
  buildings?: PlacedBuilding[];
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
  /** Place a knight on the just-placed domino (Queendomino, optional) */
  placeKnight: "placeKnight",
  /** Construct a building on a construction square (Queendomino, optional) */
  constructBuilding: "constructBuilding",
  /** Use the Dragon to burn a building tile (Queendomino, optional) */
  useDragon: "useDragon",
  /** Skip the current optional action (Queendomino) */
  skipOptionalAction: "skipOptionalAction",
} as const;

/** Union type of all player actions */
export type PlayerActions = ObjectValues<typeof playerActions>;
