import type { Domino, Ground } from "../../hexagon/internal/entities/domino.js";
import dominoesJson from "../../datasources/dominoes.json" assert { type: "json" };
import type { DominoesRepository } from "../../hexagon/ports/driven/dominoesRepository.js";

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
    getAll: () => {
      return dominoes;
    },
  };
};

export default inMemoryDominoes;
