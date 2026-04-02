import type {
  GameState,
  GameWithNextAction,
  Position,
  Rotation,
} from "@core/domain/types/index.js";
import type { GameEngine } from "@core/portUserside/engine.js";
import type { PlayerInput } from "@application/commands/addPlayersCommand.js";

// ─── Types ──────────────────────────────────────────────────────────

/**
 * The types of state-changing actions that can be recorded.
 */
export type ActionType =
  | "createGame"
  | "addPlayers"
  | "addExtraRules"
  | "startGame"
  | "chooseDomino"
  | "placeDomino"
  | "discardDomino"
  | "placeGiant"
  | "sendGiant";

/**
 * Payload types for each action, containing only the command parameters
 * (excluding the game state, which is too large to store).
 */
export type ActionPayloadMap = {
  createGame: { mode: string; seed?: string };
  addPlayers: { players: PlayerInput[] };
  addExtraRules: { extraRules: string[] };
  startGame: Record<string, never>;
  chooseDomino: { lordId: string; dominoPick: number };
  placeDomino: { lordId: string; position: Position; rotation: Rotation };
  discardDomino: { lordId: string };
  placeGiant: { lordId: string; position: Position };
  sendGiant: {
    lordId: string;
    giantIndex: number;
    targetPlayerId: string;
    targetCrownPosition: Position;
  };
};

/**
 * A single recorded action in the game log.
 */
export type ActionEntry<T extends ActionType = ActionType> = {
  /** Auto-incrementing index (0-based) */
  id: number;
  /** Timestamp when the action was recorded (Date.now()) */
  timestamp: number;
  /** The type of action performed */
  action: T;
  /** Command parameters (excludes game state) */
  payload: ActionPayloadMap[T];
  /** Turn number after the action was applied */
  turn: number;
};

/**
 * An immutable log of all actions performed during a game.
 * Can be used to replay a game or analyze player decisions.
 *
 * @example
 * ```typescript
 * const { engine, getLog } = wrapWithActionLog(baseEngine);
 * let game = engine.createGame({ mode: 'Classic' });
 * game = engine.addPlayers({ game, players: ['Alice', 'Bob'] });
 * // ... play the game ...
 * const log = getLog();
 * console.log(log.entries); // all actions recorded
 * ```
 */
export type GameActionLog = {
  /** The game ID this log belongs to */
  gameId: string;
  /** Immutable array of recorded actions */
  entries: readonly ActionEntry[];
};

// ─── Construction ───────────────────────────────────────────────────

/**
 * Creates an empty action log for a game.
 */
export const createActionLog = (gameId: string): GameActionLog => ({
  gameId,
  entries: [],
});

/**
 * Appends an action to the log (immutable — returns a new log).
 */
export const appendAction = (
  log: GameActionLog,
  entry: Omit<ActionEntry, "id" | "timestamp">,
): GameActionLog => ({
  ...log,
  entries: [
    ...log.entries,
    {
      ...entry,
      id: log.entries.length,
      timestamp: Date.now(),
    },
  ],
});

// ─── Queries ────────────────────────────────────────────────────────

/**
 * Returns all entries in the log.
 */
export const getActions = (log: GameActionLog): readonly ActionEntry[] =>
  log.entries;

/**
 * Returns entries filtered by action type.
 */
export const getActionsByType = (
  log: GameActionLog,
  type: ActionType,
): readonly ActionEntry[] => log.entries.filter((e) => e.action === type);

/**
 * Returns entries filtered by turn number.
 */
export const getActionsByTurn = (
  log: GameActionLog,
  turn: number,
): readonly ActionEntry[] => log.entries.filter((e) => e.turn === turn);

// ─── Engine Wrapper ─────────────────────────────────────────────────

/**
 * Wraps a GameEngine to automatically record every state-changing action.
 * Read-only methods are passed through unchanged.
 *
 * @param engine - The base game engine to wrap
 * @returns An object with the wrapped engine and a getLog() accessor
 *
 * @example
 * ```typescript
 * const { engine: logged, getLog } = wrapWithActionLog(baseEngine);
 * let game = logged.createGame({ mode: 'Classic' });
 * // ... play ...
 * const log = getLog(); // retrieve the full action log
 * ```
 */
