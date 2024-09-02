import { isOk } from "../../../utils/result.js";
import { err, isErr, ok, type Result } from "../../../utils/result.js";
import { createTile } from "./domino.js";
import {
  GRIDSIZE,
  type Domino,
  type EmptyTile,
  type Kingdom,
  type Orientation,
  type Position,
  type Rotation,
  type Tile,
} from "../types/index.js";

export const createEmptyKingdom = (): Kingdom => {
  const emptyTile = createTile("empty");
  const grid = Array.from({ length: GRIDSIZE }, () =>
    Array.from({ length: GRIDSIZE }, () => emptyTile)
  );

  return grid;
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
  orientation: Orientation,
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

  if (orientation === "horizontal") {
    if (rotation === 0) {
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
    } else {
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
    }
  } else {
    if (rotation === 0) {
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
    } else {
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
    }
  }

  return [firstTile, secondTile];
};

export const placeDomino = (
  kingdom: Kingdom,
  position: Position,
  orientation: Orientation,
  rotation: Rotation,
  domino: Domino
): Result<Kingdom> => {
  const [firstTile, secondTile] = calculateDominoPosition(
    position,
    orientation,
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
  const xFirstPosition = firstPosition.x;
  const yFirstPosition = firstPosition.y;
  const xSecondPosition = secondPosition.x;
  const ySecondPosition = secondPosition.y;

  const adjacentTiles: Tile[] = [];
  const adjacentTilesKeys = [
    { x: xFirstPosition - 1, y: yFirstPosition },
    { x: xFirstPosition, y: yFirstPosition - 1 },
    { x: xFirstPosition + 1, y: yFirstPosition },
    { x: xFirstPosition, y: yFirstPosition + 1 },
    { x: xSecondPosition - 1, y: ySecondPosition },
    { x: xSecondPosition, y: ySecondPosition - 1 },
    { x: xSecondPosition + 1, y: ySecondPosition },
    { x: xSecondPosition, y: ySecondPosition + 1 },
  ];

  // Remove firstPosition and secondPosition from adjacentTilesKeys
  adjacentTilesKeys.splice(
    adjacentTilesKeys.findIndex((pos) => {
      return pos.x === xFirstPosition && pos.y === yFirstPosition;
    }),
    1
  );

  adjacentTilesKeys.splice(
    adjacentTilesKeys.findIndex((pos) => {
      return pos.x === xSecondPosition && pos.y === ySecondPosition;
    }),
    1
  );

  adjacentTilesKeys.forEach((key) => {
    const tile = getTile(kingdom, key);
    if (isOk(tile)) {
      if (tile.value.type !== "empty") {
        adjacentTiles.push(tile.value);
      }
    }
  });

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
  // Find index of castle
  const castlePosition = kingdom
    .map((row) => row.findIndex((tile) => tile.type === "castle"))
    .find((index) => index !== -1);

  // Count how many tiles not empty are on the left of the castle
  const leftTiles =
    castlePosition !== undefined
      ? kingdom[castlePosition]!.slice(0, castlePosition)
      : [];
  const leftTilesCount = leftTiles.filter(
    (tile) => tile.type !== "empty"
  ).length;

  // Count how many tiles not empty are on the right of the castle
  const rightTiles =
    castlePosition !== undefined
      ? kingdom[castlePosition]!.slice(castlePosition + 1)
      : [];
  const rightTilesCount = rightTiles.filter(
    (tile) => tile.type !== "empty"
  ).length;

  // Count how many tiles not empty are on the top of the castle
  const topTiles =
    castlePosition !== undefined
      ? kingdom[castlePosition]!.slice(0, castlePosition)
      : [];
  const topTilesCount = topTiles.filter((tile) => tile.type !== "empty").length;

  // Count how many tiles not empty are on the bottom of the castle
  const bottomTiles =
    castlePosition != undefined
      ? kingdom[castlePosition]!.slice(castlePosition + 1)
      : [];
  const bottomTilesCount = bottomTiles.filter(
    (tile) => tile.type !== "empty"
  ).length;

  return (
    leftTilesCount === rightTilesCount &&
    topTilesCount === bottomTilesCount &&
    leftTilesCount === topTilesCount
  );
};

export const countDominoes = (kingdom: Kingdom): number => {
  const notEmpties = kingdom.flat().filter((tile) => tile.type !== "empty");
  const totalDominoes = (notEmpties.length - 1) / 2; // -1 because the castle is not a domino
  return totalDominoes;
};

const deepCopyKingdom = (kingdom: Kingdom): Kingdom => {
  return kingdom.map((line) => line.map((tile) => ({ ...tile })));
};
