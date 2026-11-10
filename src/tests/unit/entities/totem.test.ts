import {
  calculateTotemScore,
  determineTotemHolders,
  refreshTotemHolders,
} from "@core/domain/entities/totem.js";
import type {
  OriginsState,
  ResourceType,
  TotemState,
} from "@core/domain/types/origins.js";
import type { Player } from "@core/domain/types/player.js";
import { describe, expect, test } from "vitest";

const noTotems: TotemState = {
  mammoth: null,
  fish: null,
  mushroom: null,
  flint: null,
};

const player = (id: string, resources: Partial<Record<ResourceType, number>>) =>
  ({
    id,
    resources: Object.entries(resources).flatMap(([type, count], typeIndex) =>
      Array.from({ length: count ?? 0 }, (_, i) => ({
        type: type as ResourceType,
        position: { x: i, y: typeIndex },
      })),
    ),
  }) as unknown as Player;

describe("determineTotemHolders", () => {
  test("gives a totem to the player with the strict majority", () => {
    const totems = determineTotemHolders(
      [player("p1", { mammoth: 2, fish: 1 }), player("p2", { mammoth: 1 })],
      noTotems,
    );
    expect(totems).toEqual({
      mammoth: "p1",
      fish: "p1",
      mushroom: null,
      flint: null,
    });
  });

  test("leaves an unclaimed totem unclaimed while the majority is tied", () => {
    const totems = determineTotemHolders(
      [player("p1", { fish: 2 }), player("p2", { fish: 2 })],
      noTotems,
    );
    expect(totems.fish).toBeNull();
  });

  test("lets the holder keep the totem when another player ties", () => {
    const totems = determineTotemHolders(
      [player("p1", { fish: 2 }), player("p2", { fish: 2 })],
      { ...noTotems, fish: "p2" },
    );
    expect(totems.fish).toBe("p2");
  });

  test("passes the totem to a player who gets strictly more", () => {
    const totems = determineTotemHolders(
      [player("p1", { flint: 3 }), player("p2", { flint: 2 })],
      { ...noTotems, flint: "p2" },
    );
    expect(totems.flint).toBe("p1");
  });

  test("passes the totem on when the holder loses the majority to a tie", () => {
    // p1 lost resources to a fire: p2 and p3 now share the majority
    const totems = determineTotemHolders(
      [
        player("p1", { mushroom: 1 }),
        player("p2", { mushroom: 2 }),
        player("p3", { mushroom: 2 }),
      ],
      { ...noTotems, mushroom: "p1" },
    );
    expect(totems.mushroom).toBe("p2");
  });

  test("returns a totem when nobody has the resource anymore", () => {
    const totems = determineTotemHolders([player("p1", {}), player("p2", {})], {
      ...noTotems,
      mammoth: "p1",
    });
    expect(totems.mammoth).toBeNull();
  });
});

describe("refreshTotemHolders", () => {
  test("leaves states without totems unchanged", () => {
    const origins: OriginsState = {
      subMode: "Tribe",
      fireTokenPool: { ones: 5, twos: 4, threes: 1 },
    };
    expect(refreshTotemHolders(origins, [player("p1", { fish: 1 })])).toBe(
      origins,
    );
    expect(refreshTotemHolders(undefined, [])).toBeUndefined();
  });

  test("updates the totems of a Totem state", () => {
    const origins: OriginsState = {
      subMode: "Totem",
      fireTokenPool: { ones: 5, twos: 4, threes: 1 },
      totems: noTotems,
    };
    expect(
      refreshTotemHolders(origins, [player("p1", { fish: 1 })])?.totems,
    ).toEqual({ ...noTotems, fish: "p1" });
  });
});

describe("calculateTotemScore", () => {
  test("adds 1 point per resource and 3 points per totem held", () => {
    const p1 = player("p1", { mammoth: 2, fish: 1 });
    expect(
      calculateTotemScore(p1, { ...noTotems, mammoth: "p1", fish: "p1" }),
    ).toBe(3 + 2 * 3);
  });
});
