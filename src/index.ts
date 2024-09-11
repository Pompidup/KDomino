import type { GameEngine } from "./core/portUserside/engine.js";
import { configureEngine, type EngineConfig } from "./config.js";

export * from "@application/commands/index.js";
export * from "@core/domain/types/index.js";
export * from "@core/portServerside/index.js";
export * from "@core/portUserside/engine.js";

export const createGameEngine = (config: Partial<EngineConfig>): GameEngine => {
  const {
    createGameHandler,
    getModesHandler,
    getExtraRulesHandler,
    addPlayersHandler,
    addExtraRulesHandler,
    startGameHandler,
    chooseDominoHandler,
    placeDominoHandler,
    discardDominoHandler,
    getResultHandler,
    calculateScoreHandler,
  } = configureEngine(config);

  return {
    getModes: (command) => getModesHandler(command),
    getExtraRules: (command) => getExtraRulesHandler(command),
    createGame: (command) => createGameHandler(command),
    addPlayers: (command) => addPlayersHandler(command),
    addExtraRules: (command) => addExtraRulesHandler(command),
    startGame: (command) => startGameHandler(command),
    chooseDomino: (command) => chooseDominoHandler(command),
    placeDomino: (command) => placeDominoHandler(command),
    discardDomino: (command) => discardDominoHandler(command),
    getResults: (command) => getResultHandler(command),
    calculateScore: (command) => calculateScoreHandler(command),
  };
};
