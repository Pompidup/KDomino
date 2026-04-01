import type { BuildingTile } from "@core/domain/types/building.js";
import {
  gameSteps,
  type Domino,
  type GameMode,
  type GameWithNextStep,
} from "@core/domain/types/index.js";
import type { QueenDominoState } from "@core/domain/types/queendomino.js";

export const create = (payload: {
  id: string;
  mode: GameMode;
  dominoes: Domino[];
  seed?: string;
  buildings?: BuildingTile[];
}): GameWithNextStep => {
  const { id, mode, dominoes, seed, buildings } = payload;

  let queendomino: QueenDominoState | undefined;
  if (mode.name === "QueenDomino" && buildings) {
    queendomino = {
      buildersBoard: {
        slots: [],
        drawPile: buildings,
      },
      queenHolderId: null,
      dragonAvailable: true,
      dragonUsedThisRound: false,
    };
  }

  return {
    id,
    dominoes,
    currentDominoes: [],
    players: [],
    lords: [],
    turn: 0,
    nextAction: {
      type: "step",
      step: gameSteps.addPlayers,
    },
    rules: {
      basic: {
        lords: 0,
        maxDominoes: 0,
        dominoesPerTurn: 0,
        maxTurns: 0,
        maxKingdomSize: 5,
      },
      extra: [],
    },
    mode,
    ...(seed !== undefined && { seed }),
    ...(queendomino !== undefined && { queendomino }),
  };
};
