import type { PlacedGiant } from "@core/domain/types/ageOfGiants.js";
import type { Kingdom, Position } from "@core/domain/types/kingdom.js";
import type { Player } from "@core/domain/types/player.js";
import { ErrorCode } from "@core/domain/errors/domainErrors.js";
import { err, ok, type Result } from "@utils/result.js";

const INITIAL_GIANT_POOL = 6;

/**
 * Creates the initial giant pool (6 giants).
 */
export const createGiantPool = (): number => INITIAL_GIANT_POOL;

/**
 * Takes a giant from the pool.
 * Returns the updated pool count, or an error if pool is empty.
 */
export const takeFromGiantPool = (pool: number): Result<number> => {
  if (pool <= 0) {
    return err(ErrorCode.GIANT_POOL_EMPTY);
  }
  return ok(pool - 1);
};

/**
 * Finds all positions in a kingdom that have at least 1 crown.
 */
export const findCrownsInKingdom = (kingdom: Kingdom): Position[] => {
  const crowns: Position[] = [];
  for (let y = 0; y < kingdom.length; y++) {
    const row = kingdom[y]!;
    for (let x = 0; x < row.length; x++) {
      const tile = row[x]!;
      if (tile.type !== "empty" && tile.type !== "castle" && tile.crowns > 0) {
        crowns.push({ x, y });
      }
    }
  }
  return crowns;
};

/**
 * Finds all crown positions not already covered by a giant.
 */
export const findCrownsNotCoveredByGiants = (
  kingdom: Kingdom,
  giants: PlacedGiant[],
): Position[] => {
  const allCrowns = findCrownsInKingdom(kingdom);
  return allCrowns.filter(
    (crown) => !giants.some((g) => g.position.x === crown.x && g.position.y === crown.y),
  );
};

/**
 * Checks whether a player has at least one giant on their kingdom.
 */
export const playerHasGiant = (player: Player): boolean =>
  (player.giants?.length ?? 0) > 0;

/**
 * Places a giant on a crown in the player's kingdom.
 * Validates that the position has an uncovered crown.
 */
export const placeGiantOnCrown = (
  player: Player,
  position: Position,
): Result<Player> => {
  const kingdom = player.kingdom;
  const tile = kingdom[position.y]?.[position.x];

  if (!tile || tile.type === "empty" || tile.type === "castle") {
    return err(ErrorCode.INVALID_GIANT_PLACEMENT);
  }

  if (tile.crowns <= 0) {
    return err(ErrorCode.INVALID_GIANT_PLACEMENT);
  }

  const giants = player.giants ?? [];

  // Check crown isn't already covered
  const alreadyCovered = giants.some(
    (g) => g.position.x === position.x && g.position.y === position.y,
  );
  if (alreadyCovered) {
    return err(ErrorCode.INVALID_GIANT_PLACEMENT);
  }

  const newGiant: PlacedGiant = { position };
  return ok({
    ...player,
    giants: [...giants, newGiant],
  });
};

/**
 * Sends a giant from the source player to the target player.
 * Removes the giant from the source and places it on a crown of the target.
 */
export const sendGiantToOpponent = (
  sourcePlayer: Player,
  targetPlayer: Player,
  giantIndex: number,
  targetCrownPosition: Position,
): Result<{ source: Player; target: Player }> => {
  const sourceGiants = sourcePlayer.giants ?? [];

  if (giantIndex < 0 || giantIndex >= sourceGiants.length) {
    return err(ErrorCode.GIANT_NOT_FOUND);
  }

  // Validate target position has a crown
  const targetTile = targetPlayer.kingdom[targetCrownPosition.y]?.[targetCrownPosition.x];
  if (!targetTile || targetTile.type === "empty" || targetTile.type === "castle" || targetTile.crowns <= 0) {
    return err(ErrorCode.INVALID_GIANT_PLACEMENT);
  }

  // Check target crown isn't already covered
  const targetGiants = targetPlayer.giants ?? [];
  const alreadyCovered = targetGiants.some(
    (g) => g.position.x === targetCrownPosition.x && g.position.y === targetCrownPosition.y,
  );
  if (alreadyCovered) {
    return err(ErrorCode.INVALID_GIANT_PLACEMENT);
  }

  // Remove giant from source
  const updatedSourceGiants = sourceGiants.filter((_, i) => i !== giantIndex);

  // Place giant on target
  const newGiant: PlacedGiant = { position: targetCrownPosition };

  return ok({
    source: { ...sourcePlayer, giants: updatedSourceGiants },
    target: { ...targetPlayer, giants: [...targetGiants, newGiant] },
  });
};
