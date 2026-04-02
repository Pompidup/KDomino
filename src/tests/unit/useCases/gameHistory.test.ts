import { RedoError, UndoError } from "@core/domain/errors/domainErrors.js";
import type { NextAction, NextStep } from "@core/domain/types/game.js";
import {
  canRedo,
  canUndo,
  clearHistory,
  createGameHistory,
  getHistorySize,
  pushState,
  redo,
  undo,
} from "@core/useCases/gameHistory.js";
import { describe, expect, test } from "vitest";
import { createGameBuilder } from "../../builder/game.js";

const stepStart: NextStep = { type: "step", step: "start" };
const actionPick: NextAction = {
  type: "action",
  nextLord: "lord1-id",
  nextAction: "pickDomino",
};

const buildState1 = () =>
  createGameBuilder().withAllDefaults().withNextAction(stepStart).build();

const buildState2 = () =>
  createGameBuilder()
    .withAllDefaults()
    .withNextAction(actionPick)
    .withTurn(2)
    .build();

const buildState3 = () =>
  createGameBuilder()
    .withAllDefaults()
    .withNextAction(stepStart)
    .withTurn(3)
    .build();

describe("GameHistory", () => {
  describe("createGameHistory", () => {
    test("should create a history with the initial state as current", () => {
      const state = buildState1();
      const history = createGameHistory(state);

      expect(history.current).toBe(state);
      expect(history.past).toEqual([]);
      expect(history.future).toEqual([]);
    });
  });

  describe("pushState", () => {
    test("should set new state as current and move old to past", () => {
      const state1 = buildState1();
      const state2 = buildState2();
      const history = createGameHistory(state1);

      const updated = pushState(history, state2);

      expect(updated.current).toBe(state2);
      expect(updated.past).toEqual([state1]);
      expect(updated.future).toEqual([]);
    });

    test("should clear future stack when pushing after undo", () => {
      const state1 = buildState1();
      const state2 = buildState2();
      const state3 = buildState3();

      let history = createGameHistory(state1);
      history = pushState(history, state2);
      history = undo(history);
      // Now current=state1, future=[state2]
      history = pushState(history, state3);

      expect(history.current).toBe(state3);
      expect(history.past).toEqual([state1]);
      expect(history.future).toEqual([]);
    });

    test("should accumulate multiple states in past", () => {
      const state1 = buildState1();
      const state2 = buildState2();
      const state3 = buildState3();

      let history = createGameHistory(state1);
      history = pushState(history, state2);
      history = pushState(history, state3);

      expect(history.current).toBe(state3);
      expect(history.past).toEqual([state1, state2]);
      expect(history.future).toEqual([]);
    });
  });

  describe("undo", () => {
    test("should revert to the previous state", () => {
      const state1 = buildState1();
      const state2 = buildState2();

      let history = createGameHistory(state1);
      history = pushState(history, state2);
      history = undo(history);

      expect(history.current).toBe(state1);
      expect(history.past).toEqual([]);
      expect(history.future).toEqual([state2]);
    });

    test("should support multiple undos", () => {
      const state1 = buildState1();
      const state2 = buildState2();
      const state3 = buildState3();

      let history = createGameHistory(state1);
      history = pushState(history, state2);
      history = pushState(history, state3);

      history = undo(history);
      expect(history.current).toBe(state2);

      history = undo(history);
      expect(history.current).toBe(state1);
      expect(history.past).toEqual([]);
      expect(history.future).toEqual([state3, state2]);
    });

    test("should throw UndoError when past is empty", () => {
      const state = buildState1();
      const history = createGameHistory(state);

      expect(() => undo(history)).toThrow(UndoError);
    });
  });

  describe("redo", () => {
    test("should re-apply a previously undone state", () => {
      const state1 = buildState1();
      const state2 = buildState2();

      let history = createGameHistory(state1);
      history = pushState(history, state2);
      history = undo(history);
      history = redo(history);

      expect(history.current).toBe(state2);
      expect(history.past).toEqual([state1]);
      expect(history.future).toEqual([]);
    });

    test("should support multiple redos", () => {
      const state1 = buildState1();
      const state2 = buildState2();
      const state3 = buildState3();

      let history = createGameHistory(state1);
      history = pushState(history, state2);
      history = pushState(history, state3);
      history = undo(history);
      history = undo(history);

      history = redo(history);
      expect(history.current).toBe(state2);

      history = redo(history);
      expect(history.current).toBe(state3);
      expect(history.past).toEqual([state1, state2]);
      expect(history.future).toEqual([]);
    });

    test("should throw RedoError when future is empty", () => {
      const state = buildState1();
      const history = createGameHistory(state);

      expect(() => redo(history)).toThrow(RedoError);
    });
  });

  describe("canUndo / canRedo", () => {
    test("should return false for a fresh history", () => {
      const history = createGameHistory(buildState1());

      expect(canUndo(history)).toBe(false);
      expect(canRedo(history)).toBe(false);
    });

    test("should return true for undo after push", () => {
      let history = createGameHistory(buildState1());
      history = pushState(history, buildState2());

      expect(canUndo(history)).toBe(true);
      expect(canRedo(history)).toBe(false);
    });

    test("should return true for redo after undo", () => {
      let history = createGameHistory(buildState1());
      history = pushState(history, buildState2());
      history = undo(history);

      expect(canUndo(history)).toBe(false);
      expect(canRedo(history)).toBe(true);
    });
  });

  describe("clearHistory", () => {
    test("should clear past and future, keeping current", () => {
      const state1 = buildState1();
      const state2 = buildState2();
      const state3 = buildState3();

      let history = createGameHistory(state1);
      history = pushState(history, state2);
      history = pushState(history, state3);
      history = undo(history);

      const cleared = clearHistory(history);

      expect(cleared.current).toBe(history.current);
      expect(cleared.past).toEqual([]);
      expect(cleared.future).toEqual([]);
    });
  });

  describe("getHistorySize", () => {
    test("should return 0/0 for a fresh history", () => {
      const history = createGameHistory(buildState1());
      expect(getHistorySize(history)).toEqual({ past: 0, future: 0 });
    });

    test("should reflect past and future sizes", () => {
      let history = createGameHistory(buildState1());
      history = pushState(history, buildState2());
      history = pushState(history, buildState3());
      history = undo(history);

      expect(getHistorySize(history)).toEqual({ past: 1, future: 1 });
    });
  });
});
