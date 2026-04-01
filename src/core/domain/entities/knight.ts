import type { Kingdom, Position } from "@core/domain/types/kingdom.js";
import type { Knight, Player } from "@core/domain/types/player.js";
import { addCoins, MAX_KNIGHTS } from "./economy.js";

/**
 * Count construction squares in the contiguous territory containing the given position.
 * Uses BFS flood-fill on same terrain type.
 */
export const countConstructionSquaresInTerritory = (
  kingdom: Kingdom,
  position: Position,
): number => {
  const rows = kingdom.length;
  const cols = kingdom[0]?.length ?? 0;
  const startTile = kingdom[position.y]?.[position.x];

  if (
    !startTile ||
    startTile.type === "empty" ||
    startTile.type === "castle"
  ) {
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
 * Get the terrain type at a position to identify the territory.
 */
const getTerritoryTerrain = (
  kingdom: Kingdom,
  position: Position,
): string | null => {
  const tile = kingdom[position.y]?.[position.x];
  if (!tile || tile.type === "empty" || tile.type === "castle") return null;
  return tile.type;
};

/**
 * Check if a territory (identified by BFS from position) already has a knight.
 */
const territoryHasKnight = (
  kingdom: Kingdom,
  position: Position,
  knights: Knight[],
): boolean => {
  const terrain = getTerritoryTerrain(kingdom, position);
  if (!terrain) return false;

  // BFS to find all positions in this territory
  const rows = kingdom.length;
  const cols = kingdom[0]?.length ?? 0;
  const visited: boolean[][] = kingdom.map((row) => row.map(() => false));
  const queue: [number, number][] = [[position.x, position.y]];
  visited[position.y]![position.x] = true;
  const territoryPositions = new Set<string>();

  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  while (queue.length > 0) {
    const [cx, cy] = queue.pop()!;
    territoryPositions.add(`${cx},${cy}`);

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

  return knights.some((k) =>
    territoryPositions.has(`${k.position.x},${k.position.y}`),
  );
};

export const canPlaceKnight = (
  player: Player,
  kingdom: Kingdom,
  position: Position,
): boolean => {
  const knights = player.knights ?? [];
  if (knights.length >= MAX_KNIGHTS) return false;

  const tile = kingdom[position.y]?.[position.x];
  if (!tile || tile.type === "empty" || tile.type === "castle") return false;

  if (territoryHasKnight(kingdom, position, knights)) return false;

  return true;
};

export const placeKnight = (
  player: Player,
  kingdom: Kingdom,
  position: Position,
): Player => {
  const knight: Knight = { playerId: player.id, position };
  const knights = [...(player.knights ?? []), knight];
  const taxAmount = countConstructionSquaresInTerritory(kingdom, position);
  const updatedPlayer = addCoins({ ...player, knights }, taxAmount);

  return updatedPlayer;
};
