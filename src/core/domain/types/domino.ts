export const GROUND = [
  "castle",
  "wheat",
  "forest",
  "sea",
  "plain",
  "swamp",
  "mine",
] as const;

export type Ground = (typeof GROUND)[number];
export type EmptyGround = "empty";

export type Crown = number;

export type Tile = {
  type: Ground;
  crowns: Crown;
};

export type EmptyTile = {
  type: EmptyGround;
  crowns: 0;
};

export type Domino = {
  left: Tile;
  right: Tile;
  number: number;
};

export type RevealsDomino = {
  domino: Domino;
  picked: boolean;
  lordId: string | null;
  position: number;
};
