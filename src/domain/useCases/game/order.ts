import type { Game } from "../../entities/game.js";
import type { GameDependencies } from "./game.js";

type OrderPayload = {
  state: Game;
};

const order =
  (dependencies: GameDependencies) => async (payload: OrderPayload) => {
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
          currentDominoes.find((domino) => domino.kingId === king.id)
            ?.position || 0,
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

    await dependencies.gamesRepository.update(newState);

    return newState;
  };

export { order };
