import type { Game } from "../../entities/game.js";
import type { GameDependencies } from "./game.js";

const init = (dependencies: GameDependencies) => (): Game => {
  const dominoes = dependencies.dominoesRepository.getAll();
  const id = dependencies.uuidMethod();

  const state = {
    id,
    dominoes,
    currentDominoes: [],
    players: [],
    kings: [],
    turn: 0,
    maxTurns: 0,
    maxDominoes: 0,
    dominoesPerTurn: 0,
    order: {},
  };

  return state;
};

export { init };
