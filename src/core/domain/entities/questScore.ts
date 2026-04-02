import type { PlacedGiant, QuestTile } from "@core/domain/types/ageOfGiants.js";
import { questTypes } from "@core/domain/types/ageOfGiants.js";
import type { Ground } from "@core/domain/types/domino.js";
import type { Kingdom } from "@core/domain/types/kingdom.js";
import { checkCastleIsInMiddle, countDominoes } from "./kingdom.js";

/**
 * Finds the castle position in the kingdom.
 */
const findCastlePosition = (
  kingdom: Kingdom,
): { x: number; y: number } | undefined => {
  for (let y = 0; y < kingdom.length; y++) {
    const row = kingdom[y]!;
    for (let x = 0; x < row.length; x++) {
      if (row[x]!.type === "castle") {
        return { x, y };
      }
    }
  }
  return undefined;
};

/**
 * Gets the bounding box of non-empty tiles in the kingdom.
 */
const getBoundingBox = (
  kingdom: Kingdom,
): { minX: number; minY: number; maxX: number; maxY: number } | undefined => {
  let minX = Number.MAX_SAFE_INTEGER;
  let minY = Number.MAX_SAFE_INTEGER;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < kingdom.length; y++) {
    const row = kingdom[y]!;
    for (let x = 0; x < row.length; x++) {
      if (row[x]!.type !== "empty") {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (maxX === -1) return undefined;
  return { minX, minY, maxX, maxY };
};

/**
 * Local Trade: 5pts per matching terrain tile adjacent (8-dir) to castle.
 */
export const calculateLocalTradeBonus = (
  kingdom: Kingdom,
  terrain: Ground,
  pointsPerMatch: number,
): number => {
  const castle = findCastlePosition(kingdom);
  if (!castle) return 0;

  const directions = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
  ];

  let count = 0;
  for (const [dy, dx] of directions) {
    const ny = castle.y + (dy as number);
    const nx = castle.x + (dx as number);
    const tile = kingdom[ny]?.[nx];
    if (tile && tile.type === terrain) {
      count++;
    }
  }

  return count * pointsPerMatch;
};

/**
 * Kingdom Borders: 5pts per matching terrain tile in the 4 corners of the kingdom bounding box.
 */
export const calculateKingdomBordersBonus = (
  kingdom: Kingdom,
  terrain: Ground,
  pointsPerMatch: number,
): number => {
  const box = getBoundingBox(kingdom);
  if (!box) return 0;

  const corners = [
    { x: box.minX, y: box.minY },
    { x: box.maxX, y: box.minY },
    { x: box.minX, y: box.maxY },
    { x: box.maxX, y: box.maxY },
  ];

  let count = 0;
  for (const corner of corners) {
    const tile = kingdom[corner.y]?.[corner.x];
    if (tile && tile.type === terrain) {
      count++;
    }
  }

  return count * pointsPerMatch;
};

/**
 * Lost Corner: 20pts if castle is in one of the 4 corners of the kingdom bounding box.
 */
export const calculateLostCornerBonus = (
  kingdom: Kingdom,
  points: number,
): number => {
  const castle = findCastlePosition(kingdom);
  if (!castle) return 0;

  const box = getBoundingBox(kingdom);
  if (!box) return 0;

  const isCorner =
    (castle.x === box.minX && castle.y === box.minY) ||
    (castle.x === box.maxX && castle.y === box.minY) ||
    (castle.x === box.minX && castle.y === box.maxY) ||
    (castle.x === box.maxX && castle.y === box.maxY);

  return isCorner ? points : 0;
};

/**
 * Megalomania: 10pts per alignment of 3+ tiles with uncovered crowns (H/V/diagonal).
 * Giants cover crowns, so we skip positions covered by giants.
 */
export const calculateMegalomaniaBonus = (
  kingdom: Kingdom,
  giants: PlacedGiant[],
  points: number,
): number => {
  const rows = kingdom.length;
  const cols = kingdom[0]!.length;

  // Build a boolean grid: true if tile has uncovered crown
  const hasCrown: boolean[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => false),
  );

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const tile = kingdom[y]![x]!;
      if (tile.type !== "empty" && tile.type !== "castle" && tile.crowns > 0) {
        const coveredByGiant = giants.some(
          (g) => g.position.x === x && g.position.y === y,
        );
        if (!coveredByGiant) {
          hasCrown[y]![x] = true;
        }
      }
    }
  }

  let alignments = 0;

  // Directions: horizontal (1,0), vertical (0,1), diagonal (1,1), anti-diagonal (1,-1)
  const directions = [
    { dx: 1, dy: 0 }, // horizontal
    { dx: 0, dy: 1 }, // vertical
    { dx: 1, dy: 1 }, // diagonal
    { dx: 1, dy: -1 }, // anti-diagonal
  ];

  for (const { dx, dy } of directions) {
    // Track which cells have been counted in a run for this direction
    const counted: boolean[][] = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => false),
    );

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (counted[y]![x] || !hasCrown[y]![x]) continue;

        // Count consecutive crowns in this direction
        let length = 0;
        let cx = x;
        let cy = y;
        while (
          cx >= 0 &&
          cx < cols &&
          cy >= 0 &&
          cy < rows &&
          hasCrown[cy]![cx]
        ) {
          counted[cy]![cx] = true;
          length++;
          cx += dx;
          cy += dy;
        }

        if (length >= 3) {
          alignments++;
        }
      }
    }
  }

  return alignments * points;
};

