import type { Kingdom, Position } from "@core/domain/types/index.js";
import type {
  FireTokenPool,
  PlacedFireToken,
} from "@core/domain/types/origins.js";
import { err, ok, type Result } from "@utils/result.js";
import { ErrorCode } from "@core/domain/errors/domainErrors.js";

// ─── Fire Token Pool ─────────────────────────────────────────────────

/**
 * Creates the initial fire token pool for an Origins game.
 * 10 tokens total: 5×1-fire, 4×2-fire, 1×3-fire.
 */
export const createFireTokenPool = (): FireTokenPool => ({
  ones: 5,
  twos: 4,
  threes: 1,
});

/**
 * Takes a fire token from the pool matching the given crater count.
 * Returns the updated pool, or an error if none available.
 */
export const takeFireToken = (
  pool: FireTokenPool,
  craters: number,
): Result<{ fires: 1 | 2 | 3; updatedPool: FireTokenPool }> => {
  if (craters === 1 && pool.ones > 0) {
    return ok({ fires: 1, updatedPool: { ...pool, ones: pool.ones - 1 } });
  }
  if (craters === 2 && pool.twos > 0) {
    return ok({ fires: 2, updatedPool: { ...pool, twos: pool.twos - 1 } });
  }
  if (craters === 3 && pool.threes > 0) {
    return ok({ fires: 3, updatedPool: { ...pool, threes: pool.threes - 1 } });
  }
  return err(ErrorCode.FIRE_TOKEN_POOL_EMPTY);
};

/**
 * Checks whether a fire token of the given crater type is available.
 */
export const hasFireToken = (pool: FireTokenPool, craters: number): boolean => {
  if (craters === 1) return pool.ones > 0;
  if (craters === 2) return pool.twos > 0;
  if (craters === 3) return pool.threes > 0;
  return false;
};

// ─── Fire Token Placement ────────────────────────────────────────────

/**
 * Computes all positions reachable in exactly N steps from a starting position,
 * using 8-directional movement (including diagonal) with direction changes allowed.
 */
const getReachablePositions = (
  from: Position,
  steps: number,
  gridSize: number,
): Position[] => {
  if (steps === 0) return [from];

  // BFS: track positions reachable at each step count
  let current = new Set<string>();
  current.add(`${from.x},${from.y}`);

  for (let step = 0; step < steps; step++) {
    const next = new Set<string>();
    for (const key of current) {
      const [cx, cy] = key.split(",").map(Number) as [number, number];
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (dx === 0 && dy === 0) continue;
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize) {
            next.add(`${nx},${ny}`);
          }
        }
      }
    }
    current = next;
  }

  return [...current].map((key) => {
    const [x, y] = key.split(",").map(Number) as [number, number];
    return { x, y };
  });
};

/**
 * Returns all valid positions where a fire token can be placed.
 * A fire token is launched from the volcano and travels exactly N squares
 * (8-directional, direction changes allowed).
 *
 * Landing position constraints:
 * - Must be on the grid and contain a placed tile (not empty)
 * - Must NOT be a volcano or castle tile
 * - Must NOT have a fire symbol (crowns > 0)
 * - Must NOT already have a fire token
 */
export const getValidFireTokenPositions = (
  kingdom: Kingdom,
  volcanoPosition: Position,
  fires: 1 | 2 | 3,
  existingFireTokens: PlacedFireToken[],
): Position[] => {
  const gridSize = kingdom.length;
  const reachable = getReachablePositions(volcanoPosition, fires, gridSize);

  const fireTokenPositions = new Set(
    existingFireTokens.map((ft) => `${ft.position.x},${ft.position.y}`),
  );

  return reachable.filter((pos) => {
    const tile = kingdom[pos.y]?.[pos.x];
    if (!tile) return false;
    if (tile.type === "empty") return false;
    if (tile.type === "volcano") return false;
    if (tile.type === "castle") return false;
    if (tile.crowns > 0) return false;
    if (fireTokenPositions.has(`${pos.x},${pos.y}`)) return false;
    return true;
  });
};

/**
 * Checks whether a specific position is valid for fire token placement.
 */
export const isValidFireTokenPosition = (
  kingdom: Kingdom,
  position: Position,
  volcanoPosition: Position,
  fires: 1 | 2 | 3,
  existingFireTokens: PlacedFireToken[],
): boolean => {
  const validPositions = getValidFireTokenPositions(
    kingdom,
    volcanoPosition,
    fires,
    existingFireTokens,
  );
  return validPositions.some(
    (p) => p.x === position.x && p.y === position.y,
  );
};
