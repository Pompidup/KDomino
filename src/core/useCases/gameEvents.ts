import type {
  GameState,
  GameWithNextAction,
  GameWithNextStep,
} from "@core/domain/types/index.js";
import { isGameWithNextStep } from "@core/domain/types/game.js";
import type { GameEngine } from "@core/portUserside/engine.js";

// ─── Event Types ─────────────────────────────────────────────────────

/**
 * Optional callbacks for game events.
 * Consumers provide these to react to state changes (UI updates, animations, logging).
 * All callbacks are optional — only the ones you provide will be called.
 *
 * @example
 * ```typescript
 * const engine = createGameEngine({
 *   events: {
 *     onDominoPlaced: ({ game, lordId }) => {
 *       console.log(`Lord ${lordId} placed a domino`);
 *       animatePlacement(game);
 *     },
 *     onTurnEnd: ({ turn }) => console.log(`Turn ${turn} ended`),
 *     onGameEnd: () => showResultsScreen(),
 *   },
 * });
 * ```
 */
export type GameEventCallbacks = {
  /** Called after a new game is created */
  onGameCreated?: (event: { game: GameWithNextStep }) => void;
  /** Called after players are added to the game */
  onPlayersAdded?: (event: { game: GameWithNextStep }) => void;
  /** Called after the game starts (first dominoes revealed) */
  onGameStarted?: (event: { game: GameWithNextAction }) => void;
  /** Called after a lord picks a domino */
  onDominoPicked?: (event: {
    game: GameState;
    lordId: string;
    dominoNumber: number;
  }) => void;
  /** Called after a lord places a domino on their kingdom */
  onDominoPlaced?: (event: { game: GameState; lordId: string }) => void;
  /** Called after a lord discards a domino (no valid placement) */
  onDominoDiscarded?: (event: { game: GameState; lordId: string }) => void;
  /** Called when a new turn begins */
  onTurnStart?: (event: { game: GameState; turn: number }) => void;
  /** Called when a turn ends (all lords have played) */
  onTurnEnd?: (event: { game: GameState; turn: number }) => void;
  /** Called when the game reaches the result phase */
  onGameEnd?: (event: { game: GameState }) => void;
};

// ─── Wrapper ─────────────────────────────────────────────────────────

const isGameEnded = (game: GameState): boolean =>
  isGameWithNextStep(game) && game.nextAction.step === "result";

/**
 * Wraps a GameEngine to emit event callbacks after each state-changing method.
 * Read-only methods (getModes, calculateScore, etc.) are passed through unchanged.
 *
 * Derived events:
 * - `onTurnEnd` + `onTurnStart`: emitted when `chooseDomino` causes a turn increment
 * - `onGameEnd`: emitted when `placeDomino` or `discardDomino` transitions to the "result" step
 *
 * @param engine - The base game engine to wrap
 * @param callbacks - Optional event callbacks
 * @returns A new GameEngine that emits events
 */
export const wrapWithEvents = (
  engine: GameEngine,
  callbacks: GameEventCallbacks
): GameEngine => ({
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

  // State-changing methods — emit events after execution
  createGame: (cmd) => {
    const game = engine.createGame(cmd);
    callbacks.onGameCreated?.({ game });
    return game;
  },

  addPlayers: (cmd) => {
    const game = engine.addPlayers(cmd);
    callbacks.onPlayersAdded?.({ game });
    return game;
  },

  addExtraRules: (cmd) => engine.addExtraRules(cmd),

  startGame: (cmd) => {
    const game = engine.startGame(cmd);
    callbacks.onGameStarted?.({ game });
    callbacks.onTurnStart?.({ game, turn: game.turn });
    return game;
  },

  chooseDomino: (cmd) => {
    const turnBefore = cmd.game.turn;
    const game = engine.chooseDomino(cmd);
    callbacks.onDominoPicked?.({
      game,
      lordId: cmd.lordId,
      dominoNumber: cmd.dominoPick,
    });

    // Detect turn transition
    if (game.turn !== turnBefore) {
      callbacks.onTurnEnd?.({ game, turn: turnBefore });
      callbacks.onTurnStart?.({ game, turn: game.turn });
    }

    return game;
  },

  placeDomino: (cmd) => {
    const game = engine.placeDomino(cmd);
    callbacks.onDominoPlaced?.({ game, lordId: cmd.lordId });

    if (isGameEnded(game)) {
      callbacks.onGameEnd?.({ game });
    }

    return game;
  },

  discardDomino: (cmd) => {
    const game = engine.discardDomino(cmd);
    callbacks.onDominoDiscarded?.({ game, lordId: cmd.lordId });

    if (isGameEnded(game)) {
      callbacks.onGameEnd?.({ game });
    }

    return game;
  },
});
