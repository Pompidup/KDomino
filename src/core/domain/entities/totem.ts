import type { Player } from "@core/domain/types/player.js";
import type { ResourceType, TotemState } from "@core/domain/types/origins.js";
import { countResourcesByType } from "./resource.js";

/**
 * Bonus points for holding each totem at end of game.
 * Values from the Kingdomino Origins rules.
 */
export const TOTEM_BONUSES: Record<ResourceType, number> = {
  mammoth: 3,
  fish: 3,
  mushroom: 3,
  flint: 3,
};

const RESOURCE_TYPES: ResourceType[] = [
  "mammoth",
  "fish",
  "mushroom",
  "flint",
];

/**
 * Determines which player holds each totem based on resource majority.
 * A player must have the strict majority (more than any other player).
 * In case of tie, the current holder keeps the totem. If no one holds it, it stays unclaimed.
 */
export const determineTotemHolders = (
  players: Player[],
  currentTotems: TotemState,
): TotemState => {
  const result: TotemState = { ...currentTotems };

  for (const resourceType of RESOURCE_TYPES) {
    let maxCount = 0;
    let maxPlayerId: string | null = null;
    let isTied = false;

    for (const player of players) {
      const resources = player.resources ?? [];
      const counts = countResourcesByType(resources);
      const count = counts[resourceType];

      if (count > maxCount) {
        maxCount = count;
        maxPlayerId = player.id;
        isTied = false;
      } else if (count === maxCount && count > 0) {
        isTied = true;
      }
    }

    if (maxCount === 0) {
      // No one has this resource - totem stays unclaimed
      result[resourceType] = null;
    } else if (isTied) {
      // Tie: current holder keeps it, or stays with one of the tied players
      // Per rules: "If there is a tie for the majority then you can choose which
      // of the players to give the totem to" - we keep the current holder
      // If no current holder, give to first tied player
      if (
        result[resourceType] === null ||
        !players.some((p) => p.id === result[resourceType])
      ) {
        result[resourceType] = maxPlayerId;
      }
    } else {
      result[resourceType] = maxPlayerId;
    }
  }

  return result;
};

/**
 * Calculates totem scoring for a player in Totem mode:
 * - 1 point per remaining wooden resource
 * - Totem bonus for each totem the player holds
 */
export const calculateTotemScore = (
  player: Player,
  totemState: TotemState,
): number => {
  let score = 0;

  // 1 point per remaining resource
  const resources = player.resources ?? [];
  score += resources.length;

  // Totem bonuses
  for (const resourceType of RESOURCE_TYPES) {
    if (totemState[resourceType] === player.id) {
      score += TOTEM_BONUSES[resourceType];
    }
  }

  return score;
};
