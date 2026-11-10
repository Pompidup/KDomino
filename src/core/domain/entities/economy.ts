import type { Player } from "@core/domain/types/player.js";

/** Default starting coins for each player in Queendomino */
export const STARTING_COINS = 7;

/** Maximum number of knights a player can place */
export const MAX_KNIGHTS = 3;

export const initializeCoins = (): number => STARTING_COINS;

export const addCoins = (player: Player, amount: number): Player => ({
  ...player,
  coins: (player.coins ?? 0) + amount,
});

export const removeCoins = (player: Player, amount: number): Player => ({
  ...player,
  coins: (player.coins ?? 0) - amount,
});

export const canAfford = (player: Player, cost: number): boolean =>
  (player.coins ?? 0) >= cost;

export const addTowers = (player: Player, amount: number): Player => ({
  ...player,
  towers: (player.towers ?? 0) + amount,
});

export const getTowerCount = (player: Player): number => player.towers ?? 0;

/** Grant extra knights (building immediate bonus), raising the knight limit. */
export const addBonusKnights = (player: Player, amount: number): Player => ({
  ...player,
  bonusKnights: (player.bonusKnights ?? 0) + amount,
});

/** Maximum number of knights the player may place (base + building bonuses). */
export const getMaxKnights = (player: Player): number =>
  MAX_KNIGHTS + (player.bonusKnights ?? 0);
