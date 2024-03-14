import type { Game } from "../../entities/game.js";

type OrderPayload = {
  state: Game;
};

// Rename for more explicit like definePlayerOrder
const order = () => async (payload: OrderPayload) => {
  const { state } = payload;
  const { kings, currentDominoes } = state;

  const allKingsHavePlayed = kings.every((king) => king.turnEnded);

  if (!allKingsHavePlayed) {
    throw new Error("Not all kings have played");
  }

  const updatedKings = kings.map((king) => {
    return {
      ...king,
      order:
        currentDominoes.find((domino) => domino.kingId === king.id)?.position ||
        0,
    };
  });

  const order = updatedKings.reduce((acc, king) => {
    return {
      ...acc,
      [king.order!]: king.id,
    };
  }, {});

  const newState = {
    ...state,
    kings: updatedKings,
    order,
  };

  return newState;
};

export { order };
