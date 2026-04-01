import type { Kingdom } from "@core/domain/types/kingdom.js";
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
      if (
        visited[y]![x] ||
        tile.type === "empty" ||
        tile.type === "castle"
      ) {
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
 * Calculate the Queen bonus: +1 crown to the territory with the most crowns.
 * Returns the additional points the Queen grants.
 */
export const getQueenBonus = (kingdom: Kingdom): number => {
  const properties = findProperties(kingdom);
  if (properties.length === 0) return 0;

  // Find the property with the most crowns
  let maxCrowns = 0;
  let maxCrownProperty: Property | null = null;

  for (const prop of properties) {
    if (prop.crowns > maxCrowns) {
      maxCrowns = prop.crowns;
      maxCrownProperty = prop;
    }
  }

  if (!maxCrownProperty || maxCrownProperty.crowns === 0) return 0;

  // Queen adds +1 crown to this territory
  // Original score: size * crowns
  // New score: size * (crowns + 1)
  // Bonus = size * (crowns + 1) - size * crowns = size
  return maxCrownProperty.size;
};

/**
 * Calculate end-game building bonus points for a player.
 */
export const calculateBuildingEndGameBonus = (
  player: Player,
): number => {
  const buildings = player.buildings ?? [];
  let bonus = 0;

  for (const placed of buildings) {
    const scoring = placed.building.endGameScoring;
    if (!scoring) continue;

    switch (scoring.type) {
      case "flat":
        bonus += scoring.points;
        break;
      case "perBuilding":
        bonus += buildings.length * scoring.points;
        break;
      case "perTower":
        bonus += getTowerCount(player) * scoring.points;
        break;
      case "perCrown": {
        const totalCrowns = countKingdomCrowns(player.kingdom);
        bonus += totalCrowns * scoring.points;
        break;
      }
      case "perTerrain": {
        if (scoring.terrain) {
          const count = countTerrainTiles(player.kingdom, scoring.terrain);
          bonus += count * scoring.points;
        }
        break;
      }
    }
  }

  return bonus;
};

const countKingdomCrowns = (kingdom: Kingdom): number => {
  let total = 0;
  for (const row of kingdom) {
    for (const tile of row) {
      if (tile.type !== "empty" && tile.type !== "castle") {
        total += tile.crowns;
      }
    }
  }
  return total;
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
