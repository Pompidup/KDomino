import {
  createGiantPool,
  takeFromGiantPool,
  findCrownsInKingdom,
  findCrownsNotCoveredByGiants,
  playerHasGiant,
  placeGiantOnCrown,
  sendGiantToOpponent,
} from "@core/domain/entities/giant.js";
import { ErrorCode } from "@core/domain/errors/domainErrors.js";
import { GRIDSIZE } from "@core/domain/types/kingdom.js";
import type { Player } from "@core/domain/types/player.js";
import { isErr, isOk } from "@utils/result.js";
import { describe, expect, it } from "vitest";

const emptyKingdom = () =>
  Array.from({ length: GRIDSIZE }, () =>
    Array.from({ length: GRIDSIZE }, () => ({
      type: "empty" as const,
      crowns: 0 as const,
    })),
  );

const makePlayer = (overrides?: Partial<Player>): Player => ({
  id: "p1",
  name: "Alice",
  kingdom: emptyKingdom(),
  giants: [],
  ...overrides,
});

describe("createGiantPool", () => {
  it("returns 6", () => {
    expect(createGiantPool()).toBe(6);
  });
});

describe("takeFromGiantPool", () => {
  it("decrements pool by 1", () => {
    const result = takeFromGiantPool(6);
    expect(isOk(result)).toBe(true);
    if (isOk(result)) expect(result.value).toBe(5);
  });

  it("returns error when pool is empty", () => {
    const result = takeFromGiantPool(0);
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error).toBe(ErrorCode.GIANT_POOL_EMPTY);
  });
});

describe("findCrownsInKingdom", () => {
  it("returns empty array for empty kingdom", () => {
    const kingdom = emptyKingdom();
    expect(findCrownsInKingdom(kingdom)).toEqual([]);
  });

  it("finds crowns on tiles", () => {
    const kingdom = emptyKingdom();
    kingdom[3]![3] = { type: "wheat", crowns: 1 };
    kingdom[5]![5] = { type: "forest", crowns: 2 };

    const crowns = findCrownsInKingdom(kingdom);
    expect(crowns).toHaveLength(2);
    expect(crowns).toContainEqual({ x: 3, y: 3 });
    expect(crowns).toContainEqual({ x: 5, y: 5 });
  });

  it("ignores tiles with 0 crowns", () => {
    const kingdom = emptyKingdom();
    kingdom[3]![3] = { type: "wheat", crowns: 0 };

    expect(findCrownsInKingdom(kingdom)).toEqual([]);
  });

  it("ignores castle tile", () => {
    const kingdom = emptyKingdom();
    kingdom[4]![4] = { type: "castle", crowns: 0 };

    expect(findCrownsInKingdom(kingdom)).toEqual([]);
  });
});

describe("findCrownsNotCoveredByGiants", () => {
  it("returns all crowns when no giants", () => {
    const kingdom = emptyKingdom();
    kingdom[3]![3] = { type: "wheat", crowns: 1 };
    kingdom[5]![5] = { type: "forest", crowns: 2 };

    const result = findCrownsNotCoveredByGiants(kingdom, []);
    expect(result).toHaveLength(2);
  });

  it("excludes positions covered by giants", () => {
    const kingdom = emptyKingdom();
    kingdom[3]![3] = { type: "wheat", crowns: 1 };
    kingdom[5]![5] = { type: "forest", crowns: 2 };

    const giants = [{ position: { x: 3, y: 3 } }];
    const result = findCrownsNotCoveredByGiants(kingdom, giants);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ x: 5, y: 5 });
  });
});

describe("playerHasGiant", () => {
  it("returns false when no giants", () => {
    expect(playerHasGiant(makePlayer({ giants: [] }))).toBe(false);
  });

  it("returns false when giants is undefined", () => {
    expect(playerHasGiant(makePlayer({ giants: undefined }))).toBe(false);
  });

  it("returns true when player has giants", () => {
    const player = makePlayer({
      giants: [{ position: { x: 3, y: 3 } }],
    });
    expect(playerHasGiant(player)).toBe(true);
  });
});

