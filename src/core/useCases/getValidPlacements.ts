import type { Kingdom, Position, Rotation, Domino } from "@core/domain/types/index.js";
import { GRIDSIZE } from "@core/domain/types/kingdom.js";
import { placeDomino } from "@core/domain/entities/kingdom.js";
import { isOk } from "@utils/result.js";

/**
 * Represents a valid placement position with rotation.
 */
export type ValidPlacement = {
  position: Position;
  rotation: Rotation;
};

export type GetValidPlacementsUseCase = (
  kingdom: Kingdom,
  domino: Domino
) => ValidPlacement[];

/**
 * Finds all valid placements for a domino on a kingdom grid.
 * Tests all positions and rotations to determine where the domino can be placed.
 *
 * @param kingdom - The current state of the kingdom grid
 * @param domino - The domino to place
 * @returns Array of valid placements (position + rotation combinations)
 */
export const getValidPlacementsUseCase: GetValidPlacementsUseCase = (
  kingdom,
  domino
) => {
  const validPlacements: ValidPlacement[] = [];
  const rotations: Rotation[] = [0, 90, 180, 270];

  // Try each position on the grid
  for (let y = 0; y < GRIDSIZE; y++) {
    for (let x = 0; x < GRIDSIZE; x++) {
      const position: Position = { x, y };

      // Try each rotation
      for (const rotation of rotations) {
        const result = placeDomino(kingdom, position, rotation, domino);
        if (isOk(result)) {
          validPlacements.push({ position, rotation });
        }
      }
    }
  }

  return validPlacements;
};

/**
 * Checks if a domino can be placed anywhere on the kingdom.
 *
 * @param kingdom - The current state of the kingdom grid
 * @param domino - The domino to check
 * @returns True if at least one valid placement exists
 */
export const canPlaceDominoUseCase = (
  kingdom: Kingdom,
  domino: Domino
): boolean => {
  const rotations: Rotation[] = [0, 90, 180, 270];

  // Check each position on the grid
  for (let y = 0; y < GRIDSIZE; y++) {
    for (let x = 0; x < GRIDSIZE; x++) {
      const position: Position = { x, y };

      // Check each rotation - return early if any placement is valid
      for (const rotation of rotations) {
        const result = placeDomino(kingdom, position, rotation, domino);
        if (isOk(result)) {
          return true;
        }
      }
    }
  }

  return false;
};
