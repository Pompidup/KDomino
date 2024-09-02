import {
  GROUND,
  type Crown,
  type EmptyGround,
  type EmptyTile,
  type Ground,
  type Tile,
} from "../types/domino.js";

const isGround = (ground: any): ground is Ground => {
  return GROUND.includes(ground);
};

export const createTile = (
  ground: Ground | EmptyGround,
  crowns: Crown = 0
): Tile | EmptyTile => {
  if (isGround(ground)) {
    return { type: ground, crowns } as Tile;
  }
  return { type: ground, crowns: 0 } as EmptyTile;
};
