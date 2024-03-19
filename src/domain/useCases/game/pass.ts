import type { PlayerActionPayload } from "./game.js";

const pass = (payload: PlayerActionPayload<"pass">) => {
  const { kingId, data } = payload;
  const { state } = data;

  const currentKing = state.kings.find((king) => king.id === kingId);

  if (!currentKing) {
    throw new Error("King not found");
  }

  currentKing.hasPlace = true;

  const newState = {
    ...state,
    kings: state.kings.map((king) => {
      if (king.id === kingId) {
        return currentKing;
      }

      return king;
    }),
  };

  return newState;
};

export { pass };
