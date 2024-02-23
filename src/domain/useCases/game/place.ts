import kingdom from "../../entities/kingdom.js";
import type { GameDependencies, PlayerActionPayload } from "./game.js";

const place =
  (dependencies: GameDependencies) =>
  async (payload: PlayerActionPayload<"place">) => {
    const { kingId, data } = payload;
    const { state, position, orientation, rotation } = data;

    const currentKing = state.kings.find((king) => king.id === kingId);
    const currentKingdom = currentKing?.kingdom;

    if (!currentKingdom) {
      throw new Error("Kingdom not found");
    }

    const domino = currentKing?.dominoPicked;

    if (!domino) {
      throw new Error("Domino not found");
    }

    kingdom.placeDomino(
      currentKingdom,
      position,
      orientation,
      rotation,
      domino
    );

    currentKing.kingdom = currentKingdom;
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

    await dependencies.gamesRepository.update(newState);

    return newState;
  };

export { place };
