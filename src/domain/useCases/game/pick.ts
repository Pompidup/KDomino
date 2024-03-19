import type { Game } from "../../entities/game.js";
import type { RevealsDomino } from "../../entities/domino.js";
import {
  type PlayerActionPayload,
  type CustomError,
  checkValidityDomino,
  isKingTurn,
} from "./game.js";

const pick = (payload: PlayerActionPayload<"pick">): Game => {
  const { kingId, data } = payload;
  const { state, dominoPick } = data;
  const { currentDominoes, kings } = state;

  // Check if it is the king's turn
  if (!isKingTurn(state, kingId)) {
    throw new Error("It is not your turn");
  }

  // Check if king has already picked
  const king = kings.find((king) => king.id === kingId);
  if (king?.hasPick) {
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
      domino.kingId = kingId;
    }

    return domino;
  });

  // update kings
  const updatedKings = kings.map((king) => {
    if (king.id === kingId) {
      king.hasPick = true;
      king.turnEnded = true;
      king.dominoPicked = domino.domino;
    }

    return king;
  });

  // update state
  const updatedState = {
    ...state,
    currentDominoes: updatedCurrentDominoes,
    kings: updatedKings,
  };

  return updatedState;
};

export { pick };