export const wrapWithActionLog = (
  engine: GameEngine,
): { engine: GameEngine; getLog: () => GameActionLog } => {
  let log = createActionLog("");

  const record = <T extends ActionType>(
    action: T,
    payload: ActionPayloadMap[T],
    turn: number,
  ): void => {
    log = appendAction(log, { action, payload, turn });
  };

  const wrappedEngine: GameEngine = {
    // Read-only methods — pass through
    getModes: (cmd) => engine.getModes(cmd),
    getExtraRules: (cmd) => engine.getExtraRules(cmd),
    calculateScore: (cmd) => engine.calculateScore(cmd),
    getValidPlacements: (cmd) => engine.getValidPlacements(cmd),
    canPlaceDomino: (cmd) => engine.canPlaceDomino(cmd),
    serialize: (cmd) => engine.serialize(cmd),
    deserialize: (cmd) => engine.deserialize(cmd),
    getResults: (cmd) => engine.getResults(cmd),
    getDynastyResults: (cmd) => engine.getDynastyResults(cmd),

    // State-changing methods — record after execution
    createGame: (cmd) => {
      const game = engine.createGame(cmd);
      log = createActionLog(game.id);
      record("createGame", { mode: cmd.mode, seed: cmd.seed }, game.turn);
      return game;
    },

    addPlayers: (cmd) => {
      const game = engine.addPlayers(cmd);
      record("addPlayers", { players: cmd.players }, game.turn);
      return game;
    },

    addExtraRules: (cmd) => {
      const game = engine.addExtraRules(cmd);
      record("addExtraRules", { extraRules: cmd.extraRules }, game.turn);
      return game;
    },

    startGame: (cmd) => {
      const game = engine.startGame(cmd);
      record("startGame", {}, game.turn);
      return game;
    },

    chooseDomino: (cmd) => {
      const game = engine.chooseDomino(cmd);
      record(
        "chooseDomino",
        { lordId: cmd.lordId, dominoPick: cmd.dominoPick },
        game.turn,
      );
      return game;
    },

    placeDomino: (cmd) => {
      const game = engine.placeDomino(cmd);
      record(
        "placeDomino",
        {
          lordId: cmd.lordId,
          position: cmd.position,
          rotation: cmd.rotation,
        },
        game.turn,
      );
      return game;
    },

    discardDomino: (cmd) => {
      const game = engine.discardDomino(cmd);
      record("discardDomino", { lordId: cmd.lordId }, game.turn);
      return game;
    },

    // Queendomino methods — pass through (no action log recording yet)
    placeKnight: (cmd) => engine.placeKnight(cmd),
    constructBuilding: (cmd) => engine.constructBuilding(cmd),
    useDragon: (cmd) => engine.useDragon(cmd),
    skipOptionalAction: (cmd) => engine.skipOptionalAction(cmd),

    // Origins methods — pass through (no action log recording yet)
    placeFireToken: (cmd) => engine.placeFireToken(cmd),
    recruitCaveman: (cmd) => engine.recruitCaveman(cmd),

    // Age of Giants methods — record after execution
    placeGiant: (cmd) => {
      const game = engine.placeGiant(cmd);
      record(
        "placeGiant",
        { lordId: cmd.lordId, position: cmd.position },
        game.turn,
      );
      return game;
    },

    sendGiant: (cmd) => {
      const game = engine.sendGiant(cmd);
      record(
        "sendGiant",
        {
          lordId: cmd.lordId,
          giantIndex: cmd.giantIndex,
          targetPlayerId: cmd.targetPlayerId,
          targetCrownPosition: cmd.targetCrownPosition,
        },
        game.turn,
      );
      return game;
    },
  };

  return {
    engine: wrappedEngine,
    getLog: () => log,
  };
};

// ─── Replay ─────────────────────────────────────────────────────────

/**
 * Replays all actions from a log on a fresh engine to reconstruct the final game state.
 * The engine should use the same configuration (especially shuffleMethod) as the original game
 * to guarantee deterministic results when a seed is present.
 *
 * @param engine - A game engine instance (should match original config)
 * @param log - The action log to replay
 * @returns The final game state after replaying all actions
 */
export const replayActions = (
  engine: GameEngine,
  log: GameActionLog,
): GameState => {
  if (log.entries.length === 0) {
    throw new Error("Cannot replay an empty action log");
  }

  const firstEntry = log.entries[0];
  if (firstEntry?.action !== "createGame") {
    throw new Error("Action log must start with a createGame action");
  }

  const firstPayload = firstEntry.payload as ActionPayloadMap["createGame"];
  let game: GameState = engine.createGame({
    mode: firstPayload.mode,
    seed: firstPayload.seed,
  });

  for (let i = 1; i < log.entries.length; i++) {
    const entry = log.entries[i];
    if (!entry) continue;

    switch (entry.action) {
      case "createGame": {
        const payload = entry.payload as ActionPayloadMap["createGame"];
        game = engine.createGame({ mode: payload.mode, seed: payload.seed });
        break;
      }
      case "addPlayers": {
        const payload = entry.payload as ActionPayloadMap["addPlayers"];
        game = engine.addPlayers({ game, players: payload.players });
        break;
      }
      case "addExtraRules": {
        const payload = entry.payload as ActionPayloadMap["addExtraRules"];
        game = engine.addExtraRules({
          game,
          extraRules: payload.extraRules,
        });
        break;
      }
      case "startGame": {
        game = engine.startGame({ game });
        break;
      }
      case "chooseDomino": {
        const payload = entry.payload as ActionPayloadMap["chooseDomino"];
        game = engine.chooseDomino({
          game,
          lordId: payload.lordId,
          dominoPick: payload.dominoPick,
        });
        break;
      }
      case "placeDomino": {
        const payload = entry.payload as ActionPayloadMap["placeDomino"];
        game = engine.placeDomino({
          game,
          lordId: payload.lordId,
          position: payload.position,
          rotation: payload.rotation,
        });
        break;
      }
      case "discardDomino": {
        const payload = entry.payload as ActionPayloadMap["discardDomino"];
        game = engine.discardDomino({
          game,
          lordId: payload.lordId,
        });
        break;
      }
      case "placeGiant": {
        const payload = entry.payload as ActionPayloadMap["placeGiant"];
        game = engine.placeGiant({
          game: game as GameWithNextAction,
          lordId: payload.lordId,
          position: payload.position,
        });
        break;
      }
      case "sendGiant": {
        const payload = entry.payload as ActionPayloadMap["sendGiant"];
        game = engine.sendGiant({
          game: game as GameWithNextAction,
          lordId: payload.lordId,
          giantIndex: payload.giantIndex,
          targetPlayerId: payload.targetPlayerId,
          targetCrownPosition: payload.targetCrownPosition,
        });
        break;
      }
    }
  }

  return game;
};