describe("placeGiantOnCrown", () => {
  it("places a giant on a tile with a crown", () => {
    const kingdom = emptyKingdom();
    kingdom[3]![3] = { type: "wheat", crowns: 1 };
    const player = makePlayer({ kingdom });

    const result = placeGiantOnCrown(player, { x: 3, y: 3 });
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.giants).toHaveLength(1);
      expect(result.value.giants![0]!.position).toEqual({ x: 3, y: 3 });
    }
  });

  it("rejects placement on empty tile", () => {
    const player = makePlayer();
    const result = placeGiantOnCrown(player, { x: 0, y: 0 });
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error).toBe(ErrorCode.INVALID_GIANT_PLACEMENT);
  });

  it("rejects placement on tile with 0 crowns", () => {
    const kingdom = emptyKingdom();
    kingdom[3]![3] = { type: "wheat", crowns: 0 };
    const player = makePlayer({ kingdom });

    const result = placeGiantOnCrown(player, { x: 3, y: 3 });
    expect(isErr(result)).toBe(true);
  });

  it("rejects placement on already covered crown", () => {
    const kingdom = emptyKingdom();
    kingdom[3]![3] = { type: "wheat", crowns: 1 };
    const player = makePlayer({
      kingdom,
      giants: [{ position: { x: 3, y: 3 } }],
    });

    const result = placeGiantOnCrown(player, { x: 3, y: 3 });
    expect(isErr(result)).toBe(true);
  });

  it("rejects placement on castle tile", () => {
    const kingdom = emptyKingdom();
    kingdom[4]![4] = { type: "castle", crowns: 0 };
    const player = makePlayer({ kingdom });

    const result = placeGiantOnCrown(player, { x: 4, y: 4 });
    expect(isErr(result)).toBe(true);
  });
});

describe("sendGiantToOpponent", () => {
  it("moves a giant from source to target", () => {
    const sourceKingdom = emptyKingdom();
    sourceKingdom[3]![3] = { type: "wheat", crowns: 1 };
    const source = makePlayer({
      id: "p1",
      kingdom: sourceKingdom,
      giants: [{ position: { x: 3, y: 3 } }],
    });

    const targetKingdom = emptyKingdom();
    targetKingdom[5]![5] = { type: "forest", crowns: 2 };
    const target = makePlayer({
      id: "p2",
      name: "Bob",
      kingdom: targetKingdom,
      giants: [],
    });

    const result = sendGiantToOpponent(source, target, 0, { x: 5, y: 5 });
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.source.giants).toHaveLength(0);
      expect(result.value.target.giants).toHaveLength(1);
      expect(result.value.target.giants![0]!.position).toEqual({ x: 5, y: 5 });
    }
  });

  it("returns error for invalid giant index", () => {
    const source = makePlayer({ giants: [] });
    const target = makePlayer({ id: "p2" });

    const result = sendGiantToOpponent(source, target, 0, { x: 5, y: 5 });
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error).toBe(ErrorCode.GIANT_NOT_FOUND);
  });

  it("returns error if target position has no crown", () => {
    const source = makePlayer({
      giants: [{ position: { x: 3, y: 3 } }],
    });
    const target = makePlayer({ id: "p2" });

    const result = sendGiantToOpponent(source, target, 0, { x: 0, y: 0 });
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error).toBe(ErrorCode.INVALID_GIANT_PLACEMENT);
  });

  it("returns error if target crown is already covered", () => {
    const source = makePlayer({
      giants: [{ position: { x: 3, y: 3 } }],
    });

    const targetKingdom = emptyKingdom();
    targetKingdom[5]![5] = { type: "forest", crowns: 2 };
    const target = makePlayer({
      id: "p2",
      kingdom: targetKingdom,
      giants: [{ position: { x: 5, y: 5 } }],
    });

    const result = sendGiantToOpponent(source, target, 0, { x: 5, y: 5 });
    expect(isErr(result)).toBe(true);
  });
});
