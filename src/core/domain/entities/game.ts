import type { BuildingTile } from "@core/domain/types/building.js";
import {
  gameSteps,
  type Domino,
  type GameMode,
  type GameWithNextStep,
} from "@core/domain/types/index.js";
import type { OriginsState } from "@core/domain/types/origins.js";
import type { QueenDominoState } from "@core/domain/types/queendomino.js";
import { createFireTokenPool } from "./fireToken.js";
import type { CavemanTile } from "@core/domain/types/origins.js";
import {
  getOriginsSubMode,
  isOriginsMode,
  isTotemMode,
  isTribeMode,
} from "./originsHelpers.js";

export const create = (payload: {
  id: string;
  mode: GameMode;
  dominoes: Domino[];
  seed?: string;
  buildings?: BuildingTile[];
  cavemen?: CavemanTile[];
}): GameWithNextStep => {
  const { id, mode, dominoes, seed, buildings, cavemen } = payload;

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

  let origins: OriginsState | undefined;
  if (isOriginsMode(mode.name)) {
    const subMode = getOriginsSubMode(mode.name)!;
    origins = {
      subMode,
      fireTokenPool: createFireTokenPool(),
      ...(isTotemMode(mode.name) && {
        totems: {
          mammoth: null,
          fish: null,
          mushroom: null,
          flint: null,
        },
      }),
      ...(isTribeMode(mode.name) &&
        cavemen && {
          caveBoard: {
            visible: [],
            drawPile: cavemen,
          },
        }),
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
    ...(origins !== undefined && { origins }),
  };
};
