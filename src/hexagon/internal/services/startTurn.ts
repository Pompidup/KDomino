import type { Game } from "../entities/game.js";

type StartTurnPayload = {
  state: Game;
};

const startTurn = (payload: StartTurnPayload): { game: Game } => {
  const { state } = payload;

  const turn = state.turn + 1;
  const lords = state.lords;

  lords.forEach((lord) => {
    lord.turnEnded = false;
    lord.hasPick = false;
    lord.hasPlace = false;
  });

  const updatedState = {
    ...state,
    lords,
    turn,
  };

  return { game: updatedState };
};

export { startTurn };
