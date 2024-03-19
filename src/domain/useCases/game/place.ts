import type { Game } from "../../entities/game.js";
import kingdom from "../../entities/kingdom.js";
import type { PlayerActionPayload } from "./game.js";

const place = (payload: PlayerActionPayload<"place">): Game => {
  const { kingId, data } = payload;
  const { state, position, orientation, rotation } = data;

  const currentKing = state.kings.find((king) => king.id === kingId);
  const currentPlayer = state.players.find(
    (player) => player.id === currentKing?.playerId
  );
  const currentKingdom = currentPlayer?.kingdom;

  if (!currentKingdom) {
    throw new Error("Kingdom not found");
  }

  const domino = currentKing?.dominoPicked;

  if (!domino) {
    throw new Error("Domino not found");
  }

  kingdom.placeDomino(currentKingdom, position, orientation, rotation, domino);

  currentPlayer.kingdom = currentKingdom;
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

export { place };
