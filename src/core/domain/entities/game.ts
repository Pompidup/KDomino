import {
  gameSteps,
  type Domino,
  type GameMode,
  type GameWithNextStep,
} from "@core/domain/types/index.js";

export const create = (payload: {
  id: string;
  mode: GameMode;
  dominoes: Domino[];
}): GameWithNextStep => {
  const { id, mode, dominoes } = payload;
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
      },
      extra: [],
    },
    mode,
  };
};
