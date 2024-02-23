import type { Game } from "../../entities/game.js";
import { draw } from "./draw.js";
import type { GameDependencies } from "./game.js";
import { order } from "./order.js";
import { startTurn } from "./startTurn.js";

type EndTurnPayload = {
  state: Game;
};

const endTurn =
  (dependencies: GameDependencies) =>
  async (payload: EndTurnPayload): Promise<{ game: Game }> => {
    const { state } = payload;

    const orderUpdated = await order(dependencies)({ state });
    const drawUpdated = await draw(dependencies)({ state: orderUpdated });

    const kings = drawUpdated.kings;

    kings.forEach((king) => {
      king.turnEnded = false;
      king.hasPick = false;
      king.hasPlace = false;
    });

    const newState = {
      ...drawUpdated,
      kings,
    };

    await dependencies.gamesRepository.update(newState);

    return startTurn(dependencies)({ state: newState });
  };

export { endTurn };
