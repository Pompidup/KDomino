import type { Game } from "../entities/game.js";

type DefinePlayerOrderPayload = {
  state: Game;
};

const definePlayerOrder = (payload: DefinePlayerOrderPayload): Game => {
  const { state } = payload;
  const { lords, currentDominoes } = state;

  const allLordsHavePlayed = lords.every((lord) => lord.turnEnded);

  if (!allLordsHavePlayed) {
    throw new Error("Not all lords have played");
  }

  const updatedLords = lords.map((lord) => {
    return {
      ...lord,
      order:
        currentDominoes.find((domino) => domino.lordId === lord.id)?.position ||
        0,
    };
  });

  const order = updatedLords.reduce((acc, lord) => {
    return {
      ...acc,
      [lord.order!]: lord.id,
    };
  }, {});

  const newState = {
    ...state,
    lords: updatedLords,
    order,
  };

  return newState;
};

export { definePlayerOrder };
