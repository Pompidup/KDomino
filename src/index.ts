import type { GameEngine } from "@core/portUserside/engine";
import { configureEngine, type EngineConfig } from "./config.js";

// Configuration
export type { EngineConfig };

// Commands
export * from "@application/commands/index.js";

// Domain types
export * from "@core/domain/types/index.js";

// Domain errors
export * from "@core/domain/errors/domainErrors.js";

// Ports
export * from "@core/portServerside/index.js";
export * from "@core/portUserside/engine.js";

// i18n
export * from "@core/i18n/translations.js";

// Use cases (for advanced usage)
export { type ValidPlacement } from "@core/useCases/getValidPlacements.js";
export { type DynastyResult } from "@core/useCases/getDynastyResult.js";
export {
  serializeGame,
  deserializeGame,
  createSavePoint,
  restoreFromSavePoint,
  type GameSavePoint,
} from "@core/useCases/serialization.js";

// History (undo/redo)
export {
  type GameHistory,
  createGameHistory,
  pushState,
  undo,
  redo,
  canUndo,
  canRedo,
  clearHistory,
  getHistorySize,
} from "@core/useCases/gameHistory.js";

/**
 * Creates a new Kingdomino game engine instance.
 *
 * @param config - Configuration options for the engine
 * @returns A fully configured GameEngine instance
 *
 * @example
 * ```typescript
 * // Basic usage
 * const engine = createGameEngine({});
 *
 * // With logging
 * const engine = createGameEngine({ logging: true });
 *
 * // With custom shuffle for testing
 * const engine = createGameEngine({
 *   shuffleMethod: (array) => array, // No shuffle
 * });
 * ```
 */
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
    getValidPlacementsHandler,
    canPlaceDominoHandler,
    serializeGameHandler,
    deserializeGameHandler,
    getDynastyResultHandler,
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
    getValidPlacements: (command) => getValidPlacementsHandler(command),
    canPlaceDomino: (command) => canPlaceDominoHandler(command),
    serialize: (command) => serializeGameHandler(command),
    deserialize: (command) => deserializeGameHandler(command),
    getDynastyResults: (command) => getDynastyResultHandler(command),
  };
};
