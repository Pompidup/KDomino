import type { PlacedBuilding } from "@core/domain/types/building.js";
import type { Kingdom, Position } from "@core/domain/types/kingdom.js";
import type { Player } from "@core/domain/types/player.js";
import { getTowerCount } from "./economy.js";

/**
 * Determine which player should hold the Queen.
 * The player with the most towers gets the Queen.
 * If tied, the Queen doesn't move (returns current holder).
 */
export const determineQueenHolder = (
  players: Player[],
  currentHolderId: string | null,
): string | null => {
  let maxTowers = 0;
  let leaderId: string | null = null;
  let isTied = false;

  for (const player of players) {
    const towers = getTowerCount(player);
    if (towers > maxTowers) {
      maxTowers = towers;
      leaderId = player.id;
      isTied = false;
    } else if (towers === maxTowers && towers > 0 && leaderId !== null) {
      isTied = true;
    }
  }

  if (isTied || maxTowers === 0) {
    return currentHolderId;
  }

  return leaderId;
};

type Property = {
  size: number;
  crowns: number;
};

/**
 * Find all properties (contiguous territories) in a kingdom using BFS.
 * Returns array of { size, crowns } for each property.
 */
const findProperties = (kingdom: Kingdom): Property[] => {
  const rows = kingdom.length;
  const cols = kingdom[0]?.length ?? 0;
  const visited: boolean[][] = kingdom.map((row) => row.map(() => false));
  const properties: Property[] = [];

  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const tile = kingdom[y]![x]!;
      if (visited[y]![x] || tile.type === "empty" || tile.type === "castle") {
        continue;
      }

      const terrainType = tile.type;
      let size = 0;
      let crowns = 0;
      const queue: [number, number][] = [[x, y]];
      visited[y]![x] = true;

      while (queue.length > 0) {
        const [cx, cy] = queue.pop()!;
        const current = kingdom[cy]![cx]!;
        size++;
        crowns += current.crowns;

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

      properties.push({ size, crowns });
    }
  }

  return properties;
};

/**
 * Calculate the Queen bonus.
 *
 * Official Queendomino rule (Blue Orange rulebook, "End of the Game"): the
 * player hosting the Queen places her on their **largest territory** (the one
 * with the most connecting squares) where she counts as an extra crown.
 *
 * Adding 1 crown to a territory of `size` squares and `crowns` crowns changes
 * its score from `size * crowns` to `size * (crowns + 1)`: the bonus is always
 * the territory size, even when that territory had no crown.
 *
 * Returns the additional points the Queen grants (0 for an empty kingdom).
 */
export const getQueenBonus = (kingdom: Kingdom): number => {
  const properties = findProperties(kingdom);
  let largest = 0;
  for (const prop of properties) {
    if (prop.size > largest) {
      largest = prop.size;
    }
  }
  return largest;
};

/**
 * End-game scoring of one building constructed in a player's kingdom
 * (0 for a building without end-game scoring).
 */
export const calculateBuildingEndGameScore = (
  placed: PlacedBuilding,
  player: Player,
): number => {
  const scoring = placed.building.endGameScoring;
  if (!scoring) return 0;

  switch (scoring.type) {
    case "flat":
      return scoring.points;
    case "perBuilding":
      return (player.buildings ?? []).length * scoring.points;
    case "perTower":
      return getTowerCount(player) * scoring.points;
    case "perCrown": {
      const totalCrowns = countKingdomCrowns(
        player.kingdom,
        (player.giants ?? []).map((g) => g.position),
      );
      return totalCrowns * scoring.points;
    }
    case "perTerrain":
      return scoring.terrain
        ? countTerrainTiles(player.kingdom, scoring.terrain) * scoring.points
        : 0;
    default:
      return 0;
  }
};

/**
 * Calculate end-game building bonus points for a player.
 */
export const calculateBuildingEndGameBonus = (player: Player): number =>
  (player.buildings ?? []).reduce(
    (bonus, placed) => bonus + calculateBuildingEndGameScore(placed, player),
    0,
  );

/**
 * Total crowns in a kingdom. Crowns covered by a giant (Age of Giants +
 * Queendomino) do not count, consistently with territory scoring.
 */
const countKingdomCrowns = (
  kingdom: Kingdom,
  giantPositions: Position[] = [],
): number => {
  const covered = new Set(giantPositions.map((p) => `${p.x},${p.y}`));
  let total = 0;
  for (let y = 0; y < kingdom.length; y++) {
    const row = kingdom[y]!;
    for (let x = 0; x < row.length; x++) {
      const tile = row[x]!;
      if (tile.type !== "empty" && tile.type !== "castle") {
        total += covered.has(`${x},${y}`)
          ? Math.max(0, tile.crowns - 1)
          : tile.crowns;
      }
    }
  }
  return total;
};

/**
 * End-game Queendomino bonus for one player: Queen bonus (if the player hosts
 * the Queen at the end of the game) plus the end-game scoring of every
 * building constructed in their kingdom.
 */
export const calculateQueenDominoEndGameBonus = (
  player: Player,
  queenHolderId: string | null,
): number => {
  const queenBonus =
    queenHolderId !== null && queenHolderId === player.id
      ? getQueenBonus(player.kingdom)
      : 0;
  return queenBonus + calculateBuildingEndGameBonus(player);
};

const countTerrainTiles = (kingdom: Kingdom, terrain: string): number => {
  let count = 0;
  for (const row of kingdom) {
    for (const tile of row) {
      if (tile.type === terrain) {
        count++;
      }
    }
  }
  return count;
};
