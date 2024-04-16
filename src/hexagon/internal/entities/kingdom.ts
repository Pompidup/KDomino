import type { Domino, Tile, EmptyTile } from "./domino.js";

export type Position = {
  x: number; // cols
  y: number; // rows
};

export type Orientation = "vertical" | "horizontal";

export type Rotation = 0 | 180;

export type Kingdom = (Tile | EmptyTile)[][];

const createEmptyKingdom = (): Kingdom => {
  const gridSize = 9;
  const emptyTile: EmptyTile = { type: "empty", crowns: 0 };

  return Array.from({ length: gridSize }, () =>
    Array.from({ length: gridSize }, () => emptyTile)
  );
};

const createKingdomWithCastle = (): Kingdom => {
  const kingdom = createEmptyKingdom();
  return placeTile(kingdom, { x: 4, y: 4 }, { type: "castle", crowns: 0 });
};

const placeTile = (
  kingdom: Kingdom,
  position: Position,
  tile: Tile
): Kingdom => {
  const newRow = [...kingdom[position.y]!];
  newRow[position.x] = tile;
  return [
    ...kingdom.slice(0, position.y),
    newRow,
    ...kingdom.slice(position.y + 1),
  ];
};

const getTile = (grid: Kingdom, position: Position): Tile | EmptyTile => {
  const tile = grid[position.y]?.[position.x];
  if (tile === undefined) {
    throw new Error("Invalid placement (not fit into the grid)");
  }
  return tile;
};

const calculateDominoPosition = (
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

const placeDomino = (
  kingdom: Kingdom,
  position: Position,
  orientation: "vertical" | "horizontal",
  rotation: 0 | 180,
  domino: Domino
): Kingdom => {
  const [firstTile, secondTile] = calculateDominoPosition(
    position,
    orientation,
    rotation,
    domino
  );

  if (!isFreePlace(kingdom, firstTile.position, secondTile.position)) {
    throw new Error("Invalid placement (not free place)");
  }

  if (!isFitIntoTheGrid(kingdom, [firstTile, secondTile])) {
    throw new Error("Invalid placement (not fit into the grid)");
  }

  const adjacentTiles = isAdjacent(
    kingdom,
    firstTile.position,
    secondTile.position
  );

  if (adjacentTiles.length === 0) {
    throw new Error("Invalid placement (no adjacent)");
  }

  const hasValidAdjacentTiles = hasValidAdjacent(adjacentTiles, [
    firstTile.tile,
    secondTile.tile,
  ]);

  if (!hasValidAdjacentTiles) {
    throw new Error("Invalid placement (no valid adjacent)");
  }

  return placeTiles(kingdom, [firstTile, secondTile]);
};

const placeTiles = (
  kingdom: Kingdom,
  tiles: { tile: Tile; position: Position }[]
): Kingdom => {
  return tiles.reduce(
    (newKingdom, { tile, position }) => placeTile(newKingdom, position, tile),
    kingdom
  );
};

const isFreePlace = (
  kingdom: Kingdom,
  firstPosition: Position,
  secondPosition: Position
): boolean => {
  const firstTile = getTile(kingdom, firstPosition);
  const secondTile = getTile(kingdom, secondPosition);

  if (firstTile.type !== "empty" || secondTile.type !== "empty") {
    return false;
  }

  return true;
};

const isAdjacent = (
  kingdom: Kingdom,
  firstPosition: Position,
  secondPosition: Position
): (Tile | EmptyTile)[] => {
  const xFirstPosition = firstPosition.x;
  const yFirstPosition = firstPosition.y;
  const xSecondPosition = secondPosition.x;
  const ySecondPosition = secondPosition.y;

  const adjacentTiles: (Tile | EmptyTile)[] = [];
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
    if (tile) {
      adjacentTiles.push(tile);
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

const isFitIntoTheGrid = (
  grid: Kingdom,
  positions: {
    tile: Tile;
    position: Position;
  }[]
): boolean => {
  const maxSize = 5;

  const simulateNewGrid = [...grid];

  simulateNewGrid[positions[0]!.position.y]![positions[0]!.position.x] =
    positions[0]!.tile;
  simulateNewGrid[positions[1]!.position.y]![positions[1]!.position.x] =
    positions[1]!.tile;

  const lines = simulateNewGrid.map((line) =>
    line.filter((tile) => tile.type !== "empty")
  );
  const columns = simulateNewGrid[0]!.map((_, index) =>
    simulateNewGrid
      .map((line) => line[index])
      .filter((tile) => tile?.type !== "empty")
  );

  const linesLength = lines.map((line) => line.length);
  const columnsLength = columns.map((line) => line.length);

  const maxLineLength = Math.max(...linesLength);
  const maxColumnLength = Math.max(...columnsLength);

  if (maxLineLength > maxSize || maxColumnLength > maxSize) {
    return false;
  }

  return true;
};

const kingdom = {
  createEmptyKingdom,
  createKingdomWithCastle,
  getTile,
  placeDomino,
};

export default kingdom;
