import type { Game } from "../../entities/game.js";

type DrawPayload = {
  state: Game;
};

const draw = (payload: DrawPayload): Game => {
  const { state } = payload;

  const dominoesCopy = [...state.dominoes];
  const dominoesDrawn = dominoesCopy.splice(0, state.dominoesPerTurn);
  dominoesDrawn.sort((a, b) => a.number - b.number);

  const newState = {
    ...state,
    dominoes: dominoesCopy,
    currentDominoes: dominoesDrawn.map((domino, index) => {
      return {
        domino,
        picked: false,
        kingId: null,
        position: index + 1,
      };
    }),
  };

  return newState;
};

export { draw };
