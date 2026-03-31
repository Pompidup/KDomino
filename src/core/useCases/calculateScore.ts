import type { Kingdom, Score } from "@core/domain/types/index.js";
import { ok, type Result } from "@utils/result.js";

export type CalculateScoreUseCase = (kingdom: Kingdom) => Result<Score>;

type Property = {
  size: number;
  crowns: number;
};

export const calculateScoreUseCase: CalculateScoreUseCase = (kingdom) => {
  const rows = kingdom.length;
  const cols = kingdom[0]!.length;
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

      // BFS flood-fill for this property
      const type = tile.type;
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
            kingdom[ny]![nx]!.type === type
          ) {
            visited[ny]![nx] = true;
            queue.push([nx, ny]);
          }
        }
      }

      properties.push({ size, crowns });
    }
  }

  if (properties.length === 0) {
    return ok({
      points: 0,
      maxPropertiesSize: 0,
      totalCrowns: 0,
    });
  }

  let points = 0;
  let maxPropertiesSize = 0;
  let totalCrowns = 0;

  for (const property of properties) {
    points += property.size * property.crowns;
    if (property.size > maxPropertiesSize) {
      maxPropertiesSize = property.size;
    }
    totalCrowns += property.crowns;
  }

  return ok({
    points,
    maxPropertiesSize,
    totalCrowns,
  });
};
