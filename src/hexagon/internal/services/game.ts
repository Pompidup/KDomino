import type { DominoesRepository } from "../../ports/driven/dominoesRepository.js";
import type { Position } from "../entities/kingdom.js";
import type { Game } from "../entities/game.js";
import { init } from "./init.js";
import { setup } from "./setup.js";
import { startTurn } from "./startTurn.js";
import { pick } from "./pick.js";
import { place } from "./place.js";
import { definePlayerOrder } from "./order.js";
import { draw } from "./draw.js";
import { calculateScore } from "./scoring.js";
import { pass } from "./pass.js";
import type { UuidMethod } from "../../ports/driven/uuidMethod.js";
import type { ShuffleMethod } from "../../ports/driven/shuffleMethod.js";

export type GameDependencies = {
  dominoesRepository: DominoesRepository;
  uuidMethod: UuidMethod;
  shuffleMethod: ShuffleMethod;
};

export const playerAction = {
  pick: "pick",
  place: "place",
  pass: "pass",
} as const;

type ObjectValues<T> = T[keyof T];

export type PlayerAction = ObjectValues<typeof playerAction>;

type PickData = {
  state: Game;
  dominoPick: number;
};

type PlaceData = {
  state: Game;
  position: Position;
  orientation: "vertical" | "horizontal";
  rotation: 0 | 180;
};

type PassData = {
  state: Game;
};

type ActionToDataMap = {
  pick: PickData;
  place: PlaceData;
  pass: PassData;
};

export type PlayerActionPayload<T extends PlayerAction> = {
  lordId: string;
  action: T;
  data: ActionToDataMap[T];
};

const gameStep = (dependencies: GameDependencies) => {
  return {
    init: init(dependencies),
    setup: setup(dependencies),
    startTurn,
    pick,
    place,
    pass,
    definePlayerOrder,
    draw,
    calculateScore,
  };
};

export const isLordTurn = (state: Game, lordId: string): boolean => {
  const { lords, currentDominoes } = state;
  const currentLordOrder = lords.find((lord) => lord.id === lordId)?.order;

  const pickedDominoes = currentDominoes.filter(
    (currentDomino) => currentDomino.picked
  );

  if (currentLordOrder !== pickedDominoes.length + 1) {
    return false;
  }

  return true;
};

export type CustomError = {
  error: string;
};

export const checkValidityDomino = (state: Game, dominoPick: number) => {
  const { currentDominoes } = state;
  const domino = currentDominoes.find(
    (currentDomino) => currentDomino.domino.number === dominoPick
  );

  if (!domino) {
    const error: CustomError = {
      error: "Domino not found",
    };

    return error;
  }

  if (domino.picked) {
    const error: CustomError = {
      error: "Domino already picked",
    };
    return error;
  }

  return domino;
};

// 2 players => 24 dominoes, 2 lords, 4 dominoes per turn, 6 turns
// 3 players => 36 dominoes, 1 lord, 3 dominoes per turn, 12 turns
// 4 players => 48 dominoes, 1 lord, 4 dominoes per turn, 12 turns
export const rules: {
  [key: number]: {
    lords: number;
    maxDominoes: number;
    dominoesPerTurn: number;
    maxTurns: number;
  };
} = {
  2: {
    lords: 2,
    maxDominoes: 24,
    dominoesPerTurn: 4,
    maxTurns: 6,
  },
  3: {
    lords: 1,
    maxDominoes: 36,
    dominoesPerTurn: 3,
    maxTurns: 12,
  },
  4: {
    lords: 1,
    maxDominoes: 48,
    dominoesPerTurn: 4,
    maxTurns: 12,
  },
};

export default gameStep;
