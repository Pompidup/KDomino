import { describe, it, expect } from "vitest";
import { createSeededShuffle } from "@utils/seededShuffle.js";

describe("createSeededShuffle", () => {
  const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  it("should produce the same result with the same seed and salt", () => {
    const shuffle1 = createSeededShuffle("my-seed", "dominoes");
    const shuffle2 = createSeededShuffle("my-seed", "dominoes");

    const result1 = shuffle1([...input]);
    const result2 = shuffle2([...input]);

    expect(result1).toEqual(result2);
  });

  it("should produce different results with different seeds", () => {
    const shuffle1 = createSeededShuffle("seed-A", "dominoes");
    const shuffle2 = createSeededShuffle("seed-B", "dominoes");

    const result1 = shuffle1([...input]);
    const result2 = shuffle2([...input]);

    expect(result1).not.toEqual(result2);
  });

  it("should produce different results with different salts", () => {
    const shuffle1 = createSeededShuffle("my-seed", "dominoes");
    const shuffle2 = createSeededShuffle("my-seed", "lords");

    const result1 = shuffle1([...input]);
    const result2 = shuffle2([...input]);

    expect(result1).not.toEqual(result2);
  });

  it("should return a valid permutation (same elements)", () => {
    const shuffle = createSeededShuffle("test-seed", "test-salt");
    const result = shuffle([...input]);

    expect(result).toHaveLength(input.length);
    expect(result.sort((a, b) => a - b)).toEqual(input);
  });

  it("should not mutate the input array", () => {
    const shuffle = createSeededShuffle("my-seed", "dominoes");
    const original = [...input];
    shuffle(original);

    expect(original).toEqual(input);
  });

  it("should handle empty arrays", () => {
    const shuffle = createSeededShuffle("my-seed", "dominoes");
    expect(shuffle([])).toEqual([]);
  });

  it("should handle single-element arrays", () => {
    const shuffle = createSeededShuffle("my-seed", "dominoes");
    expect(shuffle([42])).toEqual([42]);
  });
});
