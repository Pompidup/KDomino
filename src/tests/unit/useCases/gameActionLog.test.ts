import type { NextAction, NextStep } from "@core/domain/types/game.js";
import type { GameEngine } from "@core/portUserside/engine.js";
import {
  appendAction,
  createActionLog,
  getActions,
  getActionsByTurn,
  getActionsByType,
  replayActions,
  wrapWithActionLog,
} from "@core/useCases/gameActionLog.js";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { createGameBuilder } from "../../builder/game.js";

// ─── Helpers ────────────────────────────────────────────────────────

const stepAddPlayers: NextStep = { type: "step", step: "addPlayers" };
const stepOptions: NextStep = { type: "step", step: "options" };
const stepStart: NextStep = { type: "step", step: "start" };
const actionPick: NextAction = {
  type: "action",
  nextLord: "lord1-id",
  nextAction: "pickDomino",
};

const buildGameWithStep = (step: NextStep, turn = 0) =>
  createGameBuilder()
    .withAllDefaults()
    .withNextAction(step)
    .withTurn(turn)
    .build();

const buildGameWithAction = (action: NextAction, turn = 0) =>
  createGameBuilder()
    .withAllDefaults()
    .withNextAction(action)
    .withTurn(turn)
    .build();

// ─── createActionLog ────────────────────────────────────────────────

