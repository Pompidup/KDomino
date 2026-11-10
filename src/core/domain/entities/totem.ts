import type {
  OriginsState,
  ResourceType,
  TotemState,
} from "@core/domain/types/origins.js";
import type { Player } from "@core/domain/types/player.js";
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

const RESOURCE_TYPES: ResourceType[] = ["mammoth", "fish", "mushroom", "flint"];

/**
 * Determines which player holds each totem based on resource majority.
 *
 * Official rules (Kingdomino Origins, Totem mode):
 * - a player takes a totem when they have the majority ("the highest amount
 *   only") of the corresponding resource, i.e. strictly more than every
 *   other player;
 * - when the holder loses the majority (another player collects resources,
 *   or a fire destroys some), the totem goes to the new majority holder;
 * - on a tie for the majority the holder chooses who gets it: the engine
 *   keeps it with the current holder when they are among the tied players,
 *   otherwise gives it to the first tied player in player order.
 * A totem nobody holds stays unclaimed while the majority is tied.
 */
export const determineTotemHolders = (
  players: Player[],
  currentTotems: TotemState,
): TotemState => {
  const result: TotemState = { ...currentTotems };

  for (const resourceType of RESOURCE_TYPES) {
    const counts = players.map(
      (player) => countResourcesByType(player.resources ?? [])[resourceType],
    );
    const maxCount = Math.max(0, ...counts);
    const leaders = players.filter((_, index) => counts[index] === maxCount);
    const holder = result[resourceType];

    if (maxCount === 0) {
      // No one has this resource - totem stays unclaimed
      result[resourceType] = null;
    } else if (leaders.length === 1) {
      // Strict majority
      result[resourceType] = leaders[0]!.id;
    } else if (holder !== null && leaders.some((p) => p.id === holder)) {
      // Tie including the current holder: they keep it
      result[resourceType] = holder;
    } else if (holder !== null && players.some((p) => p.id === holder)) {
      // The holder lost the majority to tied players: pass it to one of them
      result[resourceType] = leaders[0]!.id;
    } else {
      // Unclaimed totem and tied majority: nobody takes it
      result[resourceType] = null;
    }
  }

  return result;
};

/**
 * Re-evaluates the totem holders of an Origins state (Totem mode only).
 * States without totems are returned unchanged.
 */
export const refreshTotemHolders = (
  origins: OriginsState | undefined,
  players: Player[],
): OriginsState | undefined => {
  if (!origins?.totems) return origins;
  return {
    ...origins,
    totems: determineTotemHolders(players, origins.totems),
  };
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
