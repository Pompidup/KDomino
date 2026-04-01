import { isGameWithNextAction } from "@core/domain/types/game.js";
import type { GameState } from "@core/domain/types/index.js";
import type { GameEngine } from "@core/portUserside/engine.js";

// ─── Types ──────────────────────────────────────────────────────────

/**
 * Debug log verbosity level.
 * - `minimal`: method name + phase only
 * - `standard`: + game state summary + key params
 * - `verbose`: + full game state JSON dump
 */
export type DebugLogLevel = "minimal" | "standard" | "verbose";

/**
 * Summary of the current game state, extracted for quick inspection.
 */
export type GameStateSummary = {
  gameId: string;
  turn: number;
  nextAction: string;
  playersCount: number;
  dominoesRemaining: number;
  currentDominoesCount: number;
  lordsCount: number;
};

/**
 * A single debug log entry emitted by the debug wrapper.
 */
export type DebugLogEntry = {
  timestamp: string;
  method: string;
  phase: "before" | "after" | "error";
  summary: GameStateSummary | null;
  params?: Record<string, unknown>;
  error?: string;
  durationMs?: number;
  fullState?: GameState;
};

/**
 * Custom debug logger interface.
 * Consumers can provide their own to redirect debug output.
 */
export type DebugLogger = {
  log: (entry: DebugLogEntry) => void;
};

/**
 * Configuration for the debug wrapper.
 */
export type DebugOptions = {
  /** Custom debug logger. Defaults to console-based logger. */
  logger?: DebugLogger;
  /** Verbosity level. Defaults to "standard". */
  level?: DebugLogLevel;
};

// ─── Helpers ────────────────────────────────────────────────────────

/**
 * Extracts a concise summary from a game state object.
 */
export const summarizeGameState = (game: GameState): GameStateSummary => {
  const nextAction = isGameWithNextAction(game)
    ? `action:${game.nextAction.nextAction}`
    : `step:${game.nextAction.step}`;

  return {
    gameId: game.id,
    turn: game.turn,
    nextAction,
    playersCount: game.players.length,
    dominoesRemaining: game.dominoes.length,
    currentDominoesCount: game.currentDominoes.length,
    lordsCount: game.lords.length,
  };
};

const defaultDebugLogger: DebugLogger = {
  log: (entry: DebugLogEntry) => {
    const phase = entry.phase.toUpperCase().padEnd(5);
    const base = `[KDomino:Debug] ${entry.timestamp} ${phase} ${entry.method}`;

    if (entry.phase === "error") {
      console.error(`${base} | error: ${entry.error}`);
      return;
    }

    if (entry.summary) {
      const s = entry.summary;
      console.log(
        `${base} | turn=${s.turn} next=${s.nextAction} players=${s.playersCount} dominoes=${s.dominoesRemaining}`,
      );
    } else {
      console.log(base);
    }
  },
};

const isGameState = (value: unknown): value is GameState => {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "nextAction" in value &&
    "players" in value &&
    "dominoes" in value
  );
};

type CommandWithGame = { game: GameState; [key: string]: unknown };

const hasGameInCommand = (cmd: unknown): cmd is CommandWithGame => {
  return (
    typeof cmd === "object" &&
    cmd !== null &&
    "game" in cmd &&
    isGameState((cmd as CommandWithGame).game)
  );
};

const extractParams = (cmd: unknown): Record<string, unknown> | undefined => {
  if (typeof cmd !== "object" || cmd === null) return undefined;

  const record = cmd as Record<string, unknown>;
  const params: Record<string, unknown> = {};

  if ("mode" in record) params.mode = record.mode;
  if ("lordId" in record) params.lordId = record.lordId;
  if ("dominoPick" in record) params.dominoPick = record.dominoPick;
  if ("position" in record) params.position = record.position;
  if ("rotation" in record) params.rotation = record.rotation;
  if ("players" in record) params.players = record.players;
  if ("extraRules" in record) params.extraRules = record.extraRules;

  return Object.keys(params).length > 0 ? params : undefined;
};

// ─── Wrapper ────────────────────────────────────────────────────────

