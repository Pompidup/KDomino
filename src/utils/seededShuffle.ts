import type { ShuffleMethod } from "@core/portServerside/shuffleMethod.js";

const hashSeed = (str: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const mulberry32 = (seed: number): (() => number) => {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/**
 * Deterministic pseudo-random generator (values in [0, 1)) derived from a
 * seed and a salt: the same seed and salt always give the same sequence.
 */
export const createSeededRandom = (
  seed: string,
  salt: string,
): (() => number) => mulberry32(hashSeed(`${seed}|${salt}`));

export const createSeededShuffle = (
  seed: string,
  salt: string,
): ShuffleMethod => {
  const random = createSeededRandom(seed, salt);

  return <T>(array: T[]): T[] => {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j] as T, result[i] as T];
    }
    return result;
  };
};
