import type { Game } from "../../entities/game.js";

type StartTurnPayload = {
  state: Game;
};

const startTurn =
  () =>
  async (payload: StartTurnPayload): Promise<{ game: Game }> => {
    const { state } = payload;

    const turn = state.turn + 1;
    const kings = state.kings;

    kings.forEach((king) => {
      king.turnEnded = false;
      king.hasPick = false;
      king.hasPlace = false;
    });

    const updatedState = {
      ...state,
      kings,
      turn,
    };

    return { game: updatedState };
  };

export { startTurn };
