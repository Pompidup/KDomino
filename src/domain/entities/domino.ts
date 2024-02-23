const ground = [
  "castle",
  "wheat",
  "forest",
  "sea",
  "plain",
  "swamp",
  "mine",
] as const;
export type Ground = (typeof ground)[number];

export type Tile = {
  type: Ground;
  crowns: number;
};

export type EmptyTile = {
  type: "empty";
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
  kingId: string | null;
  position: number;
};

// Each domino has two tiles
// Each tile has a type and a number of crowns
// Each domino has a cost
// Cost is unique for all collection of dominos
// Cost is more elevated if the combination of tiles is more powerful
