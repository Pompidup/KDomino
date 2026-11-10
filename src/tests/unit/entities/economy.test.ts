import {
  addBonusKnights,
  addCoins,
  addTowers,
  COINS_PER_WEALTH_POINT,
  canAfford,
  DRAGON_COST,
  getMaxKnights,
  getTowerCount,
  getWealthPoints,
  initializeCoins,
  QUEEN_DISCOUNT,
  removeCoins,
  STARTING_COINS,
  STARTING_KNIGHTS,
} from "@core/domain/entities/economy.js";
import type { Player } from "@core/domain/types/player.js";
import { describe, expect, it } from "vitest";

const makePlayer = (coins = 0, towers = 0): Player => ({
  id: "p1",
  name: "Alice",
  kingdom: [],
  coins,
  towers,
});

describe("economy", () => {
  it("should initialize coins to 7", () => {
    expect(initializeCoins()).toBe(STARTING_COINS);
    expect(STARTING_COINS).toBe(7);
  });

  it("should add coins to player", () => {
    const player = makePlayer(5);
    const updated = addCoins(player, 3);
    expect(updated.coins).toBe(8);
  });

  it("should remove coins from player", () => {
    const player = makePlayer(5);
    const updated = removeCoins(player, 2);
    expect(updated.coins).toBe(3);
  });

  it("should handle undefined coins as 0", () => {
    const player: Player = { id: "p1", name: "Alice", kingdom: [] };
    const updated = addCoins(player, 3);
    expect(updated.coins).toBe(3);
  });

  it("should check affordability", () => {
    expect(canAfford(makePlayer(5), 3)).toBe(true);
    expect(canAfford(makePlayer(5), 5)).toBe(true);
    expect(canAfford(makePlayer(5), 6)).toBe(false);
  });

  it("should add towers", () => {
    const player = makePlayer(0, 1);
    const updated = addTowers(player, 2);
    expect(updated.towers).toBe(3);
  });

  it("should get tower count", () => {
    expect(getTowerCount(makePlayer(0, 3))).toBe(3);
    expect(getTowerCount({ id: "p1", name: "A", kingdom: [] })).toBe(0);
  });

  it("follows the official constants", () => {
    expect(STARTING_KNIGHTS).toBe(1);
    expect(DRAGON_COST).toBe(1);
    expect(QUEEN_DISCOUNT).toBe(1);
    expect(COINS_PER_WEALTH_POINT).toBe(3);
  });

  it("counts the starting knight plus the bonus knights", () => {
    expect(getMaxKnights(makePlayer())).toBe(1);
    expect(getMaxKnights(addBonusKnights(makePlayer(), 2))).toBe(3);
  });

  it("scores 1 Wealth point per 3 unused coins", () => {
    expect(getWealthPoints(makePlayer(0))).toBe(0);
    expect(getWealthPoints(makePlayer(2))).toBe(0);
    expect(getWealthPoints(makePlayer(3))).toBe(1);
    expect(getWealthPoints(makePlayer(11))).toBe(3);
    expect(getWealthPoints({ id: "p1", name: "A", kingdom: [] })).toBe(0);
  });

  it("should not mutate original player", () => {
    const player = makePlayer(5, 1);
    addCoins(player, 3);
    removeCoins(player, 2);
    addTowers(player, 1);
    expect(player.coins).toBe(5);
    expect(player.towers).toBe(1);
  });
});
