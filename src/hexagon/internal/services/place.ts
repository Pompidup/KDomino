import type { Game } from "../entities/game.js";
import kingdom from "../entities/kingdom.js";
import type { PlayerActionPayload } from "./game.js";

const place = (payload: PlayerActionPayload<"place">): Game => {
  const { lordId, data } = payload;
  const { state, position, orientation, rotation } = data;

  const currentLord = state.lords.find((lord) => lord.id === lordId);
  const currentPlayer = state.players.find(
    (player) => player.id === currentLord?.playerId
  );
  const currentKingdom = currentPlayer?.kingdom;

  if (!currentKingdom) {
    throw new Error("Kingdom not found");
  }

  const domino = currentLord?.dominoPicked;

  if (!domino) {
    throw new Error("Domino not found");
  }

  kingdom.placeDomino(currentKingdom, position, orientation, rotation, domino);

  currentPlayer.kingdom = currentKingdom;
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

export { place };