describe("GameActionLog", () => {
  describe("createActionLog", () => {
    test("should create an empty log with the given game ID", () => {
      const log = createActionLog("game-123");

      expect(log.gameId).toBe("game-123");
      expect(log.entries).toEqual([]);
    });
  });

  // ─── appendAction ──────────────────────────────────────────────────

  describe("appendAction", () => {
    test("should append an entry with auto-incremented id", () => {
      let log = createActionLog("game-1");

      log = appendAction(log, {
        action: "createGame",
        payload: { mode: "Classic" },
        turn: 0,
      });

      expect(log.entries).toHaveLength(1);
      expect(log.entries[0]?.id).toBe(0);
      expect(log.entries[0]?.action).toBe("createGame");
      expect(log.entries[0]?.payload).toEqual({ mode: "Classic" });
      expect(log.entries[0]?.turn).toBe(0);
      expect(log.entries[0]?.timestamp).toBeTypeOf("number");
    });

    test("should auto-increment ids across multiple appends", () => {
      let log = createActionLog("game-1");

      log = appendAction(log, {
        action: "createGame",
        payload: { mode: "Classic" },
        turn: 0,
      });
      log = appendAction(log, {
        action: "addPlayers",
        payload: { players: ["Alice", "Bob"] },
        turn: 0,
      });
      log = appendAction(log, {
        action: "startGame",
        payload: {},
        turn: 0,
      });

      expect(log.entries[0]?.id).toBe(0);
      expect(log.entries[1]?.id).toBe(1);
      expect(log.entries[2]?.id).toBe(2);
    });

    test("should return a new log (immutable)", () => {
      const log1 = createActionLog("game-1");
      const log2 = appendAction(log1, {
        action: "createGame",
        payload: { mode: "Classic" },
        turn: 0,
      });

      expect(log1.entries).toHaveLength(0);
      expect(log2.entries).toHaveLength(1);
      expect(log1).not.toBe(log2);
    });
  });

  // ─── getActions ────────────────────────────────────────────────────

  describe("getActions", () => {
    test("should return all entries", () => {
      let log = createActionLog("game-1");
      log = appendAction(log, {
        action: "createGame",
        payload: { mode: "Classic" },
        turn: 0,
      });
      log = appendAction(log, {
        action: "addPlayers",
        payload: { players: ["Alice"] },
        turn: 0,
      });

      const actions = getActions(log);
      expect(actions).toHaveLength(2);
    });

    test("should return empty array for empty log", () => {
      const log = createActionLog("game-1");
      expect(getActions(log)).toEqual([]);
    });
  });

  // ─── getActionsByType ──────────────────────────────────────────────

  describe("getActionsByType", () => {
    test("should filter entries by action type", () => {
      let log = createActionLog("game-1");
      log = appendAction(log, {
        action: "chooseDomino",
        payload: { lordId: "l1", dominoPick: 5 },
        turn: 1,
      });
      log = appendAction(log, {
        action: "placeDomino",
        payload: { lordId: "l1", position: { x: 4, y: 5 }, rotation: 0 },
        turn: 1,
      });
      log = appendAction(log, {
        action: "chooseDomino",
        payload: { lordId: "l2", dominoPick: 8 },
        turn: 1,
      });

      const picks = getActionsByType(log, "chooseDomino");
      expect(picks).toHaveLength(2);
      expect(picks.every((e) => e.action === "chooseDomino")).toBe(true);
    });

    test("should return empty for non-matching type", () => {
      let log = createActionLog("game-1");
      log = appendAction(log, {
        action: "createGame",
        payload: { mode: "Classic" },
        turn: 0,
      });

      expect(getActionsByType(log, "discardDomino")).toEqual([]);
    });
  });

  // ─── getActionsByTurn ──────────────────────────────────────────────

  describe("getActionsByTurn", () => {
    test("should filter entries by turn number", () => {
      let log = createActionLog("game-1");
      log = appendAction(log, {
        action: "createGame",
        payload: { mode: "Classic" },
        turn: 0,
      });
      log = appendAction(log, {
        action: "chooseDomino",
        payload: { lordId: "l1", dominoPick: 1 },
        turn: 1,
      });
      log = appendAction(log, {
        action: "chooseDomino",
        payload: { lordId: "l2", dominoPick: 2 },
        turn: 1,
      });
      log = appendAction(log, {
        action: "chooseDomino",
        payload: { lordId: "l1", dominoPick: 3 },
        turn: 2,
      });

      const turn1Actions = getActionsByTurn(log, 1);
      expect(turn1Actions).toHaveLength(2);
      expect(turn1Actions.every((e) => e.turn === 1)).toBe(true);
    });
  });

  // ─── wrapWithActionLog ─────────────────────────────────────────────

  describe("wrapWithActionLog", () => {
    let mockEngine: GameEngine;

    beforeEach(() => {
      const gameStep = buildGameWithStep(stepAddPlayers);
      const gameOptions = buildGameWithStep(stepOptions);
      const gameStart = buildGameWithStep(stepStart);
      const gameAction = buildGameWithAction(actionPick, 1);

      mockEngine = {
        getModes: vi.fn().mockReturnValue([]),
        getExtraRules: vi.fn().mockReturnValue([]),
        calculateScore: vi.fn().mockReturnValue({ points: 0 }),
        getValidPlacements: vi.fn().mockReturnValue([]),
        canPlaceDomino: vi.fn().mockReturnValue(false),
        serialize: vi.fn().mockReturnValue("{}"),
        deserialize: vi.fn().mockReturnValue(gameStep),
        getResults: vi.fn().mockReturnValue(gameStep),
        getDynastyResults: vi.fn().mockReturnValue([]),
        createGame: vi.fn().mockReturnValue(gameStep),
        addPlayers: vi.fn().mockReturnValue(gameOptions),
        addExtraRules: vi.fn().mockReturnValue(gameStart),
        startGame: vi.fn().mockReturnValue(gameAction),
        chooseDomino: vi.fn().mockReturnValue(gameAction),
        placeDomino: vi.fn().mockReturnValue(gameAction),
        discardDomino: vi.fn().mockReturnValue(gameAction),
      };
    });

    test("should record createGame action", () => {
      const { engine, getLog } = wrapWithActionLog(mockEngine);

      engine.createGame({ mode: "Classic", seed: "test-seed" });

      const log = getLog();
      expect(log.entries).toHaveLength(1);
      expect(log.entries[0]?.action).toBe("createGame");
      expect(log.entries[0]?.payload).toEqual({
        mode: "Classic",
        seed: "test-seed",
      });
    });

    test("should reset log on createGame (new game = new log)", () => {
      const { engine, getLog } = wrapWithActionLog(mockEngine);

      engine.createGame({ mode: "Classic" });
      engine.addPlayers({
        game: buildGameWithStep(stepAddPlayers),
        players: ["Alice"],
      });
      engine.createGame({ mode: "Classic" });

      const log = getLog();
      expect(log.entries).toHaveLength(1);
      expect(log.entries[0]?.action).toBe("createGame");
    });

    test("should record addPlayers action without game state", () => {
      const { engine, getLog } = wrapWithActionLog(mockEngine);

      engine.createGame({ mode: "Classic" });
      engine.addPlayers({
        game: buildGameWithStep(stepAddPlayers),
        players: ["Alice", "Bob"],
      });

      const log = getLog();
      expect(log.entries).toHaveLength(2);
      expect(log.entries[1]?.action).toBe("addPlayers");
      expect(log.entries[1]?.payload).toEqual({ players: ["Alice", "Bob"] });
    });

    test("should record addExtraRules action", () => {
      const { engine, getLog } = wrapWithActionLog(mockEngine);

      engine.createGame({ mode: "Classic" });
      engine.addExtraRules({
        game: buildGameWithStep(stepOptions),
        extraRules: ["TheMiddleKingdom"],
      });

      const log = getLog();
      expect(log.entries[1]?.action).toBe("addExtraRules");
      expect(log.entries[1]?.payload).toEqual({
        extraRules: ["TheMiddleKingdom"],
      });
    });

    test("should record startGame action", () => {
      const { engine, getLog } = wrapWithActionLog(mockEngine);

      engine.createGame({ mode: "Classic" });
      engine.startGame({ game: buildGameWithStep(stepStart) });

      const log = getLog();
      expect(log.entries[1]?.action).toBe("startGame");
      expect(log.entries[1]?.payload).toEqual({});
    });

    test("should record chooseDomino action", () => {
      const { engine, getLog } = wrapWithActionLog(mockEngine);

      engine.createGame({ mode: "Classic" });
      engine.chooseDomino({
        game: buildGameWithAction(actionPick),
        lordId: "lord-1",
        dominoPick: 42,
      });

      const log = getLog();
      expect(log.entries[1]?.action).toBe("chooseDomino");
      expect(log.entries[1]?.payload).toEqual({
        lordId: "lord-1",
        dominoPick: 42,
      });
    });

    test("should record placeDomino action", () => {
      const { engine, getLog } = wrapWithActionLog(mockEngine);

      engine.createGame({ mode: "Classic" });
      engine.placeDomino({
        game: buildGameWithAction(actionPick),
        lordId: "lord-1",
        position: { x: 5, y: 4 },
        rotation: 90,
      });

      const log = getLog();
      expect(log.entries[1]?.action).toBe("placeDomino");
      expect(log.entries[1]?.payload).toEqual({
        lordId: "lord-1",
        position: { x: 5, y: 4 },
        rotation: 90,
      });
    });

    test("should record discardDomino action", () => {
      const { engine, getLog } = wrapWithActionLog(mockEngine);

      engine.createGame({ mode: "Classic" });
      engine.discardDomino({
        game: buildGameWithAction(actionPick),
        lordId: "lord-1",
      });

      const log = getLog();
      expect(log.entries[1]?.action).toBe("discardDomino");
      expect(log.entries[1]?.payload).toEqual({ lordId: "lord-1" });
    });

    test("should pass through read-only methods without recording", () => {
      const { engine, getLog } = wrapWithActionLog(mockEngine);

      engine.getModes({});
      engine.calculateScore({ kingdom: [] });

      expect(getLog().entries).toHaveLength(0);
    });

    test("should set log gameId from createGame result", () => {
      const gameWithId = buildGameWithStep(stepAddPlayers);
      (mockEngine.createGame as ReturnType<typeof vi.fn>).mockReturnValue(
        gameWithId,
      );

      const { engine, getLog } = wrapWithActionLog(mockEngine);
      engine.createGame({ mode: "Classic" });

      expect(getLog().gameId).toBe(gameWithId.id);
    });
  });

  // ─── replayActions ─────────────────────────────────────────────────

  describe("replayActions", () => {
    let mockEngine: GameEngine;
    const gameStep = buildGameWithStep(stepAddPlayers);
    const gameOptions = buildGameWithStep(stepOptions);
    const gameAction = buildGameWithAction(actionPick, 1);

    beforeEach(() => {
      mockEngine = {
        getModes: vi.fn(),
        getExtraRules: vi.fn(),
        calculateScore: vi.fn(),
        getValidPlacements: vi.fn(),
        canPlaceDomino: vi.fn(),
        serialize: vi.fn(),
        deserialize: vi.fn(),
        getResults: vi.fn(),
        getDynastyResults: vi.fn(),
        createGame: vi.fn().mockReturnValue(gameStep),
        addPlayers: vi.fn().mockReturnValue(gameOptions),
        addExtraRules: vi.fn().mockReturnValue(gameOptions),
        startGame: vi.fn().mockReturnValue(gameAction),
        chooseDomino: vi.fn().mockReturnValue(gameAction),
        placeDomino: vi.fn().mockReturnValue(gameAction),
        discardDomino: vi.fn().mockReturnValue(gameAction),
      };
    });

    test("should replay createGame action", () => {
      let log = createActionLog("game-1");
      log = appendAction(log, {
        action: "createGame",
        payload: { mode: "Classic", seed: "seed-42" },
        turn: 0,
      });

      replayActions(mockEngine, log);

      expect(mockEngine.createGame).toHaveBeenCalledWith({
        mode: "Classic",
        seed: "seed-42",
      });
    });

    test("should replay addPlayers action", () => {
      let log = createActionLog("game-1");
      log = appendAction(log, {
        action: "createGame",
        payload: { mode: "Classic" },
        turn: 0,
      });
      log = appendAction(log, {
        action: "addPlayers",
        payload: { players: ["Alice", "Bob"] },
        turn: 0,
      });

      replayActions(mockEngine, log);

      expect(mockEngine.addPlayers).toHaveBeenCalledWith({
        game: gameStep,
        players: ["Alice", "Bob"],
      });
    });

    test("should replay a sequence of actions in order", () => {
      const callOrder: string[] = [];
      (mockEngine.createGame as ReturnType<typeof vi.fn>).mockImplementation(
        () => {
          callOrder.push("createGame");
          return gameStep;
        },
      );
      (mockEngine.addPlayers as ReturnType<typeof vi.fn>).mockImplementation(
        () => {
          callOrder.push("addPlayers");
          return gameOptions;
        },
      );
      (mockEngine.startGame as ReturnType<typeof vi.fn>).mockImplementation(
        () => {
          callOrder.push("startGame");
          return gameAction;
        },
      );

      let log = createActionLog("game-1");
      log = appendAction(log, {
        action: "createGame",
        payload: { mode: "Classic" },
        turn: 0,
      });
      log = appendAction(log, {
        action: "addPlayers",
        payload: { players: ["Alice", "Bob"] },
        turn: 0,
      });
      log = appendAction(log, {
        action: "startGame",
        payload: {},
        turn: 0,
      });

      replayActions(mockEngine, log);

      expect(callOrder).toEqual(["createGame", "addPlayers", "startGame"]);
    });

    test("should throw on empty log", () => {
      const log = createActionLog("game-1");
      expect(() => replayActions(mockEngine, log)).toThrow(
        "Cannot replay an empty action log",
      );
    });

    test("should replay chooseDomino action", () => {
      let log = createActionLog("game-1");
      log = appendAction(log, {
        action: "createGame",
        payload: { mode: "Classic" },
        turn: 0,
      });
      log = appendAction(log, {
        action: "addPlayers",
        payload: { players: ["Alice", "Bob"] },
        turn: 0,
      });
      (mockEngine.addPlayers as ReturnType<typeof vi.fn>).mockReturnValue(
        buildGameWithStep(stepStart),
      );
      (mockEngine.startGame as ReturnType<typeof vi.fn>).mockReturnValue(
        gameAction,
      );
      log = appendAction(log, { action: "startGame", payload: {}, turn: 0 });
      log = appendAction(log, {
        action: "chooseDomino",
        payload: { lordId: "lord-1", dominoPick: 5 },
        turn: 1,
      });

      replayActions(mockEngine, log);

      expect(mockEngine.chooseDomino).toHaveBeenCalledWith({
        game: gameAction,
        lordId: "lord-1",
        dominoPick: 5,
      });
    });

    test("should replay placeDomino action", () => {
      let log = createActionLog("game-1");
      log = appendAction(log, {
        action: "createGame",
        payload: { mode: "Classic" },
        turn: 0,
      });
      log = appendAction(log, {
        action: "placeDomino",
        payload: { lordId: "lord-1", position: { x: 5, y: 4 }, rotation: 90 },
        turn: 1,
      });

      replayActions(mockEngine, log);

      expect(mockEngine.placeDomino).toHaveBeenCalledWith({
        game: gameStep,
        lordId: "lord-1",
        position: { x: 5, y: 4 },
        rotation: 90,
      });
    });

    test("should replay discardDomino action", () => {
      let log = createActionLog("game-1");
      log = appendAction(log, {
        action: "createGame",
        payload: { mode: "Classic" },
        turn: 0,
      });
      log = appendAction(log, {
        action: "discardDomino",
        payload: { lordId: "lord-1" },
        turn: 1,
      });

      replayActions(mockEngine, log);

      expect(mockEngine.discardDomino).toHaveBeenCalledWith({
        game: gameStep,
        lordId: "lord-1",
      });
    });

    test("should replay addExtraRules action", () => {
      let log = createActionLog("game-1");
      log = appendAction(log, {
        action: "createGame",
        payload: { mode: "Classic" },
        turn: 0,
      });
      log = appendAction(log, {
        action: "addExtraRules",
        payload: { extraRules: ["Harmony"] },
        turn: 0,
      });

      replayActions(mockEngine, log);

      expect(mockEngine.addExtraRules).toHaveBeenCalledWith({
        game: gameStep,
        extraRules: ["Harmony"],
      });
    });
  });
});
