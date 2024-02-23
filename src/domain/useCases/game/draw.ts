import type { Game } from "../../entities/game.js";
import type { GameDependencies } from "./game.js";

type DrawPayload = {
  state: Game;
};

const draw =
  (dependencies: GameDependencies) => async (payload: DrawPayload) => {
    const { gamesRepository } = dependencies;
    const { state } = payload;

    const dominoesCopy = [...state.dominoes];
    const dominoesDrawn = dominoesCopy.splice(0, state.dominoesPerTurn);
    dominoesDrawn.sort((a, b) => a.number - b.number);

    const newState = {
      ...state,
      dominoes: dominoesCopy,
      currentDominoes: dominoesDrawn.map((domino, index) => {
        return {
          domino,
          picked: false,
          kingId: null,
          position: index + 1,
        };
      }),
    };

    await gamesRepository.update(newState);

    return newState;
  };

export { draw };
