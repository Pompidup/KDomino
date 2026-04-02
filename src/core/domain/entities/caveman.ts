import type { Kingdom, Position } from "@core/domain/types/kingdom.js";
import type {
  CaveBoard,
  CavemanTile,
  PlacedCaveman,
  PlacedFireToken,
  Resource,
  ResourceType,
} from "@core/domain/types/origins.js";
import type { ShuffleMethod } from "@core/portServerside/shuffleMethod.js";

const CAVE_BOARD_VISIBLE = 4;

// ─── Cave Board Management ──────────────────────────────────────────

/**
 * Creates a cave board from a list of caveman tiles.
 * Shuffles the tiles, reveals 4, and puts the rest in the draw pile.
 */
export const createCaveBoard = (
  tiles: CavemanTile[],
  shuffle: ShuffleMethod,
): CaveBoard => {
  const shuffled = shuffle(tiles);
  return {
    visible: shuffled.slice(0, CAVE_BOARD_VISIBLE),
    drawPile: shuffled.slice(CAVE_BOARD_VISIBLE),
  };
};

/**
 * Takes a caveman from the visible slots and refills from draw pile.
 */
export const takeCavemanFromVisible = (
  board: CaveBoard,
  cavemanId: number,
): { caveman: CavemanTile; updatedBoard: CaveBoard } | undefined => {
  const index = board.visible.findIndex((c) => c.id === cavemanId);
  if (index === -1) return undefined;

  const caveman = board.visible[index]!;
  const newVisible = [...board.visible];
  newVisible.splice(index, 1);

  // Refill from draw pile
  const newDrawPile = [...board.drawPile];
  if (newDrawPile.length > 0) {
    newVisible.push(newDrawPile.shift()!);
  }

  return {
    caveman,
    updatedBoard: { visible: newVisible, drawPile: newDrawPile },
  };
};

/**
 * Takes a caveman from the draw pile (face-down, player's choice).
 */
export const takeCavemanFromDrawPile = (
  board: CaveBoard,
  cavemanId: number,
): { caveman: CavemanTile; updatedBoard: CaveBoard } | undefined => {
  const index = board.drawPile.findIndex((c) => c.id === cavemanId);
  if (index === -1) return undefined;

  const caveman = board.drawPile[index]!;
  const newDrawPile = [...board.drawPile];
  newDrawPile.splice(index, 1);

  return {
    caveman,
    updatedBoard: { visible: [...board.visible], drawPile: newDrawPile },
  };
};

// ─── Caveman Placement ───────────────────────────────────────────────

/**
 * Checks if a position is valid for placing a caveman.
 * Must be on a placed tile with: no fire symbol, no fire token, no resource.
 */
export const isValidCavemanPosition = (
  kingdom: Kingdom,
  position: Position,
  fireTokens: PlacedFireToken[],
  resources: Resource[],
  cavemen: PlacedCaveman[],
): boolean => {
  const tile = kingdom[position.y]?.[position.x];
  if (!tile) return false;
  if (tile.type === "empty" || tile.type === "castle") return false;

  // No fire symbols on tile
  if (tile.crowns > 0) return false;

  // No fire token at position
  if (
    fireTokens.some(
      (ft) => ft.position.x === position.x && ft.position.y === position.y,
    )
  )
    return false;

  // No resource at position
  if (
    resources.some(
      (r) => r.position.x === position.x && r.position.y === position.y,
    )
  )
    return false;

  // No existing caveman at position
  if (
    cavemen.some(
      (c) => c.position.x === position.x && c.position.y === position.y,
    )
  )
    return false;

  return true;
};

// ─── Caveman Scoring ─────────────────────────────────────────────────

/**
 * All 8 directions (including diagonals) for adjacent resource counting.
 */
const EIGHT_DIRECTIONS = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];

/**
 * Calculates the score for a single hunter-gatherer based on surrounding resources/fire.
 */
