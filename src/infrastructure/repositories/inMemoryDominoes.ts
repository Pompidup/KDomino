import type { Domino, Ground } from "../../domain/entities/domino";
import dominoesJson from "../data/dominoes.json" assert { type: "json" };
import type { DominoesRepository } from "../../domain/port/dominoesRepository";

const inMemoryDominoes = (): DominoesRepository => {
  const dominoes: Domino[] = [];

  dominoesJson.forEach((domino) => {
    dominoes.push({
      left: {
        type: <Ground>domino.left.type,
        crowns: domino.left.crowns,
      },
      right: {
        type: <Ground>domino.right.type,
        crowns: domino.right.crowns,
      },
      number: domino.number,
    });
  });

  return {
    getAll: async () => {
      return dominoes;
    },
  };
};

export default inMemoryDominoes;
