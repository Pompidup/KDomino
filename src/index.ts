import type { GameEngine } from "@core/portUserside/engine";
import { type DebugOptions, wrapWithDebug } from "@core/useCases/gameDebug.js";
import { wrapWithEvents } from "@core/useCases/gameEvents.js";
import { configureEngine, type EngineConfig } from "./config.js";

// Commands
export * from "@application/commands/index.js";
export { validateGameState } from "@core/domain/entities/validateGameState.js";
// Domain errors
export * from "@core/domain/errors/domainErrors.js";
// Domain types
export * from "@core/domain/types/index.js";
// i18n
export * from "@core/i18n/translations.js";
// Ports
export * from "@core/portServerside/index.js";
export * from "@core/portUserside/engine.js";
// Bot / AI player
export {
  advancedStrategy,
  type BotStrategy,
  expertStrategy,
  greedyStrategy,
  type PickContext,
  type PlaceContext,
  playBotTurn,
  randomStrategy,
} from "@core/useCases/bot.js";
// Action log (game history / replay)
export {
  type ActionEntry,
  type ActionPayloadMap,
  type ActionType,
  appendAction,
  createActionLog,
  type GameActionLog,
  getActions,
  getActionsByTurn,
  getActionsByType,
  replayActions,
  wrapWithActionLog,
} from "@core/useCases/gameActionLog.js";
// Debug mode
export {
  type DebugLogEntry,
  type DebugLogger,
  type DebugLogLevel,
  type DebugOptions,
  type GameStateSummary,
  summarizeGameState,
  wrapWithDebug,
} from "@core/useCases/gameDebug.js";
// Game events
export {
  type GameEventCallbacks,
  wrapWithEvents,
} from "@core/useCases/gameEvents.js";
// History (undo/redo)
export {
  canRedo,
  canUndo,
  clearHistory,
  createGameHistory,
  type GameHistory,
  getHistorySize,
  pushState,
  redo,
  undo,
} from "@core/useCases/gameHistory.js";
export type { DynastyResult } from "@core/useCases/getDynastyResult.js";
// Use cases (for advanced usage)
export type { ValidPlacement } from "@core/useCases/getValidPlacements.js";
export {
  createSavePoint,
  deserializeGame,
  type GameSavePoint,
  restoreFromSavePoint,
  serializeGame,
} from "@core/useCases/serialization.js";
// Configuration
export type { EngineConfig };

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
 * // With event callbacks
 * const engine = createGameEngine({
 *   events: {
 *     onDominoPlaced: ({ lordId }) => console.log(`${lordId} placed`),
 *     onGameEnd: () => console.log('Game over!'),
 *   },
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

  let engine: GameEngine = {
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

  if (config.events) {
    engine = wrapWithEvents(engine, config.events);
  }

  if (config.debug) {
    const debugOptions: DebugOptions | undefined =
      typeof config.debug === "object" ? config.debug : undefined;
    engine = wrapWithDebug(engine, debugOptions);
  }

  return engine;
};
