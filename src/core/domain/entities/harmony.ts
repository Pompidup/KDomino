/**
 * "Harmony" (Kingdomino, Queendomino), "Homo Habilis" (Origins) and the
 * Harmony quest (Age of Giants) need a complete kingdom: every domino the
 * player receives over the game is placed, none discarded.
 *
 * During the game the bonus is still reachable while the player has not
 * discarded any domino (`player.discardedDominoes`) and the dominoes still to
 * come fit in the kingdom: some square frame of the kingdom size containing
 * every placed square offers room for that many dominoes on its empty squares
 * (a maximum matching of the empty squares, two orthogonally adjacent squares
 * per domino). The terrains of the dominoes to come are unknown, so a later
 * forced discard can still make the bonus unreachable.
 */
import type { Game } from "@core/domain/types/game.js";
import type { Kingdom } from "@core/domain/types/kingdom.js";
import type { Player } from "@core/domain/types/player.js";
import { countDominoes, getBoundingBox } from "./kingdom.js";

/** Every domino a player receives over the game (one per lord and turn). */
export const dominoesReceivedPerPlayer = (game: Game): number =>
  game.rules.basic.lords * game.rules.basic.maxTurns;

const NEIGHBOURS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;

/**
 * Maximum number of disjoint dominoes (pairs of orthogonally adjacent empty
 * squares) inside a frame, by augmenting paths on the checkerboard bipartite
 * graph of its empty squares. Stops as soon as `needed` dominoes fit.
 */
const fitsDominoes = (
  kingdom: Kingdom,
  frame: { x: number; y: number; size: number },
  needed: number,
): boolean => {
  const inFrame = (x: number, y: number) =>
    x >= frame.x &&
    y >= frame.y &&
    x < frame.x + frame.size &&
    y < frame.y + frame.size;
  const isEmpty = (x: number, y: number) =>
    inFrame(x, y) && kingdom[y]?.[x]?.type === "empty";
  const cols = kingdom[0]?.length ?? 0;
  const key = (x: number, y: number) => y * cols + x;

  // Left side of the bipartite graph: empty squares with (x + y) even
  const left: [number, number][] = [];
  let emptyCount = 0;
  for (let y = frame.y; y < frame.y + frame.size; y++) {
    for (let x = frame.x; x < frame.x + frame.size; x++) {
      if (!isEmpty(x, y)) continue;
      emptyCount++;
      if ((x + y) % 2 === 0) left.push([x, y]);
    }
  }
  if (emptyCount < needed * 2) return false;

  const matchOfRight = new Map<number, number>();
  const augment = (index: number, seen: Set<number>): boolean => {
    const [x, y] = left[index]!;
    for (const [dx, dy] of NEIGHBOURS) {
      const nx = x + dx;
      const ny = y + dy;
      if (!isEmpty(nx, ny)) continue;
      const right = key(nx, ny);
      if (seen.has(right)) continue;
      seen.add(right);
      const owner = matchOfRight.get(right);
      if (owner === undefined || augment(owner, seen)) {
        matchOfRight.set(right, index);
        return true;
      }
    }
    return false;
  };

  let matched = 0;
  for (let index = 0; index < left.length && matched < needed; index++) {
    if (augment(index, new Set())) matched++;
  }
  return matched >= needed;
};

/**
 * Whether `remaining` more dominoes can still fit in a kingdom limited to
 * `size` x `size` squares (terrains ignored).
 */
export const canKingdomFitDominoes = (
  kingdom: Kingdom,
  size: number,
  remaining: number,
): boolean => {
  if (remaining <= 0) return true;
  const bbox = getBoundingBox(kingdom);
  if (!bbox) return false;

  const rows = kingdom.length;
  const cols = kingdom[0]?.length ?? 0;
  for (
    let y = Math.max(0, bbox.maxY - size + 1);
    y <= Math.min(bbox.minY, rows - size);
    y++
  ) {
    for (
      let x = Math.max(0, bbox.maxX - size + 1);
      x <= Math.min(bbox.minX, cols - size);
      x++
    ) {
      if (fitsDominoes(kingdom, { x, y, size }, remaining)) return true;
    }
  }
  return false;
};

/** Whether the player's kingdom holds every domino received over the game. */
export const isKingdomComplete = (game: Game, player: Player): boolean =>
  countDominoes(player.kingdom) === dominoesReceivedPerPlayer(game);

/**
 * Whether the complete-kingdom bonuses (Harmony, Homo Habilis, Harmony quest)
 * are still reachable during the game: no domino discarded so far and room
 * left for every domino still to come.
 */
export const isHarmonyReachable = (game: Game, player: Player): boolean => {
  if ((player.discardedDominoes ?? 0) > 0) return false;
  const remaining =
    dominoesReceivedPerPlayer(game) - countDominoes(player.kingdom);
  return canKingdomFitDominoes(
    player.kingdom,
    game.rules.basic.maxKingdomSize,
    remaining,
  );
};
