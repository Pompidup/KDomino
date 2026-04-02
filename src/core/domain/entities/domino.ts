import {
  type Crown,
  type EmptyGround,
  type EmptyTile,
  GROUND,
  type Ground,
  type Tile,
} from "@core/domain/types/domino.js";

const isGround = (ground: unknown): ground is Ground => {
  return GROUND.includes(ground as Ground);
};

export const createTile = (
  ground: Ground | EmptyGround,
  crowns: Crown = 0,
): Tile | EmptyTile => {
  if (isGround(ground)) {
    return { type: ground, crowns } as Tile;
  }
  return { type: ground, crowns: 0 } as EmptyTile;
};
