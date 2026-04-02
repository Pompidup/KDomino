import type { Ground, Tile } from "@core/domain/types/domino.js";
import type { Position } from "@core/domain/types/kingdom.js";
import type { Resource, ResourceType } from "@core/domain/types/origins.js";

/**
 * Maps terrain types to their corresponding resource type.
 * Returns null for terrains that don't produce resources.
 */
export const terrainToResource = (terrain: Ground): ResourceType | null => {
  switch (terrain) {
    case "grassland":
      return "mammoth";
    case "lake":
      return "fish";
    case "jungle":
      return "mushroom";
    case "quarry":
      return "flint";
    default:
      return null;
  }
};

/**
 * Checks whether a tile should receive a wooden resource.
 * A tile gets a resource if it has a resource-eligible terrain AND no fire symbols.
 */
export const shouldHaveResource = (tile: Tile): boolean => {
  const resourceType = terrainToResource(tile.type);
  return resourceType !== null && tile.crowns === 0;
};

/**
 * Creates a resource for a tile at the given position, if applicable.
 */
export const createResourceForTile = (
  tile: Tile,
  position: Position,
): Resource | null => {
  const resourceType = terrainToResource(tile.type);
  if (resourceType === null || tile.crowns > 0) return null;
  return { type: resourceType, position };
};

/**
 * Destroys a resource at a given position (e.g., from fire token impact).
 * Returns the updated resources array.
 */
export const destroyResourceAtPosition = (
  resources: Resource[],
  position: Position,
): Resource[] => {
  return resources.filter(
    (r) => !(r.position.x === position.x && r.position.y === position.y),
  );
};

/**
 * Counts resources by type for a player's resource list.
 */
export const countResourcesByType = (
  resources: Resource[],
): Record<ResourceType, number> => {
  const counts: Record<ResourceType, number> = {
    mammoth: 0,
    fish: 0,
    mushroom: 0,
    flint: 0,
  };
  for (const r of resources) {
    counts[r.type]++;
  }
  return counts;
};

/**
 * Checks if a player has at least the required resources to spend.
 * @param resources - Player's current resources
 * @param positions - Positions of resources to spend
 * @param requiredDifferentTypes - How many different types are required
 */
export const canSpendResources = (
  resources: Resource[],
  positions: Position[],
  requiredDifferentTypes: number,
): boolean => {
  const toSpend = positions.map((pos) =>
    resources.find((r) => r.position.x === pos.x && r.position.y === pos.y),
  );

  // All positions must have a resource
  if (toSpend.some((r) => r === undefined)) return false;

  // Must have the required number of different types
  const types = new Set(toSpend.map((r) => r!.type));
  return types.size >= requiredDifferentTypes;
};

/**
 * Removes resources at the given positions.
 */
export const spendResources = (
  resources: Resource[],
  positions: Position[],
): Resource[] => {
  const posSet = new Set(positions.map((p) => `${p.x},${p.y}`));
  return resources.filter(
    (r) => !posSet.has(`${r.position.x},${r.position.y}`),
  );
};
