import type { Player } from "@core/domain/types/player.js";

/** Default starting coins for each player in Queendomino */
export const STARTING_COINS = 7;

/**
 * Knights each player starts with (official rule, Set up J: "Each player also
 * draws one Knight"). Building immediate bonuses grant more (`bonusKnights`).
 */
export const STARTING_KNIGHTS = 1;

/**
 * Base number of knights a player can place, before building bonuses.
 * @deprecated Use `STARTING_KNIGHTS` (kept as an alias of it).
 */
export const MAX_KNIGHTS: number = STARTING_KNIGHTS;

/**
 * Coins paid to bribe the Dragon (official rule, action D: "Pay the bank
 * 1 Coin"), whatever the building burnt.
 */
export const DRAGON_COST = 1;

/**
 * Construction discount of the player hosting the Queen (official rule: "she
 * lowers your construction costs by 1 Coin"). A cost never goes below 0.
 */
export const QUEEN_DISCOUNT = 1;

/** Unused coins needed for 1 point at the end of the game ("Wealth"). */
export const COINS_PER_WEALTH_POINT = 3;

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

/**
 * Number of knights the player owns, placed or not: the starting knight plus
 * the knights granted by building bonuses. It is the maximum number of
 * knights the player may place over the game.
 */
export const getMaxKnights = (player: Player): number =>
  STARTING_KNIGHTS + (player.bonusKnights ?? 0);

/**
 * End-game "Wealth" points (official rule, "End of the Game"): 1 point for
 * every 3 unused coins.
 */
export const getWealthPoints = (player: Player): number =>
  Math.floor(Math.max(0, player.coins ?? 0) / COINS_PER_WEALTH_POINT);
