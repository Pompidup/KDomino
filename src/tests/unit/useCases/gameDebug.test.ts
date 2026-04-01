import type {
  GameWithNextAction,
  GameWithNextStep,
} from "@core/domain/types/game.js";
import type { GameEngine } from "@core/portUserside/engine.js";
import {
  type DebugLogEntry,
  type DebugLogger,
  summarizeGameState,
  wrapWithDebug,
} from "@core/useCases/gameDebug.js";
import { describe, expect, test, vi } from "vitest";

// ─── Mock Engine ─────────────────────────────────────────────────────

const stepGame = (step: string, turn = 0): GameWithNextStep =>
  ({
    id: "g1",
    turn,
    nextAction: { type: "step", step },
    players: [{ id: "p1" }, { id: "p2" }],
    dominoes: [{ number: 1 }, { number: 2 }],
    currentDominoes: [{ number: 3 }],
    lords: [{ id: "l1" }, { id: "l2" }],
  }) as unknown as GameWithNextStep;

const actionGame = (action: string, turn = 1): GameWithNextAction =>
  ({
    id: "g1",
    turn,
    nextAction: { type: "action", nextLord: "lord1", nextAction: action },
    players: [{ id: "p1" }, { id: "p2" }],
    dominoes: [{ number: 1 }],
    currentDominoes: [{ number: 2 }, { number: 3 }],
    lords: [{ id: "l1" }, { id: "l2" }],
  }) as unknown as GameWithNextAction;

const createMockEngine = (overrides: Partial<GameEngine> = {}): GameEngine =>
  ({
    getModes: vi.fn().mockReturnValue(["Classic"]),
    getExtraRules: vi.fn().mockReturnValue([]),
    createGame: vi.fn().mockReturnValue(stepGame("addPlayers")),
    addPlayers: vi.fn().mockReturnValue(stepGame("options")),
    addExtraRules: vi.fn().mockReturnValue(stepGame("start")),
    startGame: vi.fn().mockReturnValue(actionGame("pickDomino", 1)),
    chooseDomino: vi.fn().mockReturnValue(actionGame("pickDomino", 1)),
    placeDomino: vi.fn().mockReturnValue(actionGame("placeDomino", 1)),
    discardDomino: vi.fn().mockReturnValue(actionGame("pass", 1)),
    getResults: vi.fn().mockReturnValue({ result: [] }),
    calculateScore: vi.fn().mockReturnValue({ points: 10 }),
    getValidPlacements: vi.fn().mockReturnValue([]),
    canPlaceDomino: vi.fn().mockReturnValue(true),
    serialize: vi.fn().mockReturnValue("{}"),
    deserialize: vi.fn().mockReturnValue(stepGame("addPlayers")),
    getDynastyResults: vi.fn().mockReturnValue([]),
    ...overrides,
  }) as unknown as GameEngine;

const createSpyLogger = (): {
  logger: DebugLogger;
  entries: DebugLogEntry[];
} => {
  const entries: DebugLogEntry[] = [];
  return {
    logger: { log: (entry: DebugLogEntry) => entries.push(entry) },
    entries,
  };
};

// ─── Tests ───────────────────────────────────────────────────────────