/**
 * Austere King: 10pts per property of 5+ wheat/forest/sea/plain tiles with 0 crowns.
 */
export const calculateAustereKingBonus = (
  kingdom: Kingdom,
  points: number,
): number => {
  const eligibleTerrains: Ground[] = ["wheat", "forest", "sea", "plain"];
  const rows = kingdom.length;
  const cols = kingdom[0]!.length;
  const visited: boolean[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => false),
  );

  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  let qualifyingProperties = 0;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const tile = kingdom[y]![x]!;
      if (visited[y]![x] || !eligibleTerrains.includes(tile.type as Ground))
        continue;
      if (tile.type === "empty" || tile.type === "castle") continue;

      // BFS for this property
      const type = tile.type;
      let size = 0;
      let hasAnyCrown = false;
      const queue: [number, number][] = [[x, y]];
      visited[y]![x] = true;

      while (queue.length > 0) {
        const [cx, cy] = queue.pop()!;
        const current = kingdom[cy]![cx]!;
        size++;
        if (current.crowns > 0) hasAnyCrown = true;

        for (const [dy, dx] of directions) {
          const nx = cx + (dx as number);
          const ny = cy + (dy as number);
          if (
            nx >= 0 &&
            ny >= 0 &&
            nx < cols &&
            ny < rows &&
            !visited[ny]![nx] &&
            kingdom[ny]![nx]!.type === type
          ) {
            visited[ny]![nx] = true;
            queue.push([nx, ny]);
          }
        }
      }

      if (size >= 5 && !hasAnyCrown) {
        qualifyingProperties++;
      }
    }
  }

  return qualifyingProperties * points;
};

/**
 * Calculates the bonus for a single quest tile.
 */
export const calculateQuestBonus = (
  quest: QuestTile,
  kingdom: Kingdom,
  giants: PlacedGiant[],
  dominoLimit: number,
  playerCount: number,
): number => {
  switch (quest.type) {
    case questTypes.localTrade:
      return calculateLocalTradeBonus(kingdom, quest.terrain!, quest.points);

    case questTypes.kingdomBorders:
      return calculateKingdomBordersBonus(
        kingdom,
        quest.terrain!,
        quest.points,
      );

    case questTypes.harmony: {
      const totalDominoes = countDominoes(kingdom);
      const dominoesPerPlayer = dominoLimit / playerCount;
      return totalDominoes === dominoesPerPlayer ? quest.points : 0;
    }

    case questTypes.middleKingdom:
      return checkCastleIsInMiddle(kingdom) ? quest.points : 0;

    case questTypes.lostCorner:
      return calculateLostCornerBonus(kingdom, quest.points);

    case questTypes.megalomania:
      return calculateMegalomaniaBonus(kingdom, giants, quest.points);

    case questTypes.austereKing:
      return calculateAustereKingBonus(kingdom, quest.points);

    default:
      return 0;
  }
};
