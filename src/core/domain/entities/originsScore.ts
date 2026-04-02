import type { Kingdom } from "@core/domain/types/kingdom.js";
import type { PlacedFireToken } from "@core/domain/types/origins.js";

/**
 * Calculates the fire token bonus for Origins scoring.
 *
 * For each region in the kingdom, fire tokens placed within that region
 * contribute their fire value as additional multiplier.
 * The bonus is: for each region, fire_tokens_in_region × region_size.
 *
 * This is added on top of the base score (which already accounts for
 * fire symbols printed on tiles via the crowns field).
 */
export const calculateOriginsFireBonus = (
  kingdom: Kingdom,
  placedFireTokens: PlacedFireToken[],
): number => {
  if (placedFireTokens.length === 0) return 0;

  const rows = kingdom.length;
  const cols = kingdom[0]!.length;
  const visited: boolean[][] = kingdom.map((row) => row.map(() => false));

  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  // Build a map of fire token positions to fire values
  const tokenMap = new Map<string, number>();
  for (const token of placedFireTokens) {
    const key = `${token.position.x},${token.position.y}`;
    tokenMap.set(key, (tokenMap.get(key) ?? 0) + token.fires);
  }

  let totalBonus = 0;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const tile = kingdom[y]![x]!;
      if (
        visited[y]![x] ||
        tile.type === "empty" ||
        tile.type === "castle" ||
        tile.type === "volcano"
      ) {
        continue;
      }

      // BFS flood-fill for this region
      const type = tile.type;
      let size = 0;
      let fireTokenFires = 0;
      const queue: [number, number][] = [[x, y]];
      visited[y]![x] = true;

      while (queue.length > 0) {
        const [cx, cy] = queue.pop()!;
        size++;

        // Check for fire token at this position
        const key = `${cx},${cy}`;
        if (tokenMap.has(key)) {
          fireTokenFires += tokenMap.get(key)!;
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
            kingdom[ny]![nx]!.type === type
          ) {
            visited[ny]![nx] = true;
            queue.push([nx, ny]);
          }
        }
      }

      // Fire token bonus for this region: size × fire_token_fires
      totalBonus += size * fireTokenFires;
    }
  }

  return totalBonus;
};
