/**
 * All possible ground/terrain types in Kingdomino.
 * Each type can form contiguous properties for scoring.
 */
export const GROUND = [
  "castle",
  "wheat",
  "forest",
  "sea",
  "plain",
  "swamp",
  "mine",
] as const;

/** Union type of all terrain types */
export type Ground = (typeof GROUND)[number];

/** Special ground type for empty/unplaced tiles */
export type EmptyGround = "empty";

/** Number of crowns on a tile (0-3) */
export type Crown = number;

/**
 * Represents a single tile with terrain and crowns.
 * Two tiles form a domino.
 */
export type Tile = {
  /** The terrain type of this tile */
  type: Ground;
  /** Number of crowns (0-3), multiplier for scoring */
  crowns: Crown;
  /** Whether this tile has a construction square for buildings (Queendomino) */
  hasConstructionSquare?: boolean;
};

/**
 * Represents an empty/unplaced tile on the kingdom grid.
 */
export type EmptyTile = {
  /** Always "empty" for unplaced tiles */
  type: EmptyGround;
  /** Empty tiles have no crowns */
  crowns: 0;
};

/**
 * Represents a domino piece consisting of two connected tiles.
 * Dominoes are the main game pieces that players place on their kingdoms.
 */
export type Domino = {
  /** The left tile of the domino */
  left: Tile;
  /** The right tile of the domino */
  right: Tile;
  /** Unique number identifying this domino (1-48 in Classic mode) */
  number: number;
};

/**
 * Represents a domino that has been revealed for player selection.
 * Contains selection state for the current turn.
 */
export type RevealsDomino = {
  /** The actual domino piece */
  domino: Domino;
  /** Whether this domino has been picked by a lord */
  picked: boolean;
  /** ID of the lord who picked this domino, or null if unpicked */
  lordId: string | null;
  /** Display position in the revealed set (for UI ordering) */
  position: number;
};
