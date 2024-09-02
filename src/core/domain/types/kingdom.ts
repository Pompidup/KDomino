import type { EmptyTile, Tile } from "./domino.js";

export type Position = {
  x: number; // cols
  y: number; // rows
};

export type Orientation = "vertical" | "horizontal";

export type Rotation = 0 | 180;

export type Kingdom = (Tile | EmptyTile)[][];

export const GRIDSIZE = 9;
