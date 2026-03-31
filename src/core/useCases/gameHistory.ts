import type { GameState } from "@core/domain/types/index.js";
import { UndoError, RedoError } from "@core/domain/errors/domainErrors.js";

/**
 * Manages a history of game states for undo/redo support.
 * Uses a snapshot-based approach: each state is stored as a full GameState.
 *
 * @example
 * ```typescript
 * let history = createGameHistory(initialGame);
 * const newGame = engine.chooseDomino({ game: history.current, ... });
 * history = pushState(history, newGame);
 * history = undo(history); // back to initialGame
 * history = redo(history); // forward to newGame
 * ```
 */
export type GameHistory = {
  /** The current game state */
  current: GameState;
  /** Stack of previous states (most recent last) */
  past: GameState[];
  /** Stack of undone states (most recent last) */
  future: GameState[];
};

/**
 * Creates a new game history initialized with a game state.
 *
 * @param initialState - The starting game state
 * @returns A new GameHistory with empty past and future
 */
export const createGameHistory = (initialState: GameState): GameHistory => ({
  current: initialState,
  past: [],
  future: [],
});

/**
 * Records a new game state in the history.
 * The current state is pushed to the past stack, and the future stack is cleared
 * (branching from a previous undo point discards the old future).
 *
 * @param history - The current history
 * @param newState - The new game state to record
 * @returns Updated history with the new state as current
 */
export const pushState = (
  history: GameHistory,
  newState: GameState
): GameHistory => ({
  current: newState,
  past: [...history.past, history.current],
  future: [],
});

/**
 * Reverts to the previous game state.
 * The current state is moved to the future stack for potential redo.
 *
 * @param history - The current history
 * @returns Updated history with the previous state as current
 * @throws {UndoError} If there is no previous state to revert to
 */
export const undo = (history: GameHistory): GameHistory => {
  if (history.past.length === 0) {
    throw new UndoError();
  }

  const previous = history.past[history.past.length - 1]!;
  return {
    current: previous,
    past: history.past.slice(0, -1),
    future: [...history.future, history.current],
  };
};

/**
 * Re-applies a previously undone game state.
 * The current state is moved to the past stack.
 *
 * @param history - The current history
 * @returns Updated history with the next undone state as current
 * @throws {RedoError} If there is no undone state to re-apply
 */
export const redo = (history: GameHistory): GameHistory => {
  if (history.future.length === 0) {
    throw new RedoError();
  }

  const next = history.future[history.future.length - 1]!;
  return {
    current: next,
    past: [...history.past, history.current],
    future: history.future.slice(0, -1),
  };
};

/**
 * Checks whether an undo operation is available.
 */
export const canUndo = (history: GameHistory): boolean =>
  history.past.length > 0;

/**
 * Checks whether a redo operation is available.
 */
export const canRedo = (history: GameHistory): boolean =>
  history.future.length > 0;

/**
 * Clears the undo/redo history, keeping only the current state.
 *
 * @param history - The current history
 * @returns A new history with empty past and future
 */
export const clearHistory = (history: GameHistory): GameHistory => ({
  current: history.current,
  past: [],
  future: [],
});

/**
 * Returns the number of states in the past and future stacks.
 */
export const getHistorySize = (
  history: GameHistory
): { past: number; future: number } => ({
  past: history.past.length,
  future: history.future.length,
});
