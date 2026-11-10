import { isGameWithNextStep } from "@core/domain/types/game.js";
import type {
  GameState,
  GameWithNextAction,
  GameWithNextStep,
} from "@core/domain/types/index.js";
import type { PlayerActions } from "@core/domain/types/player.js";
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
  /** Called once when the game reaches the result phase, whatever the action that ended it */
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
  /** Called after extra rules are added to the game (setup) */
  onExtraRulesAdded?: (event: {
    game: GameWithNextStep;
    extraRules: string[];
  }) => void;
  /** Called after a lord skips an optional action (QueenDomino, Origins, Age of Giants) */
  onOptionalActionSkipped?: (event: {
    game: GameState;
    lordId: string;
    /** The optional action that was skipped (e.g. `"placeKnight"`, `"sendGiant"`) */
    skippedAction: PlayerActions;
  }) => void;
};

// ─── Wrapper ─────────────────────────────────────────────────────────

const isGameEnded = (game: GameState): boolean =>
  isGameWithNextStep(game) && game.nextAction.step === "result";

/**
 * Wraps a GameEngine to emit event callbacks after each state-changing method.
 * Read-only methods (getModes, calculateScore, etc.) are passed through unchanged.
 *
 * Derived events are detected centrally, by comparing the game state before
 * and after every gameplay method (whatever the method that caused it):
 * - `onTurnEnd` + `onTurnStart`: emitted when the turn number changes
 * - `onGameEnd`: emitted exactly once, when the game transitions to the
 *   "result" step (placeDomino, discardDomino, skipOptionalAction,
 *   placeFireToken, recruitCaveman, useDragon, placeGiant, sendGiant…)
 *
 * The action-specific event is always emitted before the derived ones.
 *
 * @param engine - The base game engine to wrap
 * @param callbacks - Optional event callbacks
 * @returns A new GameEngine that emits events
 */
export const wrapWithEvents = (
  engine: GameEngine,
  callbacks: GameEventCallbacks,
): GameEngine => {
  /**
   * Emits the derived events for a gameplay transition `before → after`.
   */
  const emitDerived = (before: GameState, after: GameState): void => {
    if (after.turn !== before.turn) {
      callbacks.onTurnEnd?.({ game: after, turn: before.turn });
      callbacks.onTurnStart?.({ game: after, turn: after.turn });
    }
    if (!isGameEnded(before) && isGameEnded(after)) {
      callbacks.onGameEnd?.({ game: after });
    }
  };

  /**
   * Wraps a gameplay method: runs it, emits its specific event, then the
   * derived turn / game-end events.
   */
  const gameplay =
    <C extends { game: GameState }, R extends GameState>(
      run: (cmd: C) => R,
      emit: (game: R, cmd: C) => void,
    ) =>
    (cmd: C): R => {
      const game = run(cmd);
      emit(game, cmd);
      emitDerived(cmd.game, game);
      return game;
    };

  return {
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

    // Setup methods — emit events after execution
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

    addExtraRules: (cmd) => {
      const game = engine.addExtraRules(cmd);
      callbacks.onExtraRulesAdded?.({ game, extraRules: cmd.extraRules });
      return game;
    },

    startGame: (cmd) => {
      const game = engine.startGame(cmd);
      callbacks.onGameStarted?.({ game });
      callbacks.onTurnStart?.({ game, turn: game.turn });
      return game;
    },

    // Gameplay methods — specific event, then derived turn / game-end events
    chooseDomino: gameplay(
      (cmd) => engine.chooseDomino(cmd),
      (game, cmd) =>
        callbacks.onDominoPicked?.({
          game,
          lordId: cmd.lordId,
          dominoNumber: cmd.dominoPick,
        }),
    ),

    placeDomino: gameplay(
      (cmd) => engine.placeDomino(cmd),
      (game, cmd) => callbacks.onDominoPlaced?.({ game, lordId: cmd.lordId }),
    ),

    discardDomino: gameplay(
      (cmd) => engine.discardDomino(cmd),
      (game, cmd) =>
        callbacks.onDominoDiscarded?.({ game, lordId: cmd.lordId }),
    ),

    // Queendomino methods
    placeKnight: gameplay(
      (cmd) => engine.placeKnight(cmd),
      (game, cmd) => callbacks.onKnightPlaced?.({ game, lordId: cmd.lordId }),
    ),

    constructBuilding: gameplay(
      (cmd) => engine.constructBuilding(cmd),
      (game, cmd) =>
        callbacks.onBuildingConstructed?.({
          game,
          lordId: cmd.lordId,
          buildingId: cmd.buildingId,
        }),
    ),

    useDragon: gameplay(
      (cmd) => engine.useDragon(cmd),
      (game, cmd) =>
        callbacks.onDragonUsed?.({
          game,
          lordId: cmd.lordId,
          buildingId: cmd.buildingId,
        }),
    ),

    skipOptionalAction: gameplay(
      (cmd) => engine.skipOptionalAction(cmd),
      (game, cmd) =>
        callbacks.onOptionalActionSkipped?.({
          game,
          lordId: cmd.lordId,
          skippedAction: cmd.game.nextAction.nextAction,
        }),
    ),

    // Origins methods
    placeFireToken: gameplay(
      (cmd) => engine.placeFireToken(cmd),
      (game, cmd) =>
        callbacks.onFireTokenPlaced?.({ game, lordId: cmd.lordId }),
    ),

    recruitCaveman: gameplay(
      (cmd) => engine.recruitCaveman(cmd),
      (game, cmd) =>
        callbacks.onCavemanRecruited?.({
          game,
          lordId: cmd.lordId,
          cavemanId: cmd.cavemanId,
        }),
    ),

    // Age of Giants methods
    placeGiant: gameplay(
      (cmd) => engine.placeGiant(cmd),
      (game, cmd) => callbacks.onGiantPlaced?.({ game, lordId: cmd.lordId }),
    ),

    sendGiant: gameplay(
      (cmd) => engine.sendGiant(cmd),
      (game, cmd) =>
        callbacks.onGiantSent?.({
          game,
          lordId: cmd.lordId,
          targetPlayerId: cmd.targetPlayerId,
        }),
    ),
  };
};
