import {
  type Domino,
  type EmptyTile,
  GRIDSIZE,
  type Kingdom,
  type Position,
  type Rotation,
  type Tile,
} from "@core/domain/types/index.js";
import {err, isErr, isOk, ok, type Result} from "@utils/result.js";
import {createTile} from "./domino.js";

export const createEmptyKingdom = (): Kingdom => {
  const emptyTile = createTile("empty");
  return Array.from({length: GRIDSIZE}, () =>
      Array.from({length: GRIDSIZE}, () => emptyTile)
  );
};

export const placeCastle = (kingdom: Kingdom): Kingdom => {
  const castle = createTile("castle");
  const newKingdom = deepCopyKingdom(kingdom);
  newKingdom[4]![4] = castle;
  return newKingdom;
};

export const placeTile = (
  kingdom: Kingdom,
  position: Position,
  tile: Tile
): Kingdom => {
  const newKingdom = deepCopyKingdom(kingdom);
  newKingdom[position.y]![position.x] = tile;
  return newKingdom;
};

export const getTile = (
  kingdom: Kingdom,
  position: Position
): Result<Tile | EmptyTile> => {
  const tile = kingdom[position.y]?.[position.x];
  if (!tile) {
    return err("Invalid placement (not fit into the grid)");
  }
  return ok(tile);
};

export const calculateDominoPosition = (
  position: Position,
  rotation: Rotation,
  domino: Domino
): [{ tile: Tile; position: Position }, { tile: Tile; position: Position }] => {
  let firstTile: {
    tile: Tile;
    position: Position;
  };
  let secondTile: {
    tile: Tile;
    position: Position;
  };

  switch (rotation) {
    case 0: // horizontal, left to right
      firstTile = {
        tile: domino.left,
        position: {
          x: position.x,
          y: position.y,
        },
      };
      secondTile = {
        tile: domino.right,
        position: {
          x: position.x + 1,
          y: position.y,
        },
      };
      break;
    case 90: // vertical, top to bottom
      firstTile = {
        tile: domino.left,
        position: {
          x: position.x,
          y: position.y,
        },
      };
      secondTile = {
        tile: domino.right,
        position: {
          x: position.x,
          y: position.y + 1,
        },
      };
      break;
    case 180: // horizontal, right to left
      firstTile = {
        tile: domino.right,
        position: {
          x: position.x,
          y: position.y,
        },
      };
      secondTile = {
        tile: domino.left,
        position: {
          x: position.x + 1,
          y: position.y,
        },
      };
      break;
    case 270: // vertical, bottom to top
      firstTile = {
        tile: domino.right,
        position: {
          x: position.x,
          y: position.y,
        },
      };
      secondTile = {
        tile: domino.left,
        position: {
          x: position.x,
          y: position.y + 1,
        },
      };
      break;
  }

  return [firstTile, secondTile];
};

export const placeDomino = (
  kingdom: Kingdom,
  position: Position,
  rotation: Rotation,
  domino: Domino
): Result<Kingdom> => {
  const [firstTile, secondTile] = calculateDominoPosition(
    position,
    rotation,
    domino
  );

  const isFreePlaceResult = isFreePlace(
    kingdom,
    firstTile.position,
    secondTile.position
  );
  if (isErr(isFreePlaceResult)) {
    return isFreePlaceResult;
  }

  const adjacentTiles = isAdjacent(
    kingdom,
    firstTile.position,
    secondTile.position
  );

  if (adjacentTiles.length === 0) {
    return err("Invalid placement (not adjacent)");
  }

  const hasValidAdjacentTiles = hasValidAdjacent(adjacentTiles, [
    firstTile.tile,
    secondTile.tile,
  ]);

  if (!hasValidAdjacentTiles) {
    return err("Invalid placement (not valid adjacent)");
  }

  return ok(placeTiles(kingdom, [firstTile, secondTile]));
};