const wrapMethod = <TArgs, TResult>(
  method: string,
  fn: (cmd: TArgs) => TResult,
  logger: DebugLogger,
  level: DebugLogLevel,
): ((cmd: TArgs) => TResult) => {
  return (cmd: TArgs) => {
    const timestamp = new Date().toISOString();

    // Before
    const beforeSummary =
      level !== "minimal" && hasGameInCommand(cmd)
        ? summarizeGameState(cmd.game)
        : null;

    const beforeEntry: DebugLogEntry = {
      timestamp,
      method,
      phase: "before",
      summary: beforeSummary,
      params: level !== "minimal" ? extractParams(cmd) : undefined,
    };

    logger.log(beforeEntry);

    // Execute
    const start = performance.now();
    let result: TResult;
    try {
      result = fn(cmd);
    } catch (err) {
      const durationMs = Math.round((performance.now() - start) * 100) / 100;
      const errorEntry: DebugLogEntry = {
        timestamp: new Date().toISOString(),
        method,
        phase: "error",
        summary: beforeSummary,
        error: err instanceof Error ? err.message : String(err),
        durationMs,
      };
      logger.log(errorEntry);
      throw err;
    }

    const durationMs = Math.round((performance.now() - start) * 100) / 100;

    // After
    const afterSummary =
      level !== "minimal" && isGameState(result)
        ? summarizeGameState(result as GameState)
        : null;

    const afterEntry: DebugLogEntry = {
      timestamp: new Date().toISOString(),
      method,
      phase: "after",
      summary: afterSummary,
      durationMs,
      fullState:
        level === "verbose" && isGameState(result)
          ? (result as GameState)
          : undefined,
    };

    logger.log(afterEntry);

    return result;
  };
};

/**
 * Wraps a GameEngine to emit detailed debug log entries before and after each method call.
 * Useful for UI developers to inspect engine behavior at every step.
 *
 * @param engine - The base game engine to wrap
 * @param options - Debug configuration (logger, verbosity level)
 * @returns A new GameEngine that emits debug logs
 *
 * @example
 * ```typescript
 * const debugEngine = wrapWithDebug(engine, { level: "verbose" });
 * let game = debugEngine.createGame({ mode: "Classic" });
 * // Console: [KDomino:Debug] ... BEFORE createGame
 * // Console: [KDomino:Debug] ... AFTER  createGame | turn=0 ...
 * ```
 */
export const wrapWithDebug = (
  engine: GameEngine,
  options?: DebugOptions,
): GameEngine => {
  const logger = options?.logger ?? defaultDebugLogger;
  const level = options?.level ?? "standard";

  return {
    getModes: wrapMethod("getModes", engine.getModes, logger, level),
    getExtraRules: wrapMethod(
      "getExtraRules",
      engine.getExtraRules,
      logger,
      level,
    ),
    createGame: wrapMethod("createGame", engine.createGame, logger, level),
    addPlayers: wrapMethod("addPlayers", engine.addPlayers, logger, level),
    addExtraRules: wrapMethod(
      "addExtraRules",
      engine.addExtraRules,
      logger,
      level,
    ),
    startGame: wrapMethod("startGame", engine.startGame, logger, level),
    chooseDomino: wrapMethod(
      "chooseDomino",
      engine.chooseDomino,
      logger,
      level,
    ),
    placeDomino: wrapMethod("placeDomino", engine.placeDomino, logger, level),
    discardDomino: wrapMethod(
      "discardDomino",
      engine.discardDomino,
      logger,
      level,
    ),
    getResults: wrapMethod("getResults", engine.getResults, logger, level),
    calculateScore: wrapMethod(
      "calculateScore",
      engine.calculateScore,
      logger,
      level,
    ),
    getValidPlacements: wrapMethod(
      "getValidPlacements",
      engine.getValidPlacements,
      logger,
      level,
    ),
    canPlaceDomino: wrapMethod(
      "canPlaceDomino",
      engine.canPlaceDomino,
      logger,
      level,
    ),
    serialize: wrapMethod("serialize", engine.serialize, logger, level),
    deserialize: wrapMethod("deserialize", engine.deserialize, logger, level),
    getDynastyResults: wrapMethod(
      "getDynastyResults",
      engine.getDynastyResults,
      logger,
      level,
    ),
    placeKnight: wrapMethod(
      "placeKnight",
      engine.placeKnight,
      logger,
      level,
    ),
    constructBuilding: wrapMethod(
      "constructBuilding",
      engine.constructBuilding,
      logger,
      level,
    ),
    useDragon: wrapMethod("useDragon", engine.useDragon, logger, level),
    skipOptionalAction: wrapMethod(
      "skipOptionalAction",
      engine.skipOptionalAction,
      logger,
      level,
    ),
  };
};
