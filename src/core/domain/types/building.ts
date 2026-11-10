import type { Position } from "./kingdom.js";

/**
 * Types of immediate bonuses a building can grant when constructed.
 */
export type ImmediateBonusType = "coins" | "tower" | "knight";

/**
 * Immediate bonus granted when a building is constructed.
 */
export type ImmediateBonus = {
  type: ImmediateBonusType;
  amount: number;
};

/**
 * Types of end-game scoring conditions for buildings.
 */
export type EndGameScoringType =
  | "perTerrain" // Points per tile of a specific terrain type
  | "perBuilding" // Points per building in the kingdom
  | "perTower" // Points per tower owned
  | "perCrown" // Points per crown in the kingdom
  | "flat"; // Flat bonus points

/**
 * End-game scoring rule for a building.
 */
export type EndGameScoring = {
  type: EndGameScoringType;
  /** Terrain type (only for perTerrain) */
  terrain?: string;
  /** Points per matching element */
  points: number;
};

/**
 * Represents a building tile that can be purchased and placed on a construction square.
 */
export type BuildingTile = {
  /** Unique identifier */
  id: number;
  /** Display name */
  name: string;
  /**
   * Intrinsic cost of the tile. On a Builders Board with `slotCosts` (every
   * game started since the official 6-spot board), the price is carried by
   * the spot the tile occupies instead (see `BuildersBoard.slotCosts`); this
   * value is only used by boards without `slotCosts` (older saved games).
   */
  cost: number;
  /** Immediate bonus when constructed (optional) */
  immediateBonus?: ImmediateBonus;
  /** Permanent crowns added to the territory */
  crowns: number;
  /** Towers granted by this building */
  towers: number;
  /** End-game scoring condition (optional) */
  endGameScoring?: EndGameScoring;
};

/**
 * A slot on the Builders Board that may hold a building tile.
 */
export type BuildingSlot = BuildingTile | null;

/**
 * The Builders Board holding available building tiles for purchase.
 *
 * Official board: 6 spots whose construction cost is printed below them
 * (5, 4, 3, 2, 1 and 0 coins, from the draw pile to the cheapest spot). At
 * each new round the remaining tiles slide to the cheapest spots and the
 * empty spots are filled from the draw pile.
 */
export type BuildersBoard = {
  /**
   * Visible building tiles available for purchase, one per spot (6 spots; 4 in
   * games started before the official board). `null` is an empty spot.
   */
  slots: BuildingSlot[];
  /** Remaining building tiles in the draw pile */
  drawPile: BuildingTile[];
  /**
   * Construction cost of each spot, aligned with `slots` (`[5, 4, 3, 2, 1, 0]`).
   * Absent in games started before the official board: the price is then the
   * tile's own `cost`.
   */
  slotCosts?: number[];
};

/**
 * A building that has been placed on a player's kingdom.
 */
export type PlacedBuilding = {
  /** The building tile that was placed */
  building: BuildingTile;
  /** Position on the kingdom grid */
  position: Position;
};
