import type { Domino } from "../../core/domain/types/domino.js";

const defaultDominoes: Domino[] = [
  {
    left: {
      type: "wheat",
      crowns: 0,
    },
    right: {
      type: "wheat",
      crowns: 0,
    },
    number: 1,
  },
  {
    left: {
      type: "wheat",
      crowns: 0,
    },
    right: {
      type: "wheat",
      crowns: 0,
    },
    number: 2,
  },
  {
    left: {
      type: "forest",
      crowns: 0,
    },
    right: {
      type: "forest",
      crowns: 0,
    },
    number: 3,
  },
  {
    left: {
      type: "forest",
      crowns: 0,
    },
    right: {
      type: "forest",
      crowns: 0,
    },
    number: 4,
  },
  {
    left: {
      type: "forest",
      crowns: 0,
    },
    right: {
      type: "forest",
      crowns: 0,
    },
    number: 5,
  },
  {
    left: {
      type: "forest",
      crowns: 0,
    },
    right: {
      type: "forest",
      crowns: 0,
    },
    number: 6,
  },
  {
    left: {
      type: "sea",
      crowns: 0,
    },
    right: {
      type: "sea",
      crowns: 0,
    },
    number: 7,
  },
  {
    left: {
      type: "sea",
      crowns: 0,
    },
    right: {
      type: "sea",
      crowns: 0,
    },
    number: 8,
  },
  {
    left: {
      type: "sea",
      crowns: 0,
    },
    right: {
      type: "sea",
      crowns: 0,
    },
    number: 9,
  },
  {
    left: {
      type: "plain",
      crowns: 0,
    },
    right: {
      type: "plain",
      crowns: 0,
    },
    number: 10,
  },
  {
    left: {
      type: "plain",
      crowns: 0,
    },
    right: {
      type: "plain",
      crowns: 0,
    },
    number: 11,
  },
  {
    left: {
      type: "swamp",
      crowns: 0,
    },
    right: {
      type: "swamp",
      crowns: 0,
    },
    number: 12,
  },
  {
    left: {
      type: "wheat",
      crowns: 0,
    },
    right: {
      type: "forest",
      crowns: 0,
    },
    number: 13,
  },
  {
    left: {
      type: "wheat",
      crowns: 0,
    },
    right: {
      type: "sea",
      crowns: 0,
    },
    number: 14,
  },
  {
    left: {
      type: "wheat",
      crowns: 0,
    },
    right: {
      type: "plain",
      crowns: 0,
    },
    number: 15,
  },
  {
    left: {
      type: "wheat",
      crowns: 0,
    },
    right: {
      type: "swamp",
      crowns: 0,
    },
    number: 16,
  },
  {
    left: {
      type: "forest",
      crowns: 0,
    },
    right: {
      type: "sea",
      crowns: 0,
    },
    number: 17,
  },
  {
    left: {
      type: "forest",
      crowns: 0,
    },
    right: {
      type: "plain",
      crowns: 0,
    },
    number: 18,
  },
  {
    left: {
      type: "wheat",
      crowns: 1,
    },
    right: {
      type: "forest",
      crowns: 0,
    },
    number: 19,
  },
  {
    left: {
      type: "wheat",
      crowns: 1,
    },
    right: {
      type: "sea",
      crowns: 0,
    },
    number: 20,
  },
  {
    left: {
      type: "wheat",
      crowns: 1,
    },
    right: {
      type: "plain",
      crowns: 0,
    },
    number: 21,
  },
  {
    left: {
      type: "wheat",
      crowns: 1,
    },
    right: {
      type: "swamp",
      crowns: 0,
    },
    number: 22,
  },
  {
    left: {
      type: "wheat",
      crowns: 1,
    },
    right: {
      type: "mine",
      crowns: 0,
    },
    number: 23,
  },
  {
    left: {
      type: "forest",
      crowns: 1,
    },
    right: {
      type: "wheat",
      crowns: 0,
    },
    number: 24,
  },
  {
    left: {
      type: "forest",
      crowns: 1,
    },
    right: {
      type: "wheat",
      crowns: 0,
    },
    number: 25,
  },
  {
    left: {
      type: "forest",
      crowns: 1,
    },
    right: {
      type: "wheat",
      crowns: 0,
    },
    number: 26,
  },
  {
    left: {
      type: "forest",
      crowns: 1,
    },
    right: {
      type: "wheat",
      crowns: 0,
    },
    number: 27,
  },
  {
    left: {
      type: "forest",
      crowns: 1,
    },
    right: {
      type: "sea",
      crowns: 0,
    },
    number: 28,
  },
  {
    left: {
      type: "forest",
      crowns: 1,
    },
    right: {
      type: "plain",
      crowns: 0,
    },
    number: 29,
  },
  {
    left: {
      type: "sea",
      crowns: 1,
    },
    right: {
      type: "wheat",
      crowns: 0,
    },
    number: 30,
  },
  {
    left: {
      type: "sea",
      crowns: 1,
    },
    right: {
      type: "wheat",
      crowns: 0,
    },
    number: 31,
  },
  {
    left: {
      type: "sea",
      crowns: 1,
    },
    right: {
      type: "forest",
      crowns: 0,
    },
    number: 32,
  },
  {
    left: {
      type: "sea",
      crowns: 1,
    },
    right: {
      type: "forest",
      crowns: 0,
    },
    number: 33,
  },
  {
    left: {
      type: "sea",
      crowns: 1,
    },
    right: {
      type: "forest",
      crowns: 0,
    },
    number: 34,
  },
  {
    left: {
      type: "sea",
      crowns: 1,
    },
    right: {
      type: "forest",
      crowns: 0,
    },
    number: 35,
  },
  {
    left: {
      type: "wheat",
      crowns: 0,
    },
    right: {
      type: "plain",
      crowns: 1,
    },
    number: 36,
  },
  {
    left: {
      type: "sea",
      crowns: 0,
    },
    right: {
      type: "plain",
      crowns: 1,
    },
    number: 37,
  },
  {
    left: {
      type: "wheat",
      crowns: 0,
    },
    right: {
      type: "swamp",
      crowns: 1,
    },
    number: 38,
  },
  {
    left: {
      type: "plain",
      crowns: 0,
    },
    right: {
      type: "swamp",
      crowns: 0,
    },
    number: 39,
  },
  {
    left: {
      type: "mine",
      crowns: 1,
    },
    right: {
      type: "wheat",
      crowns: 0,
    },
    number: 40,
  },
  {
    left: {
      type: "wheat",
      crowns: 0,
    },
    right: {
      type: "plain",
      crowns: 2,
    },
    number: 41,
  },
  {
    left: {
      type: "sea",
      crowns: 0,
    },
    right: {
      type: "plain",
      crowns: 2,
    },
    number: 42,
  },
  {
    left: {
      type: "wheat",
      crowns: 0,
    },
    right: {
      type: "swamp",
      crowns: 2,
    },
    number: 43,
  },
  {
    left: {
      type: "plain",
      crowns: 0,
    },
    right: {
      type: "swamp",
      crowns: 2,
    },
    number: 44,
  },
  {
    left: {
      type: "mine",
      crowns: 2,
    },
    right: {
      type: "wheat",
      crowns: 0,
    },
    number: 45,
  },
  {
    left: {
      type: "swamp",
      crowns: 0,
    },
    right: {
      type: "mine",
      crowns: 2,
    },
    number: 46,
  },
  {
    left: {
      type: "swamp",
      crowns: 0,
    },
    right: {
      type: "mine",
      crowns: 2,
    },
    number: 47,
  },
  {
    left: {
      type: "wheat",
      crowns: 0,
    },
    right: {
      type: "mine",
      crowns: 3,
    },
    number: 48,
  },
];

export const createDominoesBuilder = (dominoes: Partial<Domino>[] = []) => ({
  withDominoes: (dominoes: Partial<Domino>[]) =>
    createDominoesBuilder(dominoes),
  build: () => [...defaultDominoes, ...dominoes] as Domino[],
});
