import type { Kingdom } from "../../entities/kingdom.js";

type Property = {
  type: string;
  crowns: number;
  size: number;
  tiles: number[][];
};

export type Score = {
  score: number;
  maxPropertiesSize: number;
  totalCrowns: number;
};

const calculateScore =
  () =>
  (kingdom: Kingdom): Score => {
    const visited: boolean[][] = kingdom.map((row) => row.map(() => false));
    const properties: Property[] = [];

    const directions = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]; // Up, Down, Left, Right

    const markZone = (
      x: number,
      y: number,
      type: string,
      crowns: number
    ): void => {
      if (
        x < 0 ||
        y < 0 ||
        x >= kingdom[0]!.length ||
        y >= kingdom.length ||
        visited[y]![x] ||
        kingdom[y]![x]!.type !== type ||
        kingdom[y]![x]!.type === "empty" ||
        kingdom[y]![x]!.type === "castle"
      ) {
        return;
      }

      visited[y]![x] = true;
      const currentZone = properties.find(
        (property) =>
          property.type === type &&
          property.tiles.some(([tx, ty]) => {
            for (let [dx, dy] of directions) {
              if (
                (tx as number) + (dx as number) === x &&
                (ty as number) + (dy as number) === y
              ) {
                return true;
              }
            }
            return false;
          })
      );

      if (currentZone) {
        currentZone.crowns += crowns;
        currentZone.size++;
        currentZone.tiles.push([x, y]);
      } else {
        properties.push({ type, crowns, size: 1, tiles: [[x, y]] });
      }

      directions.forEach(([dx, dy]) => {
        const nx = x + (dx as number);
        const ny = y + (dy as number);
        if (
          nx >= 0 &&
          ny >= 0 &&
          nx < kingdom[0]!.length &&
          ny < kingdom.length &&
          kingdom[ny]![nx]!.type === type
        ) {
          markZone(nx, ny, kingdom[ny]![nx]!.type, kingdom[ny]![nx]!.crowns);
        }
      });
    };

    kingdom.forEach((row, y) => {
      row.forEach((tile, x) => {
        if (!visited[y]![x]) {
          markZone(x, y, tile.type, tile.crowns);
        }
      });
    });

    if (properties.length === 0) {
      return {
        score: 0,
        maxPropertiesSize: 0,
        totalCrowns: 0,
      };
    }

    const score = properties.reduce(
      (score, property) => score + property.crowns * property.size,
      0
    );
    const maxPropertiesSize = Math.max(
      ...properties.map((property) => property.size ?? 0)
    );

    const totalCrowns = properties.reduce(
      (total, property) => total + property.crowns,
      0
    );

    return {
      score,
      maxPropertiesSize,
      totalCrowns,
    };
  };

export { calculateScore };
