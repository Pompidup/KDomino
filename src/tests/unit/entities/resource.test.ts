import {
  getValidResourcePayments,
  isValidResourcePayment,
} from "@core/domain/entities/resource.js";
import type { Position } from "@core/domain/types/kingdom.js";
import type { Resource, ResourceType } from "@core/domain/types/origins.js";
import { describe, expect, test } from "vitest";

const TYPES: ResourceType[] = ["mammoth", "fish", "mushroom", "flint"];

const key = (positions: Position[]): string =>
  positions
    .map((p) => `${p.x},${p.y}`)
    .sort()
    .join("|");

/** Every subset of `count` resources, without any pruning. */
const allSubsets = (resources: Resource[], count: number): Position[][] => {
  if (count === 0) return [[]];
  return resources.flatMap((resource, index) =>
    allSubsets(resources.slice(index + 1), count - 1).map((rest) => [
      resource.position,
      ...rest,
    ]),
  );
};

const makeResources = (seed: number, size: number): Resource[] => {
  let state = seed;
  const next = () => {
    state = (Math.imul(state, 1103515245) + 12345) >>> 0;
    return state;
  };
  return Array.from({ length: size }, (_, i) => ({
    type: TYPES[next() % TYPES.length]!,
    position: { x: i % 5, y: Math.floor(i / 5) },
  }));
};

describe("getValidResourcePayments", () => {
  test.each([
    [2, 2],
    [4, 4],
    [3, 2],
  ])("lists exactly the valid payments of %i resources with %i types", (count, types) => {
    for (let seed = 1; seed <= 25; seed++) {
      const resources = makeResources(seed, seed % 13);
      const expected = allSubsets(resources, count)
        .filter((payment) =>
          isValidResourcePayment(resources, payment, count, types),
        )
        .map(key)
        .sort();
      const actual = getValidResourcePayments(resources, count, types)
        .map(key)
        .sort();
      expect(actual).toEqual(expected);
    }
  });

  test("returns nothing without enough resource types", () => {
    const resources: Resource[] = [
      { type: "fish", position: { x: 0, y: 0 } },
      { type: "fish", position: { x: 1, y: 0 } },
      { type: "flint", position: { x: 2, y: 0 } },
    ];
    expect(getValidResourcePayments(resources, 4, 4)).toEqual([]);
    expect(getValidResourcePayments(resources, 2, 2)).toEqual([
      [
        { x: 0, y: 0 },
        { x: 2, y: 0 },
      ],
      [
        { x: 1, y: 0 },
        { x: 2, y: 0 },
      ],
    ]);
  });
});
