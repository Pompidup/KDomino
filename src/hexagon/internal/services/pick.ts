import type { Game } from "../entities/game.js";
import type { RevealsDomino } from "../entities/domino.js";
import {
  type PlayerActionPayload,
  type CustomError,
  checkValidityDomino,
  isLordTurn,
} from "./game.js";

const pick = (payload: PlayerActionPayload<"pick">): Game => {
  const { lordId, data } = payload;
  const { state, dominoPick } = data;
  const { currentDominoes, lords } = state;

  // Check if it is the lord's turn
  if (!isLordTurn(state, lordId)) {
    throw new Error("It is not your turn");
  }

  // Check if lord has already picked
  const lord = lords.find((lord) => lord.id === lordId);
  if (lord?.hasPick) {
    throw new Error("You have already picked");
  }

  // Check if dominoPick is valid choice
  const domino = checkValidityDomino(state, dominoPick);

  // typeguard to check if domino is a CustomError
  const isError = (
    domino: CustomError | RevealsDomino
  ): domino is CustomError => {
    return (domino as CustomError).error !== undefined;
  };

  if (isError(domino)) {
    throw new Error(domino.error);
  }

  // update currentDominoes
  const updatedCurrentDominoes = currentDominoes.map((domino) => {
    if (domino.domino.number === dominoPick) {
      domino.picked = true;
      domino.lordId = lordId;
    }

    return domino;
  });

  // update lords
  const updatedLords = lords.map((lord) => {
    if (lord.id === lordId) {
      lord.hasPick = true;
      lord.turnEnded = true;
      lord.dominoPicked = domino.domino;
    }

    return lord;
  });

  // update state
  const updatedState = {
    ...state,
    currentDominoes: updatedCurrentDominoes,
    lords: updatedLords,
  };

  return updatedState;
};

export { pick };
