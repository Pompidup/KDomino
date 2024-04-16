import type { Game } from "../entities/game.js";
import type { PlayerActionPayload } from "./game.js";

const pass = (payload: PlayerActionPayload<"pass">): Game => {
  const { lordId, data } = payload;
  const { state } = data;

  const currentLord = state.lords.find((lord) => lord.id === lordId);

  if (!currentLord) {
    throw new Error("Lord not found");
  }

  currentLord.hasPlace = true;

  const newState = {
    ...state,
    lords: state.lords.map((lord) => {
      if (lord.id === lordId) {
        return currentLord;
      }

      return lord;
    }),
  };

  return newState;
};

export { pass };