describe("GameDebug", () => {
  describe("summarizeGameState", () => {
    test("should summarize a game with next action", () => {
      const game = actionGame("pickDomino", 3);
      const summary = summarizeGameState(game);

      expect(summary).toEqual({
        gameId: "g1",
        turn: 3,
        nextAction: "action:pickDomino",
        playersCount: 2,
        dominoesRemaining: 1,
        currentDominoesCount: 2,
        lordsCount: 2,
      });
    });

    test("should summarize a game with next step", () => {
      const game = stepGame("addPlayers", 0);
      const summary = summarizeGameState(game);

      expect(summary).toEqual({
        gameId: "g1",
        turn: 0,
        nextAction: "step:addPlayers",
        playersCount: 2,
        dominoesRemaining: 2,
        currentDominoesCount: 1,
        lordsCount: 2,
      });
    });
  });

  describe("wrapWithDebug", () => {
    test("should log before and after for state-changing methods", () => {
      const { logger, entries } = createSpyLogger();
      const engine = createMockEngine();
      const wrapped = wrapWithDebug(engine, { logger });

      wrapped.createGame({ mode: "Classic" });

      expect(entries).toHaveLength(2);
      expect(entries[0]?.phase).toBe("before");
      expect(entries[0]?.method).toBe("createGame");
      expect(entries[1]?.phase).toBe("after");
      expect(entries[1]?.method).toBe("createGame");
    });

    test("should log before and after for read-only methods", () => {
      const { logger, entries } = createSpyLogger();
      const engine = createMockEngine();
      const wrapped = wrapWithDebug(engine, { logger });

      wrapped.getModes({});

      expect(entries).toHaveLength(2);
      expect(entries[0]?.method).toBe("getModes");
      expect(entries[1]?.method).toBe("getModes");
    });

    test("should include game state summary in standard level", () => {
      const { logger, entries } = createSpyLogger();
      const engine = createMockEngine();
      const wrapped = wrapWithDebug(engine, { logger, level: "standard" });

      wrapped.createGame({ mode: "Classic" });

      // before: no game in command, so summary is null
      expect(entries[0]?.summary).toBeNull();
      // after: result is a game state, so summary is present
      expect(entries[1]?.summary).not.toBeNull();
      expect(entries[1]?.summary?.gameId).toBe("g1");
      expect(entries[1]?.summary?.nextAction).toBe("step:addPlayers");
    });

    test("should include summary from input game state in before phase", () => {
      const { logger, entries } = createSpyLogger();
      const engine = createMockEngine();
      const wrapped = wrapWithDebug(engine, { logger, level: "standard" });

      wrapped.addPlayers({
        game: stepGame("addPlayers"),
        players: ["Alice", "Bob"],
      });

      expect(entries[0]?.summary).not.toBeNull();
      expect(entries[0]?.summary?.nextAction).toBe("step:addPlayers");
    });

    test("should extract key params in standard level", () => {
      const { logger, entries } = createSpyLogger();
      const engine = createMockEngine();
      const wrapped = wrapWithDebug(engine, { logger, level: "standard" });

      wrapped.createGame({ mode: "Classic" });

      expect(entries[0]?.params).toEqual({ mode: "Classic" });
    });

    test("should not include summary or params in minimal level", () => {
      const { logger, entries } = createSpyLogger();
      const engine = createMockEngine();
      const wrapped = wrapWithDebug(engine, { logger, level: "minimal" });

      wrapped.addPlayers({
        game: stepGame("addPlayers"),
        players: ["Alice", "Bob"],
      });

      expect(entries[0]?.summary).toBeNull();
      expect(entries[0]?.params).toBeUndefined();
      expect(entries[1]?.summary).toBeNull();
    });

    test("should include full state in verbose level", () => {
      const { logger, entries } = createSpyLogger();
      const engine = createMockEngine();
      const wrapped = wrapWithDebug(engine, { logger, level: "verbose" });

      wrapped.createGame({ mode: "Classic" });

      expect(entries[1]?.fullState).toBeDefined();
      expect(entries[1]?.fullState?.id).toBe("g1");
    });

    test("should not include full state in standard level", () => {
      const { logger, entries } = createSpyLogger();
      const engine = createMockEngine();
      const wrapped = wrapWithDebug(engine, { logger, level: "standard" });

      wrapped.createGame({ mode: "Classic" });

      expect(entries[1]?.fullState).toBeUndefined();
    });

    test("should log error phase and re-throw on exception", () => {
      const { logger, entries } = createSpyLogger();
      const error = new Error("Invalid placement");
      const engine = createMockEngine({
        placeDomino: vi.fn().mockImplementation(() => {
          throw error;
        }),
      });
      const wrapped = wrapWithDebug(engine, { logger });

      expect(() =>
        wrapped.placeDomino({
          game: actionGame("placeDomino"),
          lordId: "l1",
          position: { x: 0, y: 0 },
          rotation: 0,
        }),
      ).toThrow("Invalid placement");

      expect(entries).toHaveLength(2);
      expect(entries[1]?.phase).toBe("error");
      expect(entries[1]?.error).toBe("Invalid placement");
    });

    test("should measure duration in milliseconds", () => {
      const { logger, entries } = createSpyLogger();
      const engine = createMockEngine();
      const wrapped = wrapWithDebug(engine, { logger });

      wrapped.createGame({ mode: "Classic" });

      expect(entries[1]?.durationMs).toBeGreaterThanOrEqual(0);
      expect(typeof entries[1]?.durationMs).toBe("number");
    });

    test("should include timestamp in ISO format", () => {
      const { logger, entries } = createSpyLogger();
      const engine = createMockEngine();
      const wrapped = wrapWithDebug(engine, { logger });

      wrapped.createGame({ mode: "Classic" });

      const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
      expect(entries[0]?.timestamp).toMatch(isoRegex);
      expect(entries[1]?.timestamp).toMatch(isoRegex);
    });

    test("should use default console logger when no logger provided", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const engine = createMockEngine();
      const wrapped = wrapWithDebug(engine);

      wrapped.createGame({ mode: "Classic" });

      expect(consoleSpy).toHaveBeenCalledTimes(2);
      expect(consoleSpy.mock.calls[0]?.[0]).toContain("[KDomino:Debug]");
      expect(consoleSpy.mock.calls[0]?.[0]).toContain("createGame");

      consoleSpy.mockRestore();
    });

    test("should use default console.error for error phase in default logger", () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const engine = createMockEngine({
        createGame: vi.fn().mockImplementation(() => {
          throw new Error("boom");
        }),
      });
      const wrapped = wrapWithDebug(engine);

      expect(() => wrapped.createGame({ mode: "Classic" })).toThrow("boom");

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy.mock.calls[0]?.[0]).toContain("ERROR");

      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    test("should delegate to underlying engine methods", () => {
      const { logger } = createSpyLogger();
      const engine = createMockEngine();
      const wrapped = wrapWithDebug(engine, { logger });

      const result = wrapped.createGame({ mode: "Classic" });

      expect(engine.createGame).toHaveBeenCalledWith({ mode: "Classic" });
      expect(result.id).toBe("g1");
    });

    test("should wrap all engine methods", () => {
      const { logger, entries } = createSpyLogger();
      const engine = createMockEngine();
      const wrapped = wrapWithDebug(engine, { logger });

      wrapped.getModes({});
      wrapped.getExtraRules({ mode: "Classic", players: 2 });
      wrapped.createGame({ mode: "Classic" });
      wrapped.addPlayers({
        game: stepGame("addPlayers"),
        players: ["A", "B"],
      });
      wrapped.addExtraRules({
        game: stepGame("options"),
        extraRules: [],
      });
      wrapped.startGame({ game: stepGame("start") });
      wrapped.chooseDomino({
        game: actionGame("pickDomino"),
        lordId: "l1",
        dominoPick: 1,
      });
      wrapped.placeDomino({
        game: actionGame("placeDomino"),
        lordId: "l1",
        position: { x: 0, y: 0 },
        rotation: 0,
      });
      wrapped.discardDomino({
        game: actionGame("pass"),
        lordId: "l1",
      });
      wrapped.calculateScore({
        kingdom: [],
      });
      wrapped.getValidPlacements({
        kingdom: [],
        domino: {} as unknown as Parameters<
          GameEngine["getValidPlacements"]
        >[0]["domino"],
      });
      wrapped.canPlaceDomino({
        kingdom: [],
        domino: {} as unknown as Parameters<
          GameEngine["getValidPlacements"]
        >[0]["domino"],
      });
      wrapped.serialize({ game: stepGame("addPlayers") });
      wrapped.deserialize({ json: "{}" });
      wrapped.getDynastyResults({ games: [] });

      // 15 methods x 2 (before + after) = 30 entries
      expect(entries).toHaveLength(30);

      const methods = [...new Set(entries.map((e) => e.method))];
      expect(methods).toContain("getModes");
      expect(methods).toContain("getExtraRules");
      expect(methods).toContain("createGame");
      expect(methods).toContain("addPlayers");
      expect(methods).toContain("addExtraRules");
      expect(methods).toContain("startGame");
      expect(methods).toContain("chooseDomino");
      expect(methods).toContain("placeDomino");
      expect(methods).toContain("discardDomino");
      expect(methods).toContain("calculateScore");
      expect(methods).toContain("getValidPlacements");
      expect(methods).toContain("canPlaceDomino");
      expect(methods).toContain("serialize");
      expect(methods).toContain("deserialize");
      expect(methods).toContain("getDynastyResults");
    });

    test("should extract chooseDomino params", () => {
      const { logger, entries } = createSpyLogger();
      const engine = createMockEngine();
      const wrapped = wrapWithDebug(engine, { logger });

      wrapped.chooseDomino({
        game: actionGame("pickDomino"),
        lordId: "l1",
        dominoPick: 5,
      });

      expect(entries[0]?.params).toEqual({
        lordId: "l1",
        dominoPick: 5,
      });
    });

    test("should extract placeDomino params", () => {
      const { logger, entries } = createSpyLogger();
      const engine = createMockEngine();
      const wrapped = wrapWithDebug(engine, { logger });

      wrapped.placeDomino({
        game: actionGame("placeDomino"),
        lordId: "l1",
        position: { x: 2, y: 3 },
        rotation: 90,
      });

      expect(entries[0]?.params).toEqual({
        lordId: "l1",
        position: { x: 2, y: 3 },
        rotation: 90,
      });
    });
  });
});
