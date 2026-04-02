import { isGameWithNextStep } from "@core/domain/types/game.js";
import type {
  GameState,
  GameWithNextAction,
  GameWithNextStep,
} from "@core/domain/types/index.js";
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
  /** Called after a lord places a knight on their kingdom (QueenDomino) */
  onKnightPlaced?: (event: { game: GameState; lordId: string }) => void;
  /** Called after a lord constructs a building (QueenDomino) */
  onBuildingConstructed?: (event: {
    game: GameState;
    lordId: string;
    buildingId: number;
  }) => void;
  /** Called after a lord uses the dragon to destroy a building (QueenDomino) */
  onDragonUsed?: (event: {
    game: GameState;
    lordId: string;
    buildingId: number;
  }) => void;
  /** Called after a lord places a fire token on their kingdom (Origins) */
  onFireTokenPlaced?: (event: { game: GameState; lordId: string }) => void;
  /** Called after a lord recruits a caveman from the cave board (Origins Tribe) */
  onCavemanRecruited?: (event: {
    game: GameState;
    lordId: string;
    cavemanId: number;
  }) => void;
  /** Called after a lord places a giant on a crown in their kingdom */
  onGiantPlaced?: (event: { game: GameState; lordId: string }) => void;
  /** Called after a lord sends a giant to an opponent's kingdom */
  onGiantSent?: (event: {
    game: GameState;
    lordId: string;
    targetPlayerId: string;
  }) => void;
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
  callbacks: GameEventCallbacks,
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

  // Queendomino methods — emit events after execution
  placeKnight: (cmd) => {
    const game = engine.placeKnight(cmd);
    callbacks.onKnightPlaced?.({ game, lordId: cmd.lordId });
    return game;
  },

  constructBuilding: (cmd) => {
    const game = engine.constructBuilding(cmd);
    callbacks.onBuildingConstructed?.({
      game,
      lordId: cmd.lordId,
      buildingId: cmd.buildingId,
    });
    return game;
  },

  useDragon: (cmd) => {
    const game = engine.useDragon(cmd);
    callbacks.onDragonUsed?.({
      game,
      lordId: cmd.lordId,
      buildingId: cmd.buildingId,
    });
    return game;
  },

  skipOptionalAction: (cmd) => engine.skipOptionalAction(cmd),

  // Origins methods — emit events after execution
  placeFireToken: (cmd) => {
    const game = engine.placeFireToken(cmd);
    callbacks.onFireTokenPlaced?.({ game, lordId: cmd.lordId });
    return game;
  },

  recruitCaveman: (cmd) => {
    const game = engine.recruitCaveman(cmd);
    callbacks.onCavemanRecruited?.({
      game,
      lordId: cmd.lordId,
      cavemanId: cmd.cavemanId,
    });
    return game;
  },

  // Age of Giants methods — emit events after execution
  placeGiant: (cmd) => {
    const game = engine.placeGiant(cmd);
    callbacks.onGiantPlaced?.({ game, lordId: cmd.lordId });
    return game;
  },

  sendGiant: (cmd) => {
    const game = engine.sendGiant(cmd);
    callbacks.onGiantSent?.({
      game,
      lordId: cmd.lordId,
      targetPlayerId: cmd.targetPlayerId,
    });
    return game;
  },
});