export const calculateHunterGathererScore = (
  caveman: PlacedCaveman,
  kingdom: Kingdom,
  resources: Resource[],
  fireTokens: PlacedFireToken[],
): number => {
  if (caveman.caveman.kind !== "hunterGatherer") return 0;

  const { hunterType, pointsPerMatch } = caveman.caveman;
  const { x, y } = caveman.position;
  let matches = 0;

  for (const [dx, dy] of EIGHT_DIRECTIONS) {
    const nx = x + (dx as number);
    const ny = y + (dy as number);

    switch (hunterType) {
      case "mammothHunter":
        if (
          resources.some(
            (r) =>
              r.position.x === nx &&
              r.position.y === ny &&
              r.type === "mammoth",
          )
        )
          matches++;
        break;
      case "fisherman":
        if (
          resources.some(
            (r) =>
              r.position.x === nx && r.position.y === ny && r.type === "fish",
          )
        )
          matches++;
        break;
      case "mushroomPicker":
        if (
          resources.some(
            (r) =>
              r.position.x === nx &&
              r.position.y === ny &&
              r.type === "mushroom",
          )
        )
          matches++;
        break;
      case "flintCollector":
        if (
          resources.some(
            (r) =>
              r.position.x === nx && r.position.y === ny && r.type === "flint",
          )
        )
          matches++;
        break;
      case "trapper": {
        // Count unique resource types adjacent
        const adjacentTypes = new Set<ResourceType>();
        for (const r of resources) {
          if (r.position.x === nx && r.position.y === ny) {
            adjacentTypes.add(r.type);
          }
        }
        matches += adjacentTypes.size;
        break;
      }
      case "gatherer":
        // Count all resources adjacent (any type)
        if (resources.some((r) => r.position.x === nx && r.position.y === ny))
          matches++;
        break;
      case "fireLady": {
        // Count fire symbols (on tiles + fire tokens)
        const tile = kingdom[ny]?.[nx];
        if (tile && tile.type !== "empty") {
          matches += tile.crowns;
        }
        if (
          fireTokens.some((ft) => ft.position.x === nx && ft.position.y === ny)
        ) {
          const token = fireTokens.find(
            (ft) => ft.position.x === nx && ft.position.y === ny,
          );
          if (token) matches += token.fires;
        }
        break;
      }
    }
  }

  return matches * pointsPerMatch;
};

/**
 * Calculates warrior group scoring.
 * Groups are connected warrior tiles (perpendicular only).
 * Score per group = number_of_warriors × total_power.
 */
export const calculateWarriorGroupScore = (
  cavemen: PlacedCaveman[],
): number => {
  const warriors = cavemen.filter((c) => c.caveman.kind === "warrior");
  if (warriors.length === 0) return 0;

  const visited = new Set<string>();
  let totalScore = 0;

  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  for (const warrior of warriors) {
    const key = `${warrior.position.x},${warrior.position.y}`;
    if (visited.has(key)) continue;

    // BFS to find connected group
    let groupSize = 0;
    let groupPower = 0;
    const queue: PlacedCaveman[] = [warrior];
    visited.add(key);

    while (queue.length > 0) {
      const current = queue.pop()!;
      groupSize++;
      if (current.caveman.kind === "warrior") {
        groupPower += current.caveman.power;
      }

      for (const [dx, dy] of directions) {
        const nx = current.position.x + (dx as number);
        const ny = current.position.y + (dy as number);
        const nKey = `${nx},${ny}`;

        if (!visited.has(nKey)) {
          const neighbor = warriors.find(
            (w) => w.position.x === nx && w.position.y === ny,
          );
          if (neighbor) {
            visited.add(nKey);
            queue.push(neighbor);
          }
        }
      }
    }

    totalScore += groupSize * groupPower;
  }

  return totalScore;
};

/**
 * Calculates the total caveman bonus score for Tribe mode.
 */
export const calculateTribeCavemanScore = (
  cavemen: PlacedCaveman[],
  kingdom: Kingdom,
  resources: Resource[],
  fireTokens: PlacedFireToken[],
): number => {
  let totalScore = 0;

  // Hunter-gatherer scores
  for (const caveman of cavemen) {
    if (caveman.caveman.kind === "hunterGatherer") {
      totalScore += calculateHunterGathererScore(
        caveman,
        kingdom,
        resources,
        fireTokens,
      );
    }
  }

  // Warrior group scores
  totalScore += calculateWarriorGroupScore(cavemen);

  return totalScore;
};
