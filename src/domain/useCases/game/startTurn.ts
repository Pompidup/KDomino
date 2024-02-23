import type { GameDependencies } from "./game.js";
import type { Game } from "../../entities/game.js";
import { draw } from "./draw.js";

type StartTurnPayload = {
  state: Game;
};

const startTurn =
  (dependencies: GameDependencies) =>
  async (payload: StartTurnPayload): Promise<{ game: Game }> => {
    const { gamesRepository } = dependencies;
    const { state } = payload;

    const turn = state.turn + 1;

    if (turn > state.maxTurns) {
      // Todo: end game
      throw new Error("Game is over");
    }

    const newState = await draw(dependencies)({ state });

    const updatedState = {
      ...newState,
      turn,
    };

    await gamesRepository.update(updatedState);

    return { game: updatedState };
  };

export { startTurn };
