import { ErrorCode } from "@core/domain/errors/domainErrors.js";
import {
  type Domino,
  type EmptyTile,
  GRIDSIZE,
  type Kingdom,
  MAX_KINGDOM_SIZE,
  type Position,
  type Rotation,
  type Tile,
} from "@core/domain/types/index.js";
import { err, isErr, isOk, ok, type Result } from "@utils/result.js";
import { createTile } from "./domino.js";

export const createEmptyKingdom = (): Kingdom => {
  const emptyTile = createTile("empty");
  return Array.from({ length: GRIDSIZE }, () =>
    Array.from({ length: GRIDSIZE }, () => emptyTile),
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
  tile: Tile,
): Kingdom => {
  const newKingdom = deepCopyKingdom(kingdom);
  newKingdom[position.y]![position.x] = tile;
  return newKingdom;
};

export const getTile = (
  kingdom: Kingdom,
  position: Position,
): Result<Tile | EmptyTile> => {
  const tile = kingdom[position.y]?.[position.x];
  if (!tile) {
    return err(ErrorCode.PLACEMENT_OUT_OF_BOUNDS);
  }
  return ok(tile);
};

export const calculateDominoPosition = (
  position: Position,
  rotation: Rotation,
  domino: Domino,
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
  domino: Domino,
  maxKingdomSize: number = MAX_KINGDOM_SIZE,
): Result<Kingdom> => {
  const [firstTile, secondTile] = calculateDominoPosition(
    position,
    rotation,
    domino,
  );

  const isFreePlaceResult = isFreePlace(
    kingdom,
    firstTile.position,
    secondTile.position,
  );
  if (isErr(isFreePlaceResult)) {
    return isFreePlaceResult;
  }

  if (
    exceedsMaxSize(
      kingdom,
      firstTile.position,
      secondTile.position,
      maxKingdomSize,
    )
  ) {
    return err(ErrorCode.PLACEMENT_EXCEEDS_KINGDOM_SIZE);
  }

  const adjacentPairs = isAdjacent(kingdom, firstTile, secondTile);

  if (adjacentPairs.length === 0) {
    return err(ErrorCode.PLACEMENT_NOT_ADJACENT);
  }

  if (!hasValidAdjacent(adjacentPairs)) {
    return err(ErrorCode.PLACEMENT_INVALID_TERRAIN);
  }

  return ok(placeTiles(kingdom, [firstTile, secondTile]));
};

const placeTiles = (
  kingdom: Kingdom,
  tiles: { tile: Tile; position: Position }[],
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
  secondPosition: Position,
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
    return err(ErrorCode.PLACEMENT_NOT_EMPTY);
  }

  return ok(true);
};

type AdjacentPair = { neighbor: Tile; own: Tile };

const isAdjacent = (
  kingdom: Kingdom,
  firstTile: { tile: Tile; position: Position },
  secondTile: { tile: Tile; position: Position },
): AdjacentPair[] => {
  const offsets = [
    { x: -1, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: -1 },
    { x: 0, y: 1 },
  ];

  const isOwnPosition = (x: number, y: number) =>
    (x === firstTile.position.x && y === firstTile.position.y) ||
    (x === secondTile.position.x && y === secondTile.position.y);

  const pairs: AdjacentPair[] = [];

  for (const own of [firstTile, secondTile]) {
    for (const offset of offsets) {
      const nx = own.position.x + offset.x;
      const ny = own.position.y + offset.y;
      if (isOwnPosition(nx, ny)) continue;
      const tile = getTile(kingdom, { x: nx, y: ny });
      if (isOk(tile) && tile.value.type !== "empty") {
        pairs.push({ neighbor: tile.value, own: own.tile });
      }
    }
  }

  return pairs;
};

const hasValidAdjacent = (pairs: AdjacentPair[]): boolean => {
  return pairs.some(
    ({ neighbor, own }) =>
      neighbor.type === "castle" || neighbor.type === own.type,
  );
};

export const checkCastleIsInMiddle = (kingdom: Kingdom): boolean => {
  // Find castle coordinates
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

  const bbox = getBoundingBox(kingdom);
  if (!bbox) return false;

  // Castle must be at the exact center of the bounding box
  const centerX = (bbox.minX + bbox.maxX) / 2;
  const centerY = (bbox.minY + bbox.maxY) / 2;

  return castleX === centerX && castleY === centerY;
};

export const getBoundingBox = (
  kingdom: Kingdom,
): { minX: number; maxX: number; minY: number; maxY: number } | null => {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (let y = 0; y < kingdom.length; y++) {
    for (let x = 0; x < kingdom[y]!.length; x++) {
      if (kingdom[y]![x]!.type !== "empty") {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (minX === Infinity) return null;
  return { minX, maxX, minY, maxY };
};

const exceedsMaxSize = (
  kingdom: Kingdom,
  firstPosition: Position,
  secondPosition: Position,
  maxSize: number = MAX_KINGDOM_SIZE,
): boolean => {
  const bbox = getBoundingBox(kingdom);

  let minX = bbox?.minX ?? Infinity;
  let maxX = bbox?.maxX ?? -Infinity;
  let minY = bbox?.minY ?? Infinity;
  let maxY = bbox?.maxY ?? -Infinity;

  for (const pos of [firstPosition, secondPosition]) {
    if (pos.x < minX) minX = pos.x;
    if (pos.x > maxX) maxX = pos.x;
    if (pos.y < minY) minY = pos.y;
    if (pos.y > maxY) maxY = pos.y;
  }

  return maxX - minX + 1 > maxSize || maxY - minY + 1 > maxSize;
};

export const countDominoes = (kingdom: Kingdom): number => {
  const notEmpties = kingdom.flat().filter((tile) => tile.type !== "empty");
  // -1 because the castle is not a domino
  return (notEmpties.length - 1) / 2;
};

const deepCopyKingdom = (kingdom: Kingdom): Kingdom => {
  return kingdom.map((line) => line.map((tile) => ({ ...tile })));
};