const placeTiles = (
  kingdom: Kingdom,
  tiles: { tile: Tile; position: Position }[]
) => {
  let newKingdom = deepCopyKingdom(kingdom);
  for (const { tile, position } of tiles) {
    newKingdom = placeTile(newKingdom, position, tile);
  }
  return newKingdom;
};

const isFreePlace = (
  kingdom: Kingdom,
  firstPosition: Position,
  secondPosition: Position
): Result<boolean> => {
  const firstTile = getTile(kingdom, firstPosition);
  const secondTile = getTile(kingdom, secondPosition);

  if (isErr(firstTile)) {
    return firstTile;
  }

  if (isErr(secondTile)) {
    return secondTile;
  }

  if (firstTile.value.type !== "empty" || secondTile.value.type !== "empty") {
    return err("Invalid placement (not empty)");
  }

  return ok(true);
};

const isAdjacent = (
  kingdom: Kingdom,
  firstPosition: Position,
  secondPosition: Position
): Tile[] => {
  const offsets = [
    { x: -1, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: -1 },
    { x: 0, y: 1 },
  ];

  const isOwnPosition = (x: number, y: number) =>
    (x === firstPosition.x && y === firstPosition.y) ||
    (x === secondPosition.x && y === secondPosition.y);

  const adjacentTiles: Tile[] = [];

  for (const pos of [firstPosition, secondPosition]) {
    for (const offset of offsets) {
      const nx = pos.x + offset.x;
      const ny = pos.y + offset.y;
      if (isOwnPosition(nx, ny)) continue;
      const tile = getTile(kingdom, { x: nx, y: ny });
      if (isOk(tile) && tile.value.type !== "empty") {
        adjacentTiles.push(tile.value);
      }
    }
  }

  return adjacentTiles;
};

const hasValidAdjacent = (
  adjacentTiles: (Tile | EmptyTile)[],
  tiles: Tile[]
): boolean => {
  return adjacentTiles.some((adjacentTile) => {
    return tiles.some((tile) => {
      return tile.type === adjacentTile.type || adjacentTile.type === "castle";
    });
  });
};

export const checkCastleIsInMiddle = (kingdom: Kingdom): boolean => {
  // Find castle coordinates (x, y)
  let castleX: number | undefined;
  let castleY: number | undefined;

  for (let y = 0; y < kingdom.length; y++) {
    const x = kingdom[y]!.findIndex((tile) => tile.type === "castle");
    if (x !== -1) {
      castleX = x;
      castleY = y;
      break;
    }
  }

  if (castleX === undefined || castleY === undefined) {
    return false;
  }

  // Count tiles on the left of the castle (same row, x < castleX)
  const leftTilesCount = kingdom[castleY]!
    .slice(0, castleX)
    .filter((tile) => tile.type !== "empty").length;

  // Count tiles on the right of the castle (same row, x > castleX)
  const rightTilesCount = kingdom[castleY]!
    .slice(castleX + 1)
    .filter((tile) => tile.type !== "empty").length;

  // Count tiles above the castle (same column, y < castleY)
  let topTilesCount = 0;
  for (let y = 0; y < castleY; y++) {
    if (kingdom[y]![castleX]!.type !== "empty") {
      topTilesCount++;
    }
  }

  // Count tiles below the castle (same column, y > castleY)
  let bottomTilesCount = 0;
  for (let y = castleY + 1; y < kingdom.length; y++) {
    if (kingdom[y]![castleX]!.type !== "empty") {
      bottomTilesCount++;
    }
  }

  return (
    leftTilesCount === rightTilesCount &&
    topTilesCount === bottomTilesCount &&
    leftTilesCount === topTilesCount
  );
};

export const countDominoes = (kingdom: Kingdom): number => {
  const notEmpties = kingdom.flat().filter((tile) => tile.type !== "empty");
   // -1 because the castle is not a domino
  return (notEmpties.length - 1) / 2;
};

const deepCopyKingdom = (kingdom: Kingdom): Kingdom => {
  return kingdom.map((line) => line.map((tile) => ({ ...tile })));
};
