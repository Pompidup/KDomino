import type { Kingdom, Position } from "@core/domain/types/kingdom.js";
import type { Knight, Player } from "@core/domain/types/player.js";
import { addCoins, getMaxKnights } from "./economy.js";

/**
 * Count construction squares in the contiguous territory containing the given position.
 * Uses BFS flood-fill on same terrain type.
 *
 * No longer used for the knight tax, which counts every square of the
 * territory (see `calculateKnightTax`).
 */
export const countConstructionSquaresInTerritory = (
  kingdom: Kingdom,
  position: Position,
): number => {
  const rows = kingdom.length;
  const cols = kingdom[0]?.length ?? 0;
  const startTile = kingdom[position.y]?.[position.x];

  if (!startTile || startTile.type === "empty" || startTile.type === "castle") {
    return 0;
  }

  const terrainType = startTile.type;
  const visited: boolean[][] = kingdom.map((row) => row.map(() => false));
  const queue: [number, number][] = [[position.x, position.y]];
  visited[position.y]![position.x] = true;
  let count = 0;

  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  while (queue.length > 0) {
    const [cx, cy] = queue.pop()!;
    const tile = kingdom[cy]![cx]!;

    if (
      tile.type !== "empty" &&
      tile.type !== "castle" &&
      "hasConstructionSquare" in tile &&
      tile.hasConstructionSquare
    ) {
      count++;
    }

    for (const [dx, dy] of directions) {
      const nx = cx + (dx as number);
      const ny = cy + (dy as number);
      if (
        nx >= 0 &&
        ny >= 0 &&
        nx < cols &&
        ny < rows &&
        !visited[ny]![nx] &&
        kingdom[ny]![nx]!.type === terrainType
      ) {
        visited[ny]![nx] = true;
        queue.push([nx, ny]);
      }
    }
  }

  return count;
};

/**
 * Number of squares of the territory containing `position` (the contiguous
 * group of same-terrain squares, BFS flood-fill), the castle excluded.
 *
 * Official rule (action B): the knight "immediately collect[s] a Coin value
 * equal to the number of connecting squares in the territory your Knight was
 * placed on".
 */
export const countTerritorySquares = (
  kingdom: Kingdom,
  position: Position,
): number => {
  const startTile = kingdom[position.y]?.[position.x];
  if (!startTile || startTile.type === "empty" || startTile.type === "castle") {
    return 0;
  }

  const rows = kingdom.length;
  const cols = kingdom[0]?.length ?? 0;
  const terrain = startTile.type;
  const visited: boolean[][] = kingdom.map((row) => row.map(() => false));
  const queue: [number, number][] = [[position.x, position.y]];
  visited[position.y]![position.x] = true;
  let count = 0;

  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  while (queue.length > 0) {
    const [cx, cy] = queue.pop()!;
    count++;

    for (const [dx, dy] of directions) {
      const nx = cx + (dx as number);
      const ny = cy + (dy as number);
      if (
        nx >= 0 &&
        ny >= 0 &&
        nx < cols &&
        ny < rows &&
        !visited[ny]![nx] &&
        kingdom[ny]![nx]!.type === terrain
      ) {
        visited[ny]![nx] = true;
        queue.push([nx, ny]);
      }
    }
  }

  return count;
};

/**
 * Tax collected by a knight placed at `position`: the size of its territory.
 */
export const calculateKnightTax = (
  kingdom: Kingdom,
  position: Position,
): number => countTerritorySquares(kingdom, position);

/**
 * Whether the player still has a knight to place: fewer knights placed than
 * the knights they own (`getMaxKnights`: the starting knight plus the knights
 * granted by building bonuses).
 */
export const hasKnightAvailable = (player: Player): boolean =>
  (player.knights ?? []).length < getMaxKnights(player);

/**
 * Whether a knight can be placed at `position`.
 *
 * Official Queendomino rule (action B, "Have 1 or 2 Knights collect tax on
 * the domino you just placed"):
 * - the player must still have a knight available: the starting knight plus
 *   the knights granted by building bonuses (`getMaxKnights`), minus the
 *   knights already placed;
 * - the knight goes on the domino just added: when `allowedPositions` is given
 *   (the squares of that domino), the position must be one of them;
 * - one knight per square of that domino ("up to 2 Knights during your turn,
 *   one for each square on the domino"): a square holding a knight is refused;
 * - several knights may tax the same territory ("You may place a Knight on a
 *   territory where other Knights have been placed in previous rounds").
 */
export const canPlaceKnight = (
  player: Player,
  kingdom: Kingdom,
  position: Position,
  allowedPositions?: Position[],
): boolean => {
  if (!hasKnightAvailable(player)) return false;
  const knights = player.knights ?? [];

  if (
    allowedPositions !== undefined &&
    !allowedPositions.some((p) => p.x === position.x && p.y === position.y)
  ) {
    return false;
  }

  const tile = kingdom[position.y]?.[position.x];
  if (!tile || tile.type === "empty" || tile.type === "castle") return false;

  if (
    knights.some(
      (k) => k.position.x === position.x && k.position.y === position.y,
    )
  ) {
    return false;
  }

  return true;
};

export const placeKnight = (
  player: Player,
  kingdom: Kingdom,
  position: Position,
): Player => {
  const knight: Knight = { playerId: player.id, position };
  const knights = [...(player.knights ?? []), knight];
  const taxAmount = calculateKnightTax(kingdom, position);
  const updatedPlayer = addCoins({ ...player, knights }, taxAmount);

  return updatedPlayer;
};
