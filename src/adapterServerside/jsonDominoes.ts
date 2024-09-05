import type { Domino, Ground } from "@core/domain/types/domino.js";
import type { GameMode } from "@core/domain/types/mode.js";
import type { DominoesRepository } from "@core/portServerside/dominoesRepository.js";
import dominoesJson from "../datasources/dominoes.json" assert { type: "json" };

const jsonDominoes = (): DominoesRepository => {
  const dominoes: Record<string, Domino[]> = {};

  for (const [key, value] of Object.entries(dominoesJson)) {
    const currentDominoes: Domino[] = [];
    value.forEach((domino) => {
      currentDominoes.push({
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

    dominoes[key] = currentDominoes;
  }

  return {
    getForMode: (mode: GameMode) => {
      return dominoes[mode.name] || [];
    },
  };
};

export default jsonDominoes;
