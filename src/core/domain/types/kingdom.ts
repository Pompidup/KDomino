import type { EmptyTile, Tile } from "./domino.js";

/**
 * Represents a position on the kingdom grid.
 * Origin (0,0) is at the top-left corner.
 */
export type Position = {
  /** Column index (0-8, left to right) */
  x: number;
  /** Row index (0-8, top to bottom) */
  y: number;
};

/**
 * Rotation angle for domino placement.
 * - 0: Horizontal, left tile at position, right tile to the east
 * - 90: Vertical, left tile at position, right tile to the south
 * - 180: Horizontal, right tile at position, left tile to the east
 * - 270: Vertical, right tile at position, left tile to the south
 */
export type Rotation = 0 | 90 | 180 | 270;

/**
 * Represents a player's kingdom as a 2D grid of tiles.
 * The grid is 9x9 to allow for the 5x5 maximum kingdom size
 * with the castle at any position.
 */
export type Kingdom = (Tile | EmptyTile)[][];

/**
 * The size of the kingdom grid (9x9).
 * This allows for a 5x5 kingdom with the castle placed anywhere.
 */
export const GRIDSIZE = 9;
