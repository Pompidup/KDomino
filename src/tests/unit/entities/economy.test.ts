import {
  addCoins,
  addTowers,
  canAfford,
  getTowerCount,
  initializeCoins,
  removeCoins,
  STARTING_COINS,
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

  it("should not mutate original player", () => {
    const player = makePlayer(5, 1);
    addCoins(player, 3);
    removeCoins(player, 2);
    addTowers(player, 1);
    expect(player.coins).toBe(5);
    expect(player.towers).toBe(1);
  });
});
