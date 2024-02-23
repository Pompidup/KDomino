import type { DominoesRepository } from "../../port/dominoesRepository.js";
import type { GamesRepository } from "../../port/gamesRepository.js";
import type { Position } from "../../entities/kingdom.js";
import type { Game } from "../../entities/game.js";
import { init } from "./init.js";
import { setup } from "./setup.js";
import { startTurn } from "./startTurn.js";
import { pick } from "./pick.js";
import { place } from "./place.js";
import { endTurn } from "./endTurn.js";
import { firstTurn } from "./firstTurn.js";

export type GameDependencies = {
  dominoesRepository: DominoesRepository;
  gamesRepository: GamesRepository;
  uuidMethod: () => string;
  randomMethod<T>(array: T[]): T[];
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
  kingId: string;
  action: T;
  data: ActionToDataMap[T];
};

const gameStep = (dependencies: GameDependencies) => {
  return {
    init: init(dependencies),
    setup: setup(dependencies),
    getGame: (gameId: string) => dependencies.gamesRepository.get(gameId),
    firstTurn: firstTurn(dependencies),
    startTurn: startTurn(dependencies),
    pick: pick(dependencies),
    place: place(dependencies),
    endTurn: endTurn(dependencies),
  };
};

export const isKingTurn = (state: Game, kingId: string): boolean => {
  const { kings, currentDominoes } = state;
  const currentKingOrder = kings.find((king) => king.id === kingId)?.order;

  const pickedDominoes = currentDominoes.filter(
    (currentDomino) => currentDomino.picked
  );

  if (currentKingOrder !== pickedDominoes.length + 1) {
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

// 2 players => 24 dominoes, 2 kings, 4 dominoes per turn, 6 turns
// 3 players => 36 dominoes, 1 king, 3 dominoes per turn, 12 turns
// 4 players => 48 dominoes, 1 king, 4 dominoes per turn, 12 turns
export const rules: {
  [key: number]: {
    kings: number;
    maxDominoes: number;
    dominoesPerTurn: number;
    maxTurns: number;
  };
} = {
  2: {
    kings: 2,
    maxDominoes: 24,
    dominoesPerTurn: 4,
    maxTurns: 6,
  },
  3: {
    kings: 1,
    maxDominoes: 36,
    dominoesPerTurn: 3,
    maxTurns: 12,
  },
  4: {
    kings: 1,
    maxDominoes: 48,
    dominoesPerTurn: 4,
    maxTurns: 12,
  },
};

export default gameStep;
