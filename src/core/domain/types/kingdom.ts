import type { EmptyTile, Tile } from "./domino.js";

export type Position = {
  x: number; // cols
  y: number; // rows
};

export type Rotation = 0 | 90 | 180 | 270;

export type Kingdom = (Tile | EmptyTile)[][];

export const GRIDSIZE = 9;
