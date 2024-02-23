import type { GameDependencies } from "./game.js";
import type { Game } from "../../entities/game.js";
import { draw } from "./draw.js";

type FirstTurnPayload = {
  state: Game;
};

const firstTurn =
  (dependencies: GameDependencies) =>
  async (payload: FirstTurnPayload): Promise<{ game: Game }> => {
    const { gamesRepository } = dependencies;
    const { state } = payload;

    const newState = await draw(dependencies)({ state });
    const turn = newState.turn + 1;

    const updatedState = {
      ...newState,
      turn,
    };

    await gamesRepository.update(updatedState);

    return { game: updatedState };
  };

export { firstTurn };
